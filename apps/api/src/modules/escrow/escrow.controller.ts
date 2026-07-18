import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EscrowService } from './escrow.service';
import { EscrowState } from '../../domain/schemas/escrow.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../domain/schemas/user.schema';

@ApiTags('Escrow')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'escrow', version: '1' })
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all escrow accounts (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'state', enum: EscrowState, required: false })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('state') state?: EscrowState,
  ) {
    return this.escrowService.findAll(+page, +limit, state);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my escrow accounts (customer)' })
  getMyEscrows(@CurrentUser() user: any) {
    return this.escrowService.findByCustomer(user._id.toString());
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get escrow details by order ID' })
  getByOrder(@Param('orderId') orderId: string) {
    return this.escrowService.getEscrowByOrder(orderId);
  }

  @Get(':escrowId')
  @ApiOperation({ summary: 'Get escrow by escrowId' })
  getOne(@Param('escrowId') escrowId: string) {
    return this.escrowService.getByEscrowId(escrowId);
  }

  @Get(':escrowId/history')
  @ApiOperation({ summary: 'Get escrow state transition history' })
  getHistory(@Param('escrowId') escrowId: string) {
    return this.escrowService.getEscrowHistory(escrowId);
  }

  @Post(':escrowId/lock')
  @ApiOperation({ summary: 'Lock payment in escrow' })
  lock(@Param('escrowId') escrowId: string, @CurrentUser() user: any) {
    return this.escrowService.lockPayment(escrowId, user._id);
  }

  @Post(':escrowId/transition')
  @ApiOperation({ summary: 'Transition escrow state' })
  transition(
    @Param('escrowId') escrowId: string,
    @Body() body: { toState: EscrowState; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.escrowService.transition(escrowId, body.toState, user._id, body.reason);
  }

  @Post(':escrowId/settle')
  @ApiOperation({ summary: 'Settle the escrow (release funds to merchant)' })
  settle(
    @Param('escrowId') escrowId: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.escrowService.settle(escrowId, user._id, body.reason || 'OTP verified');
  }

  @Post(':escrowId/generate-otp')
  @ApiOperation({ summary: 'Generate delivery OTP (customer triggers when driver arrives)' })
  generateOtp(
    @Param('escrowId') escrowId: string,
    @CurrentUser() user: any,
  ) {
    return this.escrowService.generateOtp(escrowId, user._id);
  }

  @Post(':escrowId/verify-otp')
  @ApiOperation({ summary: 'Verify OTP to release escrow funds (driver action)' })
  verifyOtp(
    @Param('escrowId') escrowId: string,
    @Body() body: { otp: string },
    @CurrentUser() user: any,
  ) {
    return this.escrowService.verifyOtp(escrowId, body.otp, user._id);
  }

  @Post(':escrowId/refund')
  @ApiOperation({ summary: 'Refund escrow to customer' })
  refund(
    @Param('escrowId') escrowId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.escrowService.refund(escrowId, user._id, body.reason);
  }

  @Post(':escrowId/dispute')
  @ApiOperation({ summary: 'Move escrow to dispute' })
  dispute(
    @Param('escrowId') escrowId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.escrowService.dispute(escrowId, user._id, body.reason);
  }
}
