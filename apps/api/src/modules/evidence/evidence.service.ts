import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Evidence, EvidenceDocument, EvidenceType } from '../../domain/schemas/supporting.schema';
import { OtpLog, OtpLogDocument } from '../../domain/schemas/supporting.schema';
import { GpsLog, GpsLogDocument } from '../../domain/schemas/supporting.schema';

@Injectable()
export class EvidenceService {
  constructor(
    @InjectModel(Evidence.name) private evidenceModel: Model<EvidenceDocument>,
    @InjectModel(OtpLog.name) private otpModel: Model<OtpLogDocument>,
    @InjectModel(GpsLog.name) private gpsModel: Model<GpsLogDocument>,
  ) {}

  // ─── OTP Management ───────────────────────────────────────────────────
  async generateOtp(orderId: string, customerId: string, deliveryPartnerId: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await this.otpModel.create({
      orderId: new Types.ObjectId(orderId),
      customerId: new Types.ObjectId(customerId),
      deliveryPartnerId: new Types.ObjectId(deliveryPartnerId),
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    return otp; // Send to customer via SMS/push
  }

  async verifyOtp(orderId: string, otp: string, ip?: string): Promise<boolean> {
    const log = await this.otpModel.findOne({
      orderId: new Types.ObjectId(orderId),
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!log) throw new BadRequestException('OTP expired or not found');
    if (log.attempts >= 3) throw new BadRequestException('Too many OTP attempts');

    const isValid = await bcrypt.compare(otp, log.otpHash);
    await this.otpModel.updateOne({ _id: log._id }, {
      $inc: { attempts: 1 },
      ...(isValid ? { verified: true, verifiedAt: new Date(), verificationIp: ip } : {}),
    });

    // Seal evidence record
    if (isValid) {
      await this.addEvidence({
        orderId,
        uploadedBy: log.customerId.toString(),
        evidenceType: EvidenceType.OTP_VERIFICATION,
        description: `OTP verified for order ${orderId}`,
        data: { verifiedAt: new Date(), ip },
      });
    }

    return isValid;
  }

  // ─── GPS Logging ──────────────────────────────────────────────────────
  async logGps(data: { orderId: string; userId: string; latitude: number; longitude: number; accuracy?: number; deviceId?: string }) {
    return this.gpsModel.create({
      orderId: new Types.ObjectId(data.orderId),
      userId: new Types.ObjectId(data.userId),
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      deviceId: data.deviceId,
      timestamp: new Date(),
    });
  }

  async getGpsHistory(orderId: string) {
    return this.gpsModel.find({ orderId: new Types.ObjectId(orderId) }).sort({ timestamp: 1 }).lean();
  }

  // ─── Evidence Vault ───────────────────────────────────────────────────
  async addEvidence(data: { orderId: string; uploadedBy: string; evidenceType: EvidenceType; description: string; data?: any; fileUrl?: string }) {
    const hash = data.data ? crypto.createHash('sha256').update(JSON.stringify(data.data)).digest('hex') : undefined;
    return this.evidenceModel.create({
      orderId: new Types.ObjectId(data.orderId),
      uploadedBy: new Types.ObjectId(data.uploadedBy),
      evidenceType: data.evidenceType,
      description: data.description,
      data: data.data,
      fileUrl: data.fileUrl,
      fileHash: hash,
      isSealed: true,
      sealedAt: new Date(),
    });
  }

  async getEvidenceForOrder(orderId: string) {
    return this.evidenceModel.find({ orderId: new Types.ObjectId(orderId) })
      .populate('uploadedBy', 'firstName lastName email').lean();
  }
}
