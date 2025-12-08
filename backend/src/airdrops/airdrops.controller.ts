import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AirdropsService } from './airdrops.service';

@ApiTags('airdrops')
@Controller('airdrops')
export class AirdropsController {
  constructor(private readonly airdropsService: AirdropsService) {}

  @Get('rounds')
  @ApiOperation({ summary: 'Get all airdrop rounds' })
  @ApiResponse({ status: 200, description: 'List of airdrop rounds' })
  async getAllRounds() {
    return this.airdropsService.getAllRounds();
  }

  @Get('rounds/active')
  @ApiOperation({ summary: 'Get active airdrop rounds' })
  @ApiResponse({ status: 200, description: 'List of active airdrop rounds' })
  async getActiveRounds() {
    return this.airdropsService.getActiveRounds();
  }

  @Get('rounds/:round')
  @ApiOperation({ summary: 'Get airdrop round by number' })
  @ApiParam({ name: 'round', description: 'Round number' })
  @ApiResponse({ status: 200, description: 'Airdrop round details' })
  async getRoundById(@Param('round') round: number) {
    return this.airdropsService.getRoundById(round);
  }

  @Get('eligibility/:address')
  @ApiOperation({ summary: 'Check airdrop eligibility for user' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiQuery({ name: 'round', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Eligibility status' })
  async checkEligibility(
    @Param('address') address: string,
    @Query('round') round: number,
  ) {
    return this.airdropsService.checkEligibility(address, round);
  }

  @Get('user/:address/history')
  @ApiOperation({ summary: 'Get user airdrop history' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'User airdrop history' })
  async getUserHistory(@Param('address') address: string) {
    return this.airdropsService.getUserAirdropHistory(address);
  }
}