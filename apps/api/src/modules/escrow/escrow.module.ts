import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { EscrowAccount, EscrowAccountSchema, EscrowTransaction, EscrowTransactionSchema } from '../../domain/schemas/escrow.schema';
import { AuditLog, AuditLogSchema } from '../../domain/schemas/supporting.schema';
import { InsurancePool, InsurancePoolSchema } from '../../domain/schemas/fraud-trust.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EscrowAccount.name, schema: EscrowAccountSchema },
      { name: EscrowTransaction.name, schema: EscrowTransactionSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: InsurancePool.name, schema: InsurancePoolSchema },
    ]),
  ],
  controllers: [EscrowController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class EscrowModule {}
