import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OnEvent } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import {
  Notification, NotificationDocument,
  NotificationChannel, NotificationStatus,
} from '../../domain/schemas/supporting.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notifModel: Model<NotificationDocument>,
  ) {}

  async send(data: {
    userId: string;
    title: string;
    message: string;
    channel: NotificationChannel;
    orderId?: string;
    actionUrl?: string;
    notificationData?: any;
  }) {
    const notif = await this.notifModel.create({
      userId: new Types.ObjectId(data.userId),
      title: data.title,
      message: data.message,
      channel: data.channel,
      orderId: data.orderId,
      actionUrl: data.actionUrl,
      data: data.notificationData,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });

    // Log to console (in production: send via email/SMS provider)
    console.log(`📨 [${data.channel.toUpperCase()}] → ${data.userId}: ${data.title}`);

    return notif;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.notifModel.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.notifModel.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markRead(notifId: string) {
    return this.notifModel.findByIdAndUpdate(notifId, { status: NotificationStatus.READ, readAt: new Date() }, { new: true });
  }

  @OnEvent('order.created')
  async notifyOrderCreated(payload: { orderId: string; merchantId: string }) {
    await this.send({
      userId: payload.merchantId,
      title: 'New Order Received',
      message: `Order ${payload.orderId} requires your attention.`,
      channel: NotificationChannel.WEBSOCKET,
      orderId: payload.orderId,
    });
  }

  @OnEvent('escrow.SETTLED')
  async notifySettlement(payload: any) {
    await this.send({
      userId: payload.triggeredBy,
      title: '✅ Payment Settled',
      message: `Escrow ${payload.escrowId} has been settled successfully.`,
      channel: NotificationChannel.WEBSOCKET,
    });
  }
}
