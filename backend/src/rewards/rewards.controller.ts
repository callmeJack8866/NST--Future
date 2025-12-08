import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';

@ApiTags('rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('nst/user/:address')
  @ApiOperation({ summary: 'Get NST rewards by user address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'NST reward history' })
  async getNstRewards(@Param('address') address: string) {
    return this.rewardsService.getNstRewardsByUser(address);
  }

  @Get('nst/user/:address/summary')
  @ApiOperation({ summary: 'Get NST reward summary' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'NST reward summary' })
  async getNstRewardSummary(@Param('address') address: string) {
    return this.rewardsService.getNstRewardSummary(address);
  }

  @Get('points/user/:address')
  @ApiOperation({ summary: 'Get points history by user' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Points history' })
  async getPointsHistory(
    @Param('address') address: string,
    @Query('limit') limit = 50,
  ) {
    return this.rewardsService.getPointsHistoryByUser(address, limit);
  }

  @Get('points/user/:address/summary')
  @ApiOperation({ summary: 'Get points summary' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Points summary' })
  async getPointsSummary(@Param('address') address: string) {
    return this.rewardsService.getPointsSummary(address);
  }
}