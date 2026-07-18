import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../../domain/schemas/user.schema';
import { AuditLog, AuditLogDocument } from '../../domain/schemas/supporting.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  async getUsers(page = 1, limit = 20, search?: string) {
    const filter: any = {};
    if (search) filter.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password -mfaSecret').lean(),
      this.userModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async suspendUser(userId: string, adminId: string) {
    await this.userModel.findByIdAndUpdate(userId, { status: UserStatus.SUSPENDED });
    await this.auditModel.create({ userId: adminId, action: 'SUSPEND_USER', resource: 'user', resourceId: userId, timestamp: new Date() });
    return { message: 'User suspended' };
  }

  async activateUser(userId: string, adminId: string) {
    await this.userModel.findByIdAndUpdate(userId, { status: UserStatus.ACTIVE });
    await this.auditModel.create({ userId: adminId, action: 'ACTIVATE_USER', resource: 'user', resourceId: userId, timestamp: new Date() });
    return { message: 'User activated' };
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.auditModel.find().sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      this.auditModel.countDocuments(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
