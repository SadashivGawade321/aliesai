import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Order, OrderSchema } from '../../domain/schemas/order.schema';
import { EscrowAccount, EscrowAccountSchema } from '../../domain/schemas/escrow.schema';
import { Settlement, SettlementSchema } from '../../domain/schemas/payment.schema';
import { FraudCase, FraudCaseSchema, InsurancePool, InsurancePoolSchema } from '../../domain/schemas/fraud-trust.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: EscrowAccount.name, schema: EscrowAccountSchema },
      { name: Settlement.name, schema: SettlementSchema },
      { name: FraudCase.name, schema: FraudCaseSchema },
      { name: InsurancePool.name, schema: InsurancePoolSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
