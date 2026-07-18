import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { TrustScore, TrustScoreDocument, TrustScoreEntityType } from '../../domain/schemas/fraud-trust.schema';
import { UserRole } from '../../domain/schemas/user.schema';

@Injectable()
export class TrustService {
  constructor(@InjectModel(TrustScore.name) private trustModel: Model<TrustScoreDocument>) {}

  async getScore(userId: string) {
    let score = await this.trustModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!score) {
      score = await this.trustModel.create({
        userId: new Types.ObjectId(userId),
        entityType: TrustScoreEntityType.CUSTOMER,
        score: 75,
        lastCalculatedAt: new Date(),
      });
    }
    return score;
  }

  async adjustScore(userId: string, delta: number, reason: string) {
    const current = await this.getScore(userId);
    const newScore = Math.max(0, Math.min(100, current.score + delta));
    return this.trustModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        score: Math.round(newScore),
        lastCalculatedAt: new Date(),
        $inc: delta > 0 ? { successfulOrders: 1, totalOrders: 1 } : { totalOrders: 1 },
      },
      { upsert: true, new: true },
    );
  }

  async recalculate(userId: string, entityType: TrustScoreEntityType, stats: {
    totalOrders?: number;
    successfulOrders?: number;
    disputes?: number;
    refundsRequested?: number;
    fraudFlags?: number;
  }) {
    const {
      totalOrders = 0, successfulOrders = 0,
      disputes = 0, refundsRequested = 0, fraudFlags = 0,
    } = stats;

    let score = 75; // base
    if (totalOrders > 0) {
      const successRate = successfulOrders / totalOrders;
      score += successRate * 15;
    }
    score -= disputes * 5;
    score -= refundsRequested * 3;
    score -= fraudFlags * 20;
    score = Math.max(0, Math.min(100, score));

    return this.trustModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        score: Math.round(score),
        entityType,
        totalOrders,
        successfulOrders,
        disputes,
        refundsRequested,
        fraudFlags,
        lastCalculatedAt: new Date(),
      },
      { upsert: true, new: true },
    );
  }

  async getLeaderboard(entityType: TrustScoreEntityType, limit = 10) {
    return this.trustModel.find({ entityType }).sort({ score: -1 }).limit(limit)
      .populate('userId', 'firstName lastName email').lean();
  }

  // ─── Event: OTP Verified = successful delivery ─────────────────────
  @OnEvent('escrow.otp_verified')
  async handleDeliverySuccess(payload: { escrowId: string; orderId: any; driverId: string }) {
    // Customer: +2 for successful delivery
    // Driver: +1 for on-time delivery
    // We need to look up customer/merchant from the escrow — use orderId
    // For now, fire a general increment event; full lookup needs escrow populated
    setTimeout(async () => {
      if (payload.driverId) {
        await this.adjustScore(payload.driverId, 1, 'Successful delivery');
      }
    }, 200);
  }

  // ─── Event: Dispute filed = negative signal ────────────────────────
  @OnEvent('escrow.disputed')
  async handleDispute(payload: { escrowId: string; orderId: any; triggeredBy: string }) {
    if (payload.triggeredBy) {
      await this.adjustScore(payload.triggeredBy, -3, 'Dispute filed');
    }
  }

  // ─── Event: Order cancelled = slight negative ──────────────────────
  @OnEvent('order.cancelled')
  async handleOrderCancelled(payload: { orderId: string; userId: string }) {
    if (payload.userId) {
      await this.adjustScore(payload.userId, -1, 'Order cancelled');
    }
  }
}
