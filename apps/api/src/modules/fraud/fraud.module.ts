import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FraudController } from './fraud.controller';
import { FraudService } from './fraud.service';
import { FraudCase, FraudCaseSchema } from '../../domain/schemas/fraud-trust.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: FraudCase.name, schema: FraudCaseSchema }])],
  controllers: [FraudController],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
