import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ─── Merchant Profile ──────────────────────────────────────────────────────
export type MerchantProfileDocument = MerchantProfile & Document;
export enum MerchantStatus { PENDING='pending', VERIFIED='verified', SUSPENDED='suspended', REJECTED='rejected' }

@Schema({ timestamps: true, collection: 'merchant_profiles' })
export class MerchantProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true }) userId: Types.ObjectId;
  @Prop({ required: true }) businessName: string;
  @Prop() businessType?: string;
  @Prop() description?: string;
  @Prop() logo?: string;
  @Prop() coverImage?: string;
  @Prop({ type: String, enum: MerchantStatus, default: MerchantStatus.PENDING }) status: MerchantStatus;
  @Prop() gstin?: string;
  @Prop() panNumber?: string;
  @Prop() bankAccountNumber?: string;
  @Prop() bankIfsc?: string;
  @Prop() bankAccountName?: string;
  @Prop({ type: Object }) address?: Record<string, any>;
  @Prop({ default: 0 }) totalOrders: number;
  @Prop({ default: 0 }) successRate: number;
  @Prop({ default: 0 }) rating: number;
  @Prop({ default: 0 }) totalRevenue: number;
  @Prop({ default: true }) isOpen: boolean;
  @Prop({ type: [String] }) cuisineTypes?: string[];
  @Prop() averageDeliveryTime?: number; // minutes
}
export const MerchantProfileSchema = SchemaFactory.createForClass(MerchantProfile);
MerchantProfileSchema.index({ userId: 1 });

// ─── Delivery Profile ──────────────────────────────────────────────────────
export type DeliveryProfileDocument = DeliveryProfile & Document;
export enum VehicleType { BICYCLE='bicycle', MOTORCYCLE='motorcycle', CAR='car', VAN='van', TRUCK='truck' }
export enum DeliveryStatus { OFFLINE='offline', AVAILABLE='available', ON_DELIVERY='on_delivery', BREAK='break' }

@Schema({ timestamps: true, collection: 'delivery_profiles' })
export class DeliveryProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true }) userId: Types.ObjectId;
  @Prop({ type: String, enum: VehicleType }) vehicleType?: VehicleType;
  @Prop() vehicleNumber?: string;
  @Prop() licenseNumber?: string;
  @Prop() aadharNumber?: string;
  @Prop({ type: String, enum: DeliveryStatus, default: DeliveryStatus.OFFLINE }) status: DeliveryStatus;
  @Prop({ type: [Number] }) currentLocation?: [number, number]; // [lng, lat]
  @Prop({ default: 0 }) totalDeliveries: number;
  @Prop({ default: 0 }) successfulDeliveries: number;
  @Prop({ default: 0 }) rating: number;
  @Prop({ default: 0 }) totalEarnings: number;
  @Prop() lastActiveAt?: Date;
}
export const DeliveryProfileSchema = SchemaFactory.createForClass(DeliveryProfile);
DeliveryProfileSchema.index({ userId: 1 });
DeliveryProfileSchema.index({ status: 1 });

// ─── Session ───────────────────────────────────────────────────────────────
export type SessionDocument = Session & Document;

@Schema({ timestamps: true, collection: 'sessions' })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ required: true, unique: true }) refreshToken: string;
  @Prop({ required: true }) deviceInfo: string;
  @Prop() ipAddress?: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ default: true }) isActive: boolean;
}
export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.index({ userId: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ─── OTP Log ───────────────────────────────────────────────────────────────
export type OtpLogDocument = OtpLog & Document;

@Schema({ timestamps: true, collection: 'otp_logs' })
export class OtpLog {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true }) orderId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) customerId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) deliveryPartnerId?: Types.ObjectId;
  @Prop({ required: true }) otpHash: string; // hashed, never store plain OTP
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ default: false }) verified: boolean;
  @Prop() verifiedAt?: Date;
  @Prop({ default: 0 }) attempts: number;
  @Prop() verificationIp?: string;
}
export const OtpLogSchema = SchemaFactory.createForClass(OtpLog);
OtpLogSchema.index({ orderId: 1 });
OtpLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ─── GPS Log ───────────────────────────────────────────────────────────────
export type GpsLogDocument = GpsLog & Document;

@Schema({ timestamps: true, collection: 'gps_logs' })
export class GpsLog {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true }) orderId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ required: true }) latitude: number;
  @Prop({ required: true }) longitude: number;
  @Prop() accuracy?: number;
  @Prop() speed?: number;
  @Prop() heading?: number;
  @Prop() deviceId?: string;
  @Prop() timestamp: Date;
}
export const GpsLogSchema = SchemaFactory.createForClass(GpsLog);
GpsLogSchema.index({ orderId: 1 });
GpsLogSchema.index({ userId: 1 });
GpsLogSchema.index({ timestamp: -1 });

// ─── Notification ──────────────────────────────────────────────────────────
export type NotificationDocument = Notification & Document;
export enum NotificationChannel { EMAIL='email', SMS='sms', PUSH='push', WEBSOCKET='websocket', WHATSAPP='whatsapp' }
export enum NotificationStatus { PENDING='pending', SENT='sent', FAILED='failed', READ='read' }

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) message: string;
  @Prop({ type: String, enum: NotificationChannel, required: true }) channel: NotificationChannel;
  @Prop({ type: String, enum: NotificationStatus, default: NotificationStatus.PENDING }) status: NotificationStatus;
  @Prop() orderId?: string;
  @Prop() actionUrl?: string;
  @Prop({ type: Object }) data?: Record<string, any>;
  @Prop() readAt?: Date;
  @Prop() sentAt?: Date;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ status: 1 });

// ─── Audit Log ─────────────────────────────────────────────────────────────
export type AuditLogDocument = AuditLog & Document;

@Schema({ collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User' }) userId?: Types.ObjectId;
  @Prop({ required: true }) action: string;
  @Prop({ required: true }) resource: string;
  @Prop() resourceId?: string;
  @Prop({ type: Object }) oldValues?: Record<string, any>;
  @Prop({ type: Object }) newValues?: Record<string, any>;
  @Prop() ipAddress?: string;
  @Prop() userAgent?: string;
  @Prop({ required: true, default: () => new Date() }) timestamp: Date;
  @Prop({ default: 'info' }) severity: string;
}
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });

// ─── Evidence ──────────────────────────────────────────────────────────────
export type EvidenceDocument = Evidence & Document;
export enum EvidenceType { OTP_VERIFICATION='otp_verification', GPS_LOG='gps_log', PHOTO='photo', VIDEO='video', DOCUMENT='document', AUDIT_RECORD='audit_record', FRAUD_REPORT='fraud_report' }

@Schema({ timestamps: true, collection: 'evidence' })
export class Evidence {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true }) orderId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) uploadedBy: Types.ObjectId;
  @Prop({ type: String, enum: EvidenceType, required: true }) evidenceType: EvidenceType;
  @Prop({ required: true }) description: string;
  @Prop() fileUrl?: string;
  @Prop() fileHash?: string; // SHA-256 for immutability verification
  @Prop({ type: Object }) data?: Record<string, any>;
  @Prop({ default: false }) isSealed: boolean; // once sealed, cannot be modified
  @Prop() sealedAt?: Date;
}
export const EvidenceSchema = SchemaFactory.createForClass(Evidence);
EvidenceSchema.index({ orderId: 1 });
EvidenceSchema.index({ evidenceType: 1 });
