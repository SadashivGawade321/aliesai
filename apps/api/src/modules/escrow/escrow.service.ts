import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

import {
  EscrowAccount, EscrowAccountDocument,
  EscrowTransaction, EscrowTransactionDocument,
  EscrowState, ESCROW_TRANSITIONS,
} from '../../domain/schemas/escrow.schema';
import { AuditLog, AuditLogDocument } from '../../domain/schemas/supporting.schema';
import { InsurancePool, InsurancePoolDocument } from '../../domain/schemas/fraud-trust.schema';

@Injectable()
export class EscrowService {
  private readonly INSURANCE_RATE = parseFloat(process.env.INSURANCE_CONTRIBUTION_RATE || '0.005');

  constructor(
    @InjectModel(EscrowAccount.name) private escrowModel: Model<EscrowAccountDocument>,
    @InjectModel(EscrowTransaction.name) private escrowTxModel: Model<EscrowTransactionDocument>,
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
    @InjectModel(InsurancePool.name) private poolModel: Model<InsurancePoolDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── Create Escrow ────────────────────────────────────────────────────
  async createEscrow(data: {
    orderId: string;
    customerId: string;
    merchantId: string;
    totalAmount: number;
  }) {
    const insurance = data.totalAmount * this.INSURANCE_RATE;
    const locked = data.totalAmount - insurance;

    const escrow = await this.escrowModel.create({
      escrowId: `ESC-${uuidv4().slice(0, 8).toUpperCase()}`,
      orderId: new Types.ObjectId(data.orderId),
      customerId: new Types.ObjectId(data.customerId),
      merchantId: new Types.ObjectId(data.merchantId),
      totalAmount: data.totalAmount,
      lockedAmount: locked,
      insuranceContribution: insurance,
      state: EscrowState.PAYMENT_CREATED,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    // Contribute to insurance pool
    await this.updateInsurancePool(insurance);

    await this.logTransition(escrow._id.toString(), null, EscrowState.PAYMENT_CREATED, data.customerId, 'Escrow created');
    this.eventEmitter.emit('escrow.created', { escrowId: escrow.escrowId, orderId: data.orderId, amount: data.totalAmount });

    return escrow;
  }

  // ─── Transition State ─────────────────────────────────────────────────
  async transition(escrowId: string, toState: EscrowState, triggeredBy: string, reason?: string) {
    const escrow = await this.escrowModel.findOne({ escrowId });
    if (!escrow) throw new NotFoundException(`Escrow ${escrowId} not found`);

    const allowed = ESCROW_TRANSITIONS[escrow.state];
    if (!allowed.includes(toState)) {
      throw new BadRequestException(
        `Invalid transition: ${escrow.state} → ${toState}. Allowed: ${allowed.join(', ')}`,
      );
    }

    const fromState = escrow.state;
    escrow.state = toState;

    if (toState === EscrowState.SETTLED) escrow.settledAt = new Date();
    await escrow.save();

    await this.logTransition(escrow._id.toString(), fromState, toState, triggeredBy, reason);
    this.eventEmitter.emit(`escrow.${toState.toLowerCase()}`, {
      escrowId: escrow.escrowId,
      orderId: escrow.orderId,
      fromState,
      toState,
      triggeredBy,
    });

    return escrow;
  }

  // ─── Get Escrow by Order ──────────────────────────────────────────────
  async getEscrowByOrder(orderId: string) {
    return this.escrowModel
      .findOne({ orderId: new Types.ObjectId(orderId) })
      .populate('customerId', 'firstName lastName email')
      .populate('merchantId', 'firstName lastName email')
      .lean();
  }

  // ─── Get Escrow by EscrowId string ────────────────────────────────────
  async getByEscrowId(escrowId: string) {
    return this.escrowModel.findOne({ escrowId })
      .populate('customerId', 'firstName lastName email')
      .populate('merchantId', 'firstName lastName email')
      .lean();
  }

  // ─── Get Customer's Escrows ───────────────────────────────────────────
  async findByCustomer(customerId: string) {
    const data = await this.escrowModel
      .find({ customerId: new Types.ObjectId(customerId) })
      .sort({ createdAt: -1 })
      .populate('orderId', 'orderNumber status items')
      .lean();
    return { data, total: data.length };
  }

  // ─── Get Escrow History ───────────────────────────────────────────────
  async getEscrowHistory(escrowAccountId: string) {
    return this.escrowTxModel
      .find({ escrowAccountId: new Types.ObjectId(escrowAccountId) })
      .sort({ createdAt: 1 })
      .lean();
  }

  // ─── Lock Payment ─────────────────────────────────────────────────────
  async lockPayment(escrowId: string, userId: string) {
    return this.transition(escrowId, EscrowState.PAYMENT_LOCKED, userId, 'Payment verified and locked');
  }

  // ─── Generate OTP (called when driver arrives) ────────────────────────
  async generateOtp(escrowId: string, triggeredBy: string) {
    const escrow = await this.escrowModel.findOne({ escrowId });
    if (!escrow) throw new NotFoundException('Escrow not found');

    // Must be in a state where OTP makes sense
    const allowedStates = [EscrowState.IN_TRANSIT, EscrowState.ARRIVED, EscrowState.OTP_PENDING];
    if (!allowedStates.includes(escrow.state)) {
      throw new BadRequestException(`Cannot generate OTP in state: ${escrow.state}`);
    }

    // Generate 6-digit OTP
    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(plainOtp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.escrowModel.updateOne(
      { escrowId },
      { otpCode: hashedOtp, otpExpiresAt, state: EscrowState.OTP_PENDING },
    );

    await this.logTransition(escrow._id.toString(), escrow.state, EscrowState.OTP_PENDING, triggeredBy, 'OTP generated for delivery verification');
    this.eventEmitter.emit('escrow.otp_generated', { escrowId, orderId: escrow.orderId });

    // Return plaintext OTP to customer (in production → send via SMS/push notification)
    return { otp: plainOtp, expiresAt: otpExpiresAt, message: 'OTP generated. Share this with the driver.' };
  }

  // ─── Verify OTP (called by driver) ────────────────────────────────────
  async verifyOtp(escrowId: string, otp: string, driverId: string) {
    const escrow = await this.escrowModel.findOne({ escrowId });
    if (!escrow) throw new NotFoundException('Escrow not found');

    if (escrow.state !== EscrowState.OTP_PENDING) {
      throw new BadRequestException(`OTP verification not available in state: ${escrow.state}`);
    }

    if (!escrow.otpCode || !escrow.otpExpiresAt) {
      throw new BadRequestException('No OTP has been generated for this escrow');
    }

    if (new Date() > escrow.otpExpiresAt) {
      throw new BadRequestException('OTP has expired. Please ask customer to generate a new one.');
    }

    const isValid = await bcrypt.compare(otp, escrow.otpCode);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    // OTP valid → verify and auto-settle
    await this.escrowModel.updateOne({ escrowId }, { otpVerifiedAt: new Date() });
    await this.transition(escrowId, EscrowState.VERIFIED, driverId, 'OTP verified by driver');
    const settled = await this.transition(escrowId, EscrowState.SETTLED, driverId, 'Automatic settlement after OTP verification');

    this.eventEmitter.emit('escrow.otp_verified', {
      escrowId,
      orderId: escrow.orderId,
      driverId,
      amount: escrow.lockedAmount,
    });

    return { success: true, message: 'OTP verified! Funds released to merchant.', escrow: settled };
  }

  // ─── Settle Escrow ────────────────────────────────────────────────────
  async settle(escrowId: string, userId: string, reason: string) {
    const escrow = await this.transition(escrowId, EscrowState.VERIFIED, userId, reason);
    return this.transition(escrowId, EscrowState.SETTLED, userId, 'Automatic settlement after verification');
  }

  // ─── Refund Escrow ────────────────────────────────────────────────────
  async refund(escrowId: string, userId: string, reason: string) {
    const escrow = await this.escrowModel.findOne({ escrowId });
    if (!escrow) throw new NotFoundException('Escrow not found');
    escrow.refundedAmount = escrow.lockedAmount;
    escrow.releasedAmount = 0;
    await escrow.save();
    return this.transition(escrowId, EscrowState.REFUNDED, userId, reason);
  }

  // ─── Dispute Escrow ───────────────────────────────────────────────────
  async dispute(escrowId: string, userId: string, reason: string) {
    return this.transition(escrowId, EscrowState.DISPUTED, userId, reason);
  }

  // ─── Get All Escrows (admin) ──────────────────────────────────────────
  async findAll(page = 1, limit = 20, state?: EscrowState) {
    const filter: any = {};
    if (state) filter.state = state;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.escrowModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.escrowModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  private async logTransition(escrowAccountId: string, from: EscrowState | null, to: EscrowState, triggeredBy: string, reason?: string) {
    if (from) {
      await this.escrowTxModel.create({ escrowAccountId, fromState: from, toState: to, triggeredBy, reason });
    }
    await this.auditModel.create({
      userId: triggeredBy,
      action: `ESCROW_${to}`,
      resource: 'escrow',
      resourceId: escrowAccountId,
      newValues: { state: to },
      timestamp: new Date(),
    });
  }

  private async updateInsurancePool(amount: number) {
    await this.poolModel.findOneAndUpdate(
      { poolId: 'main' },
      {
        $inc: { totalBalance: amount, totalContributions: amount, transactionCount: 1 },
      },
      { upsert: true, new: true },
    );
  }
}
