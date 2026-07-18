import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { ClaimType } from '../../domain/schemas/fraud-trust.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Insurance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'insurance', version: '1' })
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get('pool')
  @ApiOperation({ summary: 'Get insurance pool status' })
  getPool() { return this.insuranceService.getPoolStatus(); }

  @Get('claims')
  @ApiOperation({ summary: 'Get all claims' })
  getClaims(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.insuranceService.getClaims(+page, +limit);
  }

  @Post('claims')
  @ApiOperation({ summary: 'File an insurance claim' })
  fileClaim(@Body() body: { orderId: string; claimType: ClaimType; claimAmount: number; reason: string }, @CurrentUser() user: any) {
    return this.insuranceService.fileClaim({ ...body, claimantId: user._id.toString() });
  }

  @Patch('claims/:id/approve')
  @ApiOperation({ summary: 'Approve a claim (admin)' })
  approveClaim(@Param('id') id: string, @Body() body: { approvedAmount?: number }) {
    return this.insuranceService.approveClaim(id, body.approvedAmount);
  }
}
