import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FraudService } from './fraud.service';
import { FraudCaseStatus } from '../../domain/schemas/fraud-trust.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../domain/schemas/user.schema';

@ApiTags('Fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'fraud', version: '1' })
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all fraud cases' })
  findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: FraudCaseStatus) {
    return this.fraudService.findAll(+page, +limit, status);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Fraud statistics' })
  getStats() {
    return this.fraudService.getStats();
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze fraud risk for a user/order' })
  analyze(@Body() body: any) {
    return this.fraudService.analyzeFraud(body);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resolve a fraud case' })
  resolve(@Param('id') id: string, @Body() body: { resolution: string }, @CurrentUser() user: any) {
    return this.fraudService.resolveCase(id, body.resolution, user._id.toString());
  }
}
