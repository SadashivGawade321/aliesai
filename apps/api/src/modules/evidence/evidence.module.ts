import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { Evidence, EvidenceSchema } from '../../domain/schemas/supporting.schema';
import { OtpLog, OtpLogSchema, GpsLog, GpsLogSchema } from '../../domain/schemas/supporting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evidence.name, schema: EvidenceSchema },
      { name: OtpLog.name, schema: OtpLogSchema },
      { name: GpsLog.name, schema: GpsLogSchema },
    ]),
  ],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
