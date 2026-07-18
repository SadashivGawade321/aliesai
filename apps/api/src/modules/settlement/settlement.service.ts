import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { Settlement, SettlementDocument, SettlementOutcome } from '../../domain/schemas/payment.schema';
import { EscrowAccount, EscrowAccountDocument, EscrowState } from '../../domain/schemas/escrow.schema';
import { FraudCase, FraudCaseDocument, FraudRiskLevel } from '../../domain/schemas/fraud-trust.schema';
import { EscrowService } from '../escrow/escrow.service';

export interface SettlementRule {
  name: string;
  condition: (ctx: SettlementContext) => boolean;
  action: (ctx: SettlementContext) => SettlementDecision;
  priority: number;
}

export interface SettlementContext {
  escrow: EscrowAccountDocument;
  otpVerified: boolean;
  customerAvailable: boolean;
  deliverySuccess: boolean;
  fraudScore: number;
  fraudRiskLevel: string;
}

export interface SettlementDecision {
  outcome: SettlementOutcome;
  merchantAmount: number;
  customerRefund: number;
  deliveryPartnerAmount: number;
  platformFee: number;
  reason: string;
  ruleApplied: string;
}

@Injectable()
export class SettlementService {
  // Programmable settlement rules (ordered by priority)
  private readonly rules: SettlementRule[] = [
    {
      name: 'FRAUD_CRITICAL_RULE',
      priority: 1,
      condition: (ctx) => ctx.fraudRiskLevel === FraudRiskLevel.CRITICAL,
      action: (ctx) => ({
        outcome: SettlementOutcome.FULL_REFUND,
        merchantAmount: 0,
        customerRefund: ctx.escrow.lockedAmount,
        deliveryPartnerAmount: 0,
        platformFee: 0,
        reason: 'Critical fraud detected — full refund issued',
        ruleApplied: 'FRAUD_CRITICAL_RULE',
      }),
    },
    {
      name: 'OTP_VERIFIED_RULE',
      priority: 2,
      condition: (ctx) => ctx.otpVerified && ctx.deliverySuccess,
      action: (ctx) => {
        const platformFee = ctx.escrow.lockedAmount * 0.02;
        const deliveryFee = ctx.escrow.lockedAmount * 0.08;
        const merchantAmount = ctx.escrow.lockedAmount - platformFee - deliveryFee;
        return {
          outcome: SettlementOutcome.FULL_RELEASE,
          merchantAmount,
          customerRefund: 0,
          deliveryPartnerAmount: deliveryFee,
          platformFee,
          reason: 'OTP verified and delivery successful',
          ruleApplied: 'OTP_VERIFIED_RULE',
        };
      },
    },
    {
      name: 'CUSTOMER_UNAVAILABLE_RULE',
      priority: 3,
      condition: (ctx) => !ctx.customerAvailable && ctx.deliverySuccess,
      action: (ctx) => {
        const merchantAmount = ctx.escrow.lockedAmount * 0.7;
        const customerRefund = ctx.escrow.lockedAmount * 0.2;
        const platformFee = ctx.escrow.lockedAmount * 0.1;
        return {
          outcome: SettlementOutcome.PARTIAL_RELEASE,
          merchantAmount,
          customerRefund,
          deliveryPartnerAmount: 0,
          platformFee,
          reason: 'Customer unavailable — partial settlement applied',
          ruleApplied: 'CUSTOMER_UNAVAILABLE_RULE',
        };
      },
    },
    {
      name: 'DELIVERY_FAILED_RULE',
      priority: 4,
      condition: (ctx) => !ctx.deliverySuccess,
      action: (ctx) => ({
        outcome: SettlementOutcome.FULL_REFUND,
        merchantAmount: 0,
        customerRefund: ctx.escrow.lockedAmount,
        deliveryPartnerAmount: 0,
        platformFee: 0,
        reason: 'Delivery failed — full refund to customer',
        ruleApplied: 'DELIVERY_FAILED_RULE',
      }),
    },
    {
      name: 'HIGH_FRAUD_RULE',
      priority: 5,
      condition: (ctx) => ctx.fraudRiskLevel === FraudRiskLevel.HIGH,
      action: (ctx) => ({
        outcome: SettlementOutcome.PARTIAL_REFUND,
        merchantAmount: ctx.escrow.lockedAmount * 0.5,
        customerRefund: ctx.escrow.lockedAmount * 0.5,
        deliveryPartnerAmount: 0,
        platformFee: 0,
        reason: 'High fraud risk — partial refund pending review',
        ruleApplied: 'HIGH_FRAUD_RULE',
      }),
    },
    {
      name: 'DEFAULT_RULE',
      priority: 99,
      condition: (_ctx) => true,
      action: (ctx) => ({
        outcome: SettlementOutcome.FULL_RELEASE,
        merchantAmount: ctx.escrow.lockedAmount * 0.9,
        customerRefund: 0,
        deliveryPartnerAmount: ctx.escrow.lockedAmount * 0.08,
        platformFee: ctx.escrow.lockedAmount * 0.02,
        reason: 'Default settlement rule applied',
        ruleApplied: 'DEFAULT_RULE',
      }),
    },
  ];

  constructor(
    @InjectModel(Settlement.name) private settlementModel: Model<SettlementDocument>,
    @InjectModel(EscrowAccount.name) private escrowModel: Model<EscrowAccountDocument>,
    private escrowService: EscrowService,
  ) {}

  async processSettlement(escrowId: string, context: Partial<SettlementContext>, settledBy?: string) {
    const escrow = await this.escrowModel.findOne({ escrowId });
    if (!escrow) throw new Error(`Escrow ${escrowId} not found`);

    const ctx: SettlementContext = {
      escrow,
      otpVerified: context.otpVerified ?? false,
      customerAvailable: context.customerAvailable ?? true,
      deliverySuccess: context.deliverySuccess ?? true,
      fraudScore: context.fraudScore ?? 0,
      fraudRiskLevel: context.fraudRiskLevel ?? FraudRiskLevel.LOW,
    };

    // Apply first matching rule (sorted by priority)
    const sortedRules = [...this.rules].sort((a, b) => a.priority - b.priority);
    const matchedRule = sortedRules.find((r) => r.condition(ctx));
    const decision = matchedRule!.action(ctx);

    const settlement = await this.settlementModel.create({
      escrowAccountId: escrow._id,
      orderId: escrow.orderId,
      ...decision,
      autoSettled: !settledBy,
      settledBy,
      settledAt: new Date(),
      breakdown: ctx,
    });

    // Update escrow amounts
    await this.escrowModel.updateOne(
      { _id: escrow._id },
      {
        releasedAmount: decision.merchantAmount,
        refundedAmount: decision.customerRefund,
      },
    );

    return { settlement, decision };
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.settlementModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.settlementModel.countDocuments(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  @OnEvent('escrow.verified')
  async handleAutoSettlement(payload: any) {
    try {
      await this.processSettlement(payload.escrowId, { otpVerified: true, deliverySuccess: true });
    } catch (e) {
      console.error('Auto settlement failed:', e.message);
    }
  }
}
