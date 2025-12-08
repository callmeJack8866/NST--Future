import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('points')
  @ApiOperation({ summary: 'Get top points holders' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 20)' })
  async getTopPointsHolders(@Query('limit') limit = 20) {
    return this.leaderboardService.getTopPointsHolders(limit);
  }

  @Get('donors')
  @ApiOperation({ summary: 'Get top donors' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopDonors(@Query('limit') limit = 20) {
    return this.leaderboardService.getTopDonors(limit);
  }

  @Get('referrers')
  @ApiOperation({ summary: 'Get top referrers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopReferrers(@Query('limit') limit = 20) {
    return this.leaderboardService.getTopReferrers(limit);
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get fastest growing users' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFastestGrowth(@Query('limit') limit = 20) {
    return this.leaderboardService.getFastestGrowth(limit);
  }
}