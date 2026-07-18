import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';
import { Settlement, SettlementSchema } from '../../domain/schemas/payment.schema';
import { EscrowAccount, EscrowAccountSchema } from '../../domain/schemas/escrow.schema';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settlement.name, schema: SettlementSchema },
      { name: EscrowAccount.name, schema: EscrowAccountSchema },
    ]),
    EscrowModule,
  ],
  controllers: [SettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementModule {}
