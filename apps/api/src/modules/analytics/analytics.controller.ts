import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard KPI stats' })
  getDashboard() { return this.analyticsService.getDashboardStats(); }

  @Get('orders/trend')
  @ApiOperation({ summary: 'Order trend over N days' })
  orderTrend(@Query('days') days = 30) { return this.analyticsService.getOrderTrend(+days); }

  @Get('escrow/distribution')
  @ApiOperation({ summary: 'Escrow state distribution' })
  escrowDist() { return this.analyticsService.getEscrowStateDistribution(); }

  @Get('fraud/stats')
  @ApiOperation({ summary: 'Fraud risk level breakdown' })
  fraudStats() { return this.analyticsService.getFraudStats(); }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue metrics over N days' })
  revenue(@Query('days') days = 30) { return this.analyticsService.getRevenueMetrics(+days); }
}
