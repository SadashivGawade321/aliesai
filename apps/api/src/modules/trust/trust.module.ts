// Trust, Insurance, Analytics, Admin, Notifications, Evidence — stub modules
// These are fully functional stubs that can be expanded

// ─── Trust Module ────────────────────────────────────────────────────────────
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrustScore, TrustScoreSchema } from '../../domain/schemas/fraud-trust.schema';
import { TrustService } from './trust.service';
import { TrustController } from './trust.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: TrustScore.name, schema: TrustScoreSchema }])],
  controllers: [TrustController],
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
