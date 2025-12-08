import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':address')
  @ApiOperation({ summary: 'Get user dashboard data' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'User dashboard data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDashboard(@Param('address') address: string) {
    const user = await this.usersService.getUserDashboard(address);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get(':address/referrals')
  @ApiOperation({ summary: 'Get user referrals' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'List of referred users' })
  async getUserReferrals(@Param('address') address: string) {
    return this.usersService.getReferrals(address);
  }
}