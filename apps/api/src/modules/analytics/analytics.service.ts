import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../../domain/schemas/order.schema';
import { EscrowAccount, EscrowAccountDocument, EscrowState } from '../../domain/schemas/escrow.schema';
import { Settlement, SettlementDocument } from '../../domain/schemas/payment.schema';
import { FraudCase, FraudCaseDocument, FraudRiskLevel } from '../../domain/schemas/fraud-trust.schema';
import { InsurancePool, InsurancePoolDocument } from '../../domain/schemas/fraud-trust.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(EscrowAccount.name) private escrowModel: Model<EscrowAccountDocument>,
    @InjectModel(Settlement.name) private settlementModel: Model<SettlementDocument>,
    @InjectModel(FraudCase.name) private fraudModel: Model<FraudCaseDocument>,
    @InjectModel(InsurancePool.name) private poolModel: Model<InsurancePoolDocument>,
  ) {}

  async getDashboardStats() {
    const [
      totalOrders, activeOrders, completedOrders,
      totalEscrowLocked, totalSettled,
      fraudAlerts, criticalFraud,
      pool,
    ] = await Promise.all([
      this.orderModel.countDocuments(),
      this.orderModel.countDocuments({ status: { $in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.IN_TRANSIT] } }),
      this.orderModel.countDocuments({ status: OrderStatus.DELIVERED }),
      this.escrowModel.aggregate([{ $group: { _id: null, total: { $sum: '$lockedAmount' } } }]),
      this.settlementModel.aggregate([{ $group: { _id: null, total: { $sum: '$merchantAmount' } } }]),
      this.fraudModel.countDocuments({ status: 'open' }),
      this.fraudModel.countDocuments({ riskLevel: FraudRiskLevel.CRITICAL }),
      this.poolModel.findOne({ poolId: 'main' }),
    ]);

    return {
      orders: { total: totalOrders, active: activeOrders, completed: completedOrders },
      escrow: { locked: totalEscrowLocked[0]?.total || 0 },
      settlements: { total: totalSettled[0]?.total || 0 },
      fraud: { alerts: fraudAlerts, critical: criticalFraud },
      insurance: {
        poolBalance: pool?.totalBalance || 0,
        totalClaims: pool?.totalClaims || 0,
        lossRatio: pool?.lossRatio || 0,
      },
    };
  }

  async getOrderTrend(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.orderModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      }},
      { $sort: { _id: 1 } },
    ]);
  }

  async getEscrowStateDistribution() {
    return this.escrowModel.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
      { $sort: { count: -1 } },
    ]);
  }

  async getFraudStats() {
    return this.fraudModel.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
    ]);
  }

  async getRevenueMetrics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.settlementModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        merchantPayout: { $sum: '$merchantAmount' },
        platformRevenue: { $sum: '$platformFee' },
        customerRefunds: { $sum: '$customerRefund' },
      }},
      { $sort: { _id: 1 } },
    ]);
  }
}
