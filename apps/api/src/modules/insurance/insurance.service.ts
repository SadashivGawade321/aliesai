import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InsurancePool, InsurancePoolDocument,
  InsuranceClaim, InsuranceClaimDocument,
  ClaimStatus, ClaimType,
} from '../../domain/schemas/fraud-trust.schema';

@Injectable()
export class InsuranceService {
  constructor(
    @InjectModel(InsurancePool.name) private poolModel: Model<InsurancePoolDocument>,
    @InjectModel(InsuranceClaim.name) private claimModel: Model<InsuranceClaimDocument>,
  ) {}

  async getPoolStatus() {
    let pool = await this.poolModel.findOne({ poolId: 'main' });
    if (!pool) {
      pool = await this.poolModel.create({
        poolId: 'main',
        totalBalance: 0,
        totalContributions: 0,
        totalClaims: 0,
        totalClaimsAmount: 0,
        lossRatio: 0,
        transactionCount: 0,
      });
    }
    return pool;
  }

  async fileClaim(data: {
    claimantId: string;
    orderId: string;
    claimType: ClaimType;
    claimAmount: number;
    reason: string;
  }) {
    const pool = await this.getPoolStatus();
    if (pool.totalBalance < data.claimAmount) {
      throw new Error('Insufficient pool balance');
    }

    const claim = await this.claimModel.create({
      claimantId: new Types.ObjectId(data.claimantId),
      orderId: new Types.ObjectId(data.orderId),
      claimType: data.claimType,
      claimAmount: data.claimAmount,
      reason: data.reason,
    });

    // Auto-approve instant refund claims under ₹500
    if (data.claimType === ClaimType.INSTANT_REFUND && data.claimAmount <= 500) {
      await this.approveClaim(claim._id.toString(), data.claimAmount);
    }

    return claim;
  }

  async approveClaim(claimId: string, approvedAmount?: number) {
    const claim = await this.claimModel.findById(claimId);
    if (!claim) throw new Error('Claim not found');

    const amount = approvedAmount ?? claim.claimAmount;

    await this.claimModel.findByIdAndUpdate(claimId, {
      status: ClaimStatus.APPROVED,
      approvedAmount: amount,
      processedAt: new Date(),
    });

    // Deduct from pool
    await this.poolModel.findOneAndUpdate(
      { poolId: 'main' },
      { $inc: { totalBalance: -amount, totalClaims: 1, totalClaimsAmount: amount } },
    );

    // Update loss ratio
    const pool = await this.getPoolStatus();
    if (pool.totalContributions > 0) {
      await this.poolModel.findOneAndUpdate(
        { poolId: 'main' },
        { lossRatio: pool.totalClaimsAmount / pool.totalContributions },
      );
    }

    return this.claimModel.findById(claimId);
  }

  async getClaims(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.claimModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('claimantId', 'firstName lastName email').lean(),
      this.claimModel.countDocuments(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
