import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';
import { EvidenceType } from '../../domain/schemas/supporting.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Evidence')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'evidence', version: '1' })
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('otp/generate')
  @ApiOperation({ summary: 'Generate OTP for delivery verification' })
  generateOtp(@Body() body: { orderId: string; customerId: string; deliveryPartnerId: string }) {
    return this.evidenceService.generateOtp(body.orderId, body.customerId, body.deliveryPartnerId);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify delivery OTP' })
  verifyOtp(@Body() body: { orderId: string; otp: string }) {
    return this.evidenceService.verifyOtp(body.orderId, body.otp);
  }

  @Post('gps')
  @ApiOperation({ summary: 'Log GPS coordinates for an order' })
  logGps(@Body() body: any, @CurrentUser() user: any) {
    return this.evidenceService.logGps({ ...body, userId: user._id.toString() });
  }

  @Get(':orderId/gps')
  @ApiOperation({ summary: 'Get GPS history for an order' })
  gpsHistory(@Param('orderId') orderId: string) {
    return this.evidenceService.getGpsHistory(orderId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get all evidence for an order' })
  getEvidence(@Param('orderId') orderId: string) {
    return this.evidenceService.getEvidenceForOrder(orderId);
  }
}
