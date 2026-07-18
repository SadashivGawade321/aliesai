import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../domain/schemas/user.schema';

@ApiTags('Admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users with search & pagination' })
  getUsers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    return this.adminService.getUsers(+page, +limit, search);
  }

  @Patch('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend a user account' })
  suspend(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.suspendUser(id, user._id.toString());
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Activate a suspended user account' })
  activate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.activateUser(id, user._id.toString());
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get immutable audit logs' })
  auditLogs(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.getAuditLogs(+page, +limit);
  }
}
