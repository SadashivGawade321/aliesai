import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
  DELIVERY_PARTNER = 'delivery_partner',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true }) firstName: string;
  @Prop({ required: true, trim: true }) lastName: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  @Prop({ select: false }) password?: string;
  @Prop({ trim: true }) phone?: string;
  @Prop() avatar?: string;
  @Prop({ type: String, enum: UserRole, default: UserRole.CUSTOMER }) role: UserRole;
  @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING_VERIFICATION }) status: UserStatus;
  @Prop({ default: false }) emailVerified: boolean;
  @Prop({ default: false }) phoneVerified: boolean;
  @Prop({ default: false }) mfaEnabled: boolean;
  @Prop({ select: false }) mfaSecret?: string;
  @Prop() googleId?: string;
  @Prop({ default: 0 }) loginAttempts: number;
  @Prop() lockedUntil?: Date;
  @Prop() lastLoginAt?: Date;
  @Prop() lastLoginIp?: string;
  @Prop({ type: Object }) metadata?: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
