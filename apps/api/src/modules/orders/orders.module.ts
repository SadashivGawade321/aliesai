import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from '../../domain/schemas/order.schema';
import { Payment, PaymentSchema } from '../../domain/schemas/payment.schema';
import { EscrowModule } from '../escrow/escrow.module';
import { FraudModule } from '../fraud/fraud.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    EscrowModule,
    FraudModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
