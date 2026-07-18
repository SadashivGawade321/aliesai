import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ─── Fraud Case ────────────────────────────────────────────────────────────
export type FraudCaseDocument = FraudCase & Document;
export enum FraudRiskLevel { LOW='LOW', MEDIUM='MEDIUM', HIGH='HIGH', CRITICAL='CRITICAL' }
export enum FraudType {
  FAKE_REFUND='fake_refund', GPS_MISMATCH='gps_mismatch', FAKE_DELIVERY='fake_delivery',
  REPEATED_CANCELLATION='repeated_cancellation', REFUND_ABUSE='refund_abuse',
  ACCOUNT_FARMING='account_farming', DEVICE_SPOOFING='device_spoofing', VELOCITY_ATTACK='velocity_attack',
}
export enum FraudCaseStatus { OPEN='open', UNDER_REVIEW='under_review', RESOLVED='resolved', DISMISSED='dismissed' }

@Schema({ timestamps: true, collection: 'fraud_cases' })
export class FraudCase {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) suspectUserId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Order' }) orderId?: Types.ObjectId;
  @Prop({ type: [String], enum: FraudType }) fraudTypes: FraudType[];
  @Prop({ type: String, enum: FraudRiskLevel, required: true }) riskLevel: FraudRiskLevel;
  @Prop({ required: true, min: 0, max: 100 }) fraudScore: number;
  @Prop({ type: String, enum: FraudCaseStatus, default: FraudCaseStatus.OPEN }) status: FraudCaseStatus;
  @Prop({ required: true }) description: string;
  @Prop({ type: Object }) evidence?: Record<string, any>;
  @Prop({ type: Object }) aiAnalysis?: Record<string, any>;
  @Prop() reviewedBy?: string;
  @Prop() resolution?: string;
  @Prop() resolvedAt?: Date;
}
export const FraudCaseSchema = SchemaFactory.createForClass(FraudCase);
FraudCaseSchema.index({ suspectUserId: 1 });
FraudCaseSchema.index({ riskLevel: 1 });
FraudCaseSchema.index({ status: 1 });

// ─── Trust Score ───────────────────────────────────────────────────────────
export type TrustScoreDocument = TrustScore & Document;
export enum TrustScoreEntityType { CUSTOMER='customer', MERCHANT='merchant', DELIVERY_PARTNER='delivery_partner' }

@Schema({ timestamps: true, collection: 'trust_scores' })
export class TrustScore {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true }) userId: Types.ObjectId;
  @Prop({ type: String, enum: TrustScoreEntityType, required: true }) entityType: TrustScoreEntityType;
  @Prop({ required: true, min: 0, max: 100, default: 75 }) score: number;
  @Prop({ default: 0 }) totalOrders: number;
  @Prop({ default: 0 }) successfulOrders: number;
  @Prop({ default: 0 }) disputes: number;
  @Prop({ default: 0 }) refundsRequested: number;
  @Prop({ default: 0 }) fraudFlags: number;
  @Prop({ type: Object }) factors?: Record<string, number>;
  @Prop() lastCalculatedAt?: Date;
}
export const TrustScoreSchema = SchemaFactory.createForClass(TrustScore);
TrustScoreSchema.index({ userId: 1 });
TrustScoreSchema.index({ score: -1 });

// ─── Insurance Pool ────────────────────────────────────────────────────────
export type InsurancePoolDocument = InsurancePool & Document;

@Schema({ timestamps: true, collection: 'insurance_pool' })
export class InsurancePool {
  @Prop({ required: true, default: 'main' }) poolId: string;
  @Prop({ required: true, default: 0 }) totalBalance: number;
  @Prop({ default: 0 }) totalContributions: number;
  @Prop({ default: 0 }) totalClaims: number;
  @Prop({ default: 0 }) totalClaimsAmount: number;
  @Prop({ default: 0 }) lossRatio: number; // claims/contributions
  @Prop({ default: 0 }) transactionCount: number;
}
export const InsurancePoolSchema = SchemaFactory.createForClass(InsurancePool);

// ─── Insurance Claim ───────────────────────────────────────────────────────
export type InsuranceClaimDocument = InsuranceClaim & Document;
export enum ClaimStatus { PENDING='pending', APPROVED='approved', REJECTED='rejected', PAID='paid' }
export enum ClaimType { INSTANT_REFUND='instant_refund', RISK_COVERAGE='risk_coverage', COMPENSATION='compensation' }

@Schema({ timestamps: true, collection: 'insurance_claims' })
export class InsuranceClaim {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) claimantId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true }) orderId: Types.ObjectId;
  @Prop({ type: String, enum: ClaimType, required: true }) claimType: ClaimType;
  @Prop({ required: true }) claimAmount: number;
  @Prop({ type: String, enum: ClaimStatus, default: ClaimStatus.PENDING }) status: ClaimStatus;
  @Prop({ required: true }) reason: string;
  @Prop() approvedAmount?: number;
  @Prop() rejectionReason?: string;
  @Prop() processedAt?: Date;
}
export const InsuranceClaimSchema = SchemaFactory.createForClass(InsuranceClaim);
