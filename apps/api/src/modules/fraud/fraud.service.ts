import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { FraudCase, FraudCaseDocument, FraudRiskLevel, FraudType, FraudCaseStatus } from '../../domain/schemas/fraud-trust.schema';

@Injectable()
export class FraudService {
  constructor(
    @InjectModel(FraudCase.name) private fraudModel: Model<FraudCaseDocument>,
    private config: ConfigService,
  ) {}

  async analyzeFraud(data: {
    userId: string;
    orderId?: string;
    orderAmount?: number;
    refundCount?: number;
    cancellationCount?: number;
    deviceId?: string;
    ipAddress?: string;
    gpsData?: any;
  }): Promise<{ score: number; riskLevel: FraudRiskLevel; flags: FraudType[] }> {
    try {
      // Call Python AI service
      const aiUrl = this.config.get('AI_SERVICE_URL', 'http://localhost:8000');
      const response = await axios.post(`${aiUrl}/api/fraud/analyze`, data, {
        timeout: 5000,
        headers: { 'X-API-Key': this.config.get('AI_SERVICE_API_KEY', '') },
      });
      return response.data;
    } catch {
      // Fallback: basic rule-based scoring
      return this.basicFraudAnalysis(data);
    }
  }

  private basicFraudAnalysis(data: any): { score: number; riskLevel: FraudRiskLevel; flags: FraudType[] } {
    let score = 0;
    const flags: FraudType[] = [];

    if ((data.refundCount || 0) > 3) { score += 30; flags.push(FraudType.REFUND_ABUSE); }
    if ((data.cancellationCount || 0) > 5) { score += 20; flags.push(FraudType.REPEATED_CANCELLATION); }
    if (!data.deviceId) { score += 10; flags.push(FraudType.DEVICE_SPOOFING); }

    let riskLevel = FraudRiskLevel.LOW;
    if (score >= 20) riskLevel = FraudRiskLevel.MEDIUM;
    if (score >= 40) riskLevel = FraudRiskLevel.HIGH;
    if (score >= 70) riskLevel = FraudRiskLevel.CRITICAL;

    return { score, riskLevel, flags };
  }

  async createCase(data: {
    suspectUserId: string;
    orderId?: string;
    fraudTypes: FraudType[];
    riskLevel: FraudRiskLevel;
    fraudScore: number;
    description: string;
    evidence?: any;
    aiAnalysis?: any;
  }) {
    return this.fraudModel.create({
      ...data,
      suspectUserId: new Types.ObjectId(data.suspectUserId),
      orderId: data.orderId ? new Types.ObjectId(data.orderId) : undefined,
    });
  }

  async findAll(page = 1, limit = 20, status?: FraudCaseStatus) {
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.fraudModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('suspectUserId', 'firstName lastName email').lean(),
      this.fraudModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveCase(caseId: string, resolution: string, reviewedBy: string) {
    return this.fraudModel.findByIdAndUpdate(
      caseId,
      { status: FraudCaseStatus.RESOLVED, resolution, reviewedBy, resolvedAt: new Date() },
      { new: true },
    );
  }

  async getStats() {
    const [total, open, critical] = await Promise.all([
      this.fraudModel.countDocuments(),
      this.fraudModel.countDocuments({ status: FraudCaseStatus.OPEN }),
      this.fraudModel.countDocuments({ riskLevel: FraudRiskLevel.CRITICAL }),
    ]);
    return { total, open, critical };
  }

  @OnEvent('order.created')
  async handleOrderCreated(payload: { orderId: string; customerId: string }) {
    // Background fraud check on order creation
    setTimeout(async () => {
      const analysis = await this.analyzeFraud({ userId: payload.customerId, orderId: payload.orderId });
      if (analysis.riskLevel === FraudRiskLevel.HIGH || analysis.riskLevel === FraudRiskLevel.CRITICAL) {
        await this.createCase({
          suspectUserId: payload.customerId,
          orderId: payload.orderId,
          fraudTypes: analysis.flags,
          riskLevel: analysis.riskLevel,
          fraudScore: analysis.score,
          description: `Auto-detected fraud risk on order ${payload.orderId}`,
          aiAnalysis: analysis,
        });
      }
    }, 100);
  }
}
