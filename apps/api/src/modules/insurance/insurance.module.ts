import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InsurancePool, InsurancePoolSchema, InsuranceClaim, InsuranceClaimSchema } from '../../domain/schemas/fraud-trust.schema';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';

@Module({
  imports: [MongooseModule.forFeature([
    { name: InsurancePool.name, schema: InsurancePoolSchema },
    { name: InsuranceClaim.name, schema: InsuranceClaimSchema },
  ])],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
