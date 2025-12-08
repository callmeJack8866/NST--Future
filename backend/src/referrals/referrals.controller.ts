import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';

@ApiTags('referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('user/:address')
  @ApiOperation({ summary: 'Get referrals by referrer address' })
  @ApiParam({ name: 'address', description: 'Referrer wallet address' })
  @ApiResponse({ status: 200, description: 'List of referrals' })
  async getUserReferrals(@Param('address') address: string) {
    return this.referralsService.getReferralsByReferrer(address);
  }

  @Get('user/:address/stats')
  @ApiOperation({ summary: 'Get referral statistics for user' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Referral statistics' })
  async getReferralStats(@Param('address') address: string) {
    return this.referralsService.getReferralStats(address);
  }

  @Get('user/:address/referrer')
  @ApiOperation({ summary: 'Get referrer of user' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Referrer address' })
  async getReferrer(@Param('address') address: string) {
    return this.referralsService.getReferrer(address);
  }
}