// Remaining NestJS stubs for: Admin, Notifications, Evidence, Cache
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../../domain/schemas/user.schema';
import { AuditLog, AuditLogSchema } from '../../domain/schemas/supporting.schema';
import { MerchantProfile, MerchantProfileSchema, DeliveryProfile, DeliveryProfileSchema } from '../../domain/schemas/supporting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: MerchantProfile.name, schema: MerchantProfileSchema },
      { name: DeliveryProfile.name, schema: DeliveryProfileSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
