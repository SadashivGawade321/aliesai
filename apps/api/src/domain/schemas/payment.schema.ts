import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ─── Payment ───────────────────────────────────────────────────────────────
export type PaymentDocument = Payment & Document;
export enum PaymentStatus { PENDING='pending', PROCESSING='processing', COMPLETED='completed', FAILED='failed', REFUNDED='refunded' }
export enum PaymentMethod { UPI='upi', CARD='card', NET_BANKING='net_banking', WALLET='wallet', COD='cod' }

@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  @Prop({ required: true, unique: true }) paymentId: string;
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true }) orderId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) customerId: Types.ObjectId;
  @Prop({ required: true }) amount: number;
  @Prop({ default: 'INR' }) currency: string;
  @Prop({ type: String, enum: PaymentMethod }) method: PaymentMethod;
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Prop() gatewayTransactionId?: string;
  @Prop() gatewayResponse?: string;
  @Prop() failureReason?: string;
  @Prop() paidAt?: Date;
  @Prop({ type: Object }) metadata?: Record<string, any>;
}
export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ orderId: 1 });

// ─── Settlement ────────────────────────────────────────────────────────────
export type SettlementDocument = Settlement & Document;
export enum SettlementOutcome { FULL_RELEASE='full_release', PARTIAL_RELEASE='partial_release', FULL_REFUND='full_refund', PARTIAL_REFUND='partial_refund', COMPENSATION='compensation' }

@Schema({ timestamps: true, collection: 'settlements' })
export class Settlement {
  @Prop({ type: Types.ObjectId, ref: 'EscrowAccount', required: true }) escrowAccountId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true }) orderId: Types.ObjectId;
  @Prop({ type: String, enum: SettlementOutcome, required: true }) outcome: SettlementOutcome;
  @Prop({ required: true }) merchantAmount: number;
  @Prop({ required: true }) customerRefund: number;
  @Prop({ default: 0 }) platformFee: number;
  @Prop({ default: 0 }) deliveryPartnerAmount: number;
  @Prop({ required: true }) ruleApplied: string;
  @Prop({ required: true }) reason: string;
  @Prop({ default: false }) autoSettled: boolean;
  @Prop() settledBy?: string;
  @Prop() settledAt?: Date;
  @Prop({ type: Object }) breakdown?: Record<string, any>;
}
export const SettlementSchema = SchemaFactory.createForClass(Settlement);

// ─── Refund ────────────────────────────────────────────────────────────────
export type RefundDocument = Refund & Document;
export enum RefundStatus { PENDING='pending', PROCESSING='processing', COMPLETED='completed', FAILED='failed' }
export enum RefundReason { CUSTOMER_REQUEST='customer_request', MERCHANT_CANCELLED='merchant_cancelled', DELIVERY_FAILED='delivery_failed', FRAUD_DETECTED='fraud_detected', DISPUTE_RESOLVED='dispute_resolved' }

@Schema({ timestamps: true, collection: 'refunds' })
export class Refund {
  @Prop({ required: true, unique: true }) refundId: string;
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true }) orderId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) customerId: Types.ObjectId;
  @Prop({ required: true }) amount: number;
  @Prop({ type: String, enum: RefundReason, required: true }) reason: RefundReason;
  @Prop({ type: String, enum: RefundStatus, default: RefundStatus.PENDING }) status: RefundStatus;
  @Prop() processedAt?: Date;
  @Prop() notes?: string;
}
export const RefundSchema = SchemaFactory.createForClass(Refund);
