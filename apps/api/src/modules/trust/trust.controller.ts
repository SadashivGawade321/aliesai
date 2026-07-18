import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrustService } from './trust.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Trust')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'trust', version: '1' })
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get trust score for a user' })
  getScore(@Param('userId') userId: string) {
    return this.trustService.getScore(userId);
  }
}
