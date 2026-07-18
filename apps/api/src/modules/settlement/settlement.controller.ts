import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../domain/schemas/user.schema';

@ApiTags('Settlement')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'settlement', version: '1' })
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all settlements' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.settlementService.findAll(+page, +limit);
  }

  @Post(':escrowId/process')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually process settlement for an escrow' })
  process(
    @Param('escrowId') escrowId: string,
    @Body() ctx: {
      otpVerified?: boolean;
      customerAvailable?: boolean;
      deliverySuccess?: boolean;
      fraudScore?: number;
      fraudRiskLevel?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.settlementService.processSettlement(escrowId, ctx, user._id);
  }
}
