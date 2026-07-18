import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderStatus, OrderType } from '../../domain/schemas/order.schema';
import { PaymentMethod } from '../../domain/schemas/payment.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order (creates payment + escrow automatically)' })
  create(
    @Body() body: {
      merchantId: string;
      orderType: OrderType;
      items: any[];
      deliveryAddress?: any;
      paymentMethod: PaymentMethod;
    },
    @CurrentUser() user: any,
  ) {
    return this.ordersService.createOrder({ ...body, customerId: user._id.toString() });
  }

  @Get()
  @ApiOperation({ summary: 'Get my orders' })
  myOrders(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    if (user.role === 'merchant') {
      return this.ordersService.findByMerchant(user._id.toString(), +page, +limit);
    } else if (user.role === 'delivery_partner') {
      return this.ordersService.findByDriver(user._id.toString(), +page, +limit);
    }
    return this.ordersService.findByCustomer(user._id.toString(), +page, +limit);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all orders (admin)' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAll(+page, +limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, body.status, user._id.toString());
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.ordersService.cancelOrder(id, user._id.toString(), body.reason);
  }

  @Patch(':id/assign-driver')
  @ApiOperation({ summary: 'Assign delivery partner to order' })
  assignDriver(@Param('id') id: string, @Body() body: { deliveryPartnerId: string }) {
    return this.ordersService.assignDeliveryPartner(id, body.deliveryPartnerId);
  }
}
