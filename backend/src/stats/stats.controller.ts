import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('global')
  @ApiOperation({ summary: 'Get global platform statistics' })
  @ApiResponse({ status: 200, description: 'Global statistics' })
  async getGlobalStats() {
    return this.statsService.getGlobalStats();
  }

  @Get('nodes')
  @ApiOperation({ summary: 'Get node statistics' })
  @ApiResponse({ status: 200, description: 'Node statistics' })
  async getNodeStats() {
    return this.statsService.getNodeStats();
  }
}