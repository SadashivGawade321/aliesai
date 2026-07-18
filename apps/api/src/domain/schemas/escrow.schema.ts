import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EscrowAccountDocument = EscrowAccount & Document;
export type EscrowTransactionDocument = EscrowTransaction & Document;

export enum EscrowState {
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_LOCKED = 'PAYMENT_LOCKED',
  MERCHANT_ACCEPTED = 'MERCHANT_ACCEPTED',
  COOKING_STARTED = 'COOKING_STARTED',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  OTP_PENDING = 'OTP_PENDING',
  VERIFIED = 'VERIFIED',
  SETTLED = 'SETTLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

// Valid state transitions map
export const ESCROW_TRANSITIONS: Record<EscrowState, EscrowState[]> = {
  [EscrowState.PAYMENT_CREATED]: [EscrowState.PAYMENT_LOCKED, EscrowState.CANCELLED],
  [EscrowState.PAYMENT_LOCKED]: [EscrowState.MERCHANT_ACCEPTED, EscrowState.CANCELLED, EscrowState.REFUNDED],
  [EscrowState.MERCHANT_ACCEPTED]: [EscrowState.COOKING_STARTED, EscrowState.CANCELLED],
  [EscrowState.COOKING_STARTED]: [EscrowState.READY_FOR_PICKUP],
  [EscrowState.READY_FOR_PICKUP]: [EscrowState.PICKED_UP],
  [EscrowState.PICKED_UP]: [EscrowState.IN_TRANSIT],
  [EscrowState.IN_TRANSIT]: [EscrowState.ARRIVED, EscrowState.DISPUTED],
  [EscrowState.ARRIVED]: [EscrowState.OTP_PENDING],
  [EscrowState.OTP_PENDING]: [EscrowState.VERIFIED, EscrowState.DISPUTED],
  [EscrowState.VERIFIED]: [EscrowState.SETTLED],
  [EscrowState.SETTLED]: [],
  [EscrowState.REFUNDED]: [],
  [EscrowState.PARTIALLY_REFUNDED]: [EscrowState.SETTLED],
  [EscrowState.DISPUTED]: [EscrowState.SETTLED, EscrowState.REFUNDED, EscrowState.PARTIALLY_REFUNDED],
  [EscrowState.CANCELLED]: [],
};

@Schema({ timestamps: true, collection: 'escrow_accounts' })
export class EscrowAccount {
  @Prop({ required: true, unique: true }) escrowId: string;
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true }) orderId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) customerId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) merchantId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) deliveryPartnerId?: Types.ObjectId;
  @Prop({ required: true }) totalAmount: number;
  @Prop({ default: 0 }) lockedAmount: number;
  @Prop({ default: 0 }) releasedAmount: number;
  @Prop({ default: 0 }) refundedAmount: number;
  @Prop({ default: 0 }) insuranceContribution: number;
  @Prop({ type: String, enum: EscrowState, default: EscrowState.PAYMENT_CREATED }) state: EscrowState;
  @Prop() settledAt?: Date;
  @Prop() expiresAt?: Date;
  @Prop() otpCode?: string;          // Hashed OTP stored here
  @Prop() otpExpiresAt?: Date;       // OTP validity window (10 min)
  @Prop() otpVerifiedAt?: Date;      // When OTP was verified
  @Prop({ type: Object }) metadata?: Record<string, any>;
}

export const EscrowAccountSchema = SchemaFactory.createForClass(EscrowAccount);
EscrowAccountSchema.index({ orderId: 1 });
EscrowAccountSchema.index({ customerId: 1 });
EscrowAccountSchema.index({ state: 1 });

@Schema({ timestamps: true, collection: 'escrow_transactions' })
export class EscrowTransaction {
  @Prop({ type: Types.ObjectId, ref: 'EscrowAccount', required: true }) escrowAccountId: Types.ObjectId;
  @Prop({ type: String, enum: EscrowState, required: true }) fromState: EscrowState;
  @Prop({ type: String, enum: EscrowState, required: true }) toState: EscrowState;
  @Prop({ required: true }) triggeredBy: string; // userId
  @Prop() reason?: string;
  @Prop({ type: Object }) metadata?: Record<string, any>;
}

export const EscrowTransactionSchema = SchemaFactory.createForClass(EscrowTransaction);
EscrowTransactionSchema.index({ escrowAccountId: 1 });
