import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum OrderType {
  FOOD_DELIVERY = 'food_delivery',
  TRAIN_FOOD = 'train_food',
  GROCERY = 'grocery',
  MEDICINE = 'medicine',
  LOGISTICS = 'logistics',
  GIG = 'gig',
  MARKETPLACE = 'marketplace',
}

@Schema({ _id: false })
class OrderItem {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) quantity: number;
  @Prop({ required: true }) unitPrice: number;
  @Prop({ required: true }) totalPrice: number;
  @Prop() imageUrl?: string;
  @Prop() notes?: string;
}

@Schema({ _id: false })
class DeliveryAddress {
  @Prop({ required: true }) line1: string;
  @Prop() line2?: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true }) state: string;
  @Prop({ required: true }) pincode: string;
  @Prop({ required: true }) country: string;
  @Prop({ type: [Number] }) coordinates?: [number, number]; // [lng, lat]
}

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true, unique: true }) orderNumber: string;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) customerId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) merchantId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) deliveryPartnerId?: Types.ObjectId;
  @Prop({ type: String, enum: OrderType, required: true }) orderType: OrderType;
  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING }) status: OrderStatus;
  @Prop({ type: [OrderItem], required: true }) items: OrderItem[];
  @Prop({ required: true }) subtotal: number;
  @Prop({ default: 0 }) deliveryFee: number;
  @Prop({ default: 0 }) taxes: number;
  @Prop({ default: 0 }) discount: number;
  @Prop({ required: true }) totalAmount: number;
  @Prop({ type: DeliveryAddress }) deliveryAddress?: DeliveryAddress;
  @Prop() pickupAddress?: string;
  @Prop() specialInstructions?: string;
  @Prop() estimatedDeliveryTime?: Date;
  @Prop() actualDeliveryTime?: Date;
  @Prop() cancellationReason?: string;
  @Prop({ type: Types.ObjectId, ref: 'Payment' }) paymentId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'EscrowAccount' }) escrowAccountId?: Types.ObjectId;
  @Prop({ type: Object }) metadata?: Record<string, any>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ merchantId: 1 });
OrderSchema.index({ deliveryPartnerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ createdAt: -1 });
