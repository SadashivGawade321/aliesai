import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderDocument, OrderStatus, OrderType } from '../../domain/schemas/order.schema';
import { Payment, PaymentDocument, PaymentMethod, PaymentStatus } from '../../domain/schemas/payment.schema';
import { EscrowService } from '../escrow/escrow.service';
import { FraudService } from '../fraud/fraud.service';
import { FraudRiskLevel } from '../../domain/schemas/fraud-trust.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private escrowService: EscrowService,
    private fraudService: FraudService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createOrder(data: {
    customerId: string;
    merchantId: string;
    orderType: OrderType;
    items: any[];
    deliveryAddress?: any;
    paymentMethod: PaymentMethod;
  }) {
    // Calculate totals
    const subtotal = data.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const deliveryFee = 40;
    const taxes = subtotal * 0.05;
    const totalAmount = subtotal + deliveryFee + taxes;

    // Create order
    const order = await this.orderModel.create({
      orderNumber: `AGP-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`,
      customerId: new Types.ObjectId(data.customerId),
      merchantId: new Types.ObjectId(data.merchantId),
      orderType: data.orderType,
      status: OrderStatus.PENDING,
      items: data.items.map(i => ({ ...i, totalPrice: i.unitPrice * i.quantity })),
      subtotal,
      deliveryFee,
      taxes,
      totalAmount,
      deliveryAddress: data.deliveryAddress,
    });

    // Create payment record
    const payment = await this.paymentModel.create({
      paymentId: `PAY-${uuidv4().slice(0, 8).toUpperCase()}`,
      orderId: order._id,
      customerId: new Types.ObjectId(data.customerId),
      amount: totalAmount,
      method: data.paymentMethod,
      status: PaymentStatus.PROCESSING,
    });

    // Create escrow
    const escrow = await this.escrowService.createEscrow({
      orderId: order._id.toString(),
      customerId: data.customerId,
      merchantId: data.merchantId,
      totalAmount,
    });

    // Update order with references
    await this.orderModel.updateOne(
      { _id: order._id },
      { paymentId: payment._id, escrowAccountId: escrow._id },
    );

    // Simulate payment success → lock escrow
    await this.paymentModel.updateOne({ _id: payment._id }, { status: PaymentStatus.COMPLETED, paidAt: new Date() });
    await this.escrowService.lockPayment(escrow.escrowId, data.customerId);

    // ── Fraud Check (synchronous — auto-block if CRITICAL) ────────────────
    const fraudResult = await this.fraudService.analyzeFraud({
      userId: data.customerId,
      orderId: order._id.toString(),
      orderAmount: totalAmount,
    });

    if (fraudResult.riskLevel === FraudRiskLevel.CRITICAL) {
      // Auto-cancel order and refund escrow
      await this.orderModel.updateOne(
        { _id: order._id },
        { status: OrderStatus.CANCELLED, cancellationReason: 'Auto-blocked: CRITICAL fraud detected' },
      );
      await this.escrowService.refund(escrow.escrowId, 'system', 'CRITICAL fraud auto-block');
      await this.fraudService.createCase({
        suspectUserId: data.customerId,
        orderId: order._id.toString(),
        fraudTypes: fraudResult.flags as any,
        riskLevel: fraudResult.riskLevel,
        fraudScore: fraudResult.score,
        description: `CRITICAL fraud auto-blocked on order creation. Score: ${fraudResult.score}`,
        aiAnalysis: fraudResult,
      });
      throw new BadRequestException(
        'Order blocked by fraud detection system. If this is an error, contact support.',
      );
    }

    // Create fraud case for HIGH risk (flag but allow)
    if (fraudResult.riskLevel === FraudRiskLevel.HIGH) {
      await this.fraudService.createCase({
        suspectUserId: data.customerId,
        orderId: order._id.toString(),
        fraudTypes: fraudResult.flags as any,
        riskLevel: fraudResult.riskLevel,
        fraudScore: fraudResult.score,
        description: `HIGH fraud risk flagged for review. Score: ${fraudResult.score}`,
        aiAnalysis: fraudResult,
      });
    }

    this.eventEmitter.emit('order.created', { orderId: order._id, customerId: data.customerId, merchantId: data.merchantId });

    return {
      order: await this.orderModel.findById(order._id),
      payment,
      escrow,
    };
  }

  async updateStatus(orderId: string, status: OrderStatus, userId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    await this.orderModel.updateOne({ _id: orderId }, { status });
    this.eventEmitter.emit(`order.${status}`, { orderId, userId });
    return this.orderModel.findById(orderId);
  }

  async findById(id: string) {
    return this.orderModel
      .findById(id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('merchantId', 'firstName lastName email')
      .populate('deliveryPartnerId', 'firstName lastName email phone')
      .lean();
  }

  async findByCustomer(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.orderModel.find({ customerId: new Types.ObjectId(customerId) })
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('escrowAccountId', 'escrowId state')
        .populate('merchantId', 'firstName lastName email')
        .lean(),
      this.orderModel.countDocuments({ customerId: new Types.ObjectId(customerId) }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByMerchant(merchantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.orderModel.find({ merchantId: new Types.ObjectId(merchantId) })
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('escrowAccountId', 'escrowId state')
        .populate('customerId', 'firstName lastName email')
        .lean(),
      this.orderModel.countDocuments({ merchantId: new Types.ObjectId(merchantId) }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByDriver(deliveryPartnerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.orderModel.find({ deliveryPartnerId: new Types.ObjectId(deliveryPartnerId) })
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('escrowAccountId', 'escrowId state')
        .populate('customerId', 'firstName lastName email phone')
        .populate('merchantId', 'firstName lastName email')
        .lean(),
      this.orderModel.countDocuments({ deliveryPartnerId: new Types.ObjectId(deliveryPartnerId) }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAll(page = 1, limit = 20, status?: OrderStatus) {
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.orderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.orderModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async cancelOrder(orderId: string, userId: string, reason: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');
    await this.orderModel.updateOne({ _id: orderId }, { status: OrderStatus.CANCELLED, cancellationReason: reason });
    this.eventEmitter.emit('order.cancelled', { orderId, userId, reason });
    return { message: 'Order cancelled successfully' };
  }

  async assignDeliveryPartner(orderId: string, deliveryPartnerId: string) {
    await this.orderModel.updateOne({ _id: orderId }, { deliveryPartnerId: new Types.ObjectId(deliveryPartnerId) });
    return this.orderModel.findById(orderId);
  }
}
