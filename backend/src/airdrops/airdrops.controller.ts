import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AirdropsService } from './airdrops.service';

@ApiTags('airdrops')
@Controller('airdrops')
export class AirdropsController {
  constructor(private readonly airdropsService: AirdropsService) {}

  // ============ Ranking Round Endpoints ============

  @Get('ranking/rounds')
  @ApiOperation({ summary: 'Get all ranking rounds' })
  @ApiResponse({ status: 200, description: 'List of ranking rounds' })
  async getAllRankingRounds() {
    return this.airdropsService.getAllRankingRounds();
  }

  @Get('ranking/rounds/:round')
  @ApiOperation({ summary: 'Get ranking round by number' })
  @ApiParam({ name: 'round', description: 'Round number' })
  @ApiResponse({ status: 200, description: 'Ranking round details' })
  async getRankingRoundById(@Param('round') round: number) {
    return this.airdropsService.getRankingRoundById(round);
  }

  @Get('ranking/current')
  @ApiOperation({ summary: 'Get current ranking round number' })
  @ApiResponse({ status: 200, description: 'Current ranking round' })
  async getCurrentRankingRound() {
    const round = await this.airdropsService.getCurrentRankingRound();
    return { currentRound: round };
  }

  @Get('ranking/stats')
  @ApiOperation({ summary: 'Get ranking statistics' })
  @ApiResponse({ status: 200, description: 'Ranking statistics' })
  async getRankingStats() {
    return this.airdropsService.getRankingStats();
  }

  @Get('ranking/prepare')
  @ApiOperation({ summary: '[Admin] Preview airdrop data before calling smart contract' })
  @ApiResponse({ status: 200, description: 'Prepared airdrop data with rankings' })
  async prepareAirdropData() {
    return this.airdropsService.prepareAirdropData();
  }

  @Get('ranking/contract-data')
  @ApiOperation({ summary: '[Admin] Get data formatted for smart contract call (20-padded)' })
  @ApiResponse({ status: 200, description: 'Contract call data with padded addresses' })
  async getContractCallData() {
    return this.airdropsService.getContractCallData();
  }

  // ============ User Endpoints ============

  @Get('ranking/user/:address')
  @ApiOperation({ summary: 'Get user ranking history across all rounds' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'User ranking history' })
  async getUserRankingHistory(@Param('address') address: string) {
    return this.airdropsService.getUserRankingHistory(address);
  }

  @Get('ranking/user/:address/eligibility')
  @ApiOperation({ summary: 'Check user eligibility for specific round' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiQuery({ name: 'round', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'User eligibility status' })
  async checkRankingEligibility(
    @Param('address') address: string,
    @Query('round') round: number,
  ) {
    return this.airdropsService.checkRankingEligibility(address, round);
  }

  // ============ Admin Endpoints ============
  // NOTE: Airdrop rounds are created by calling the smart contract directly.
  // The indexer automatically syncs data from the AirdropRoundCreated event.

  @Post('ranking/close/:round')
  @ApiOperation({ summary: '[Admin] Close a ranking round' })
  @ApiParam({ name: 'round', description: 'Round number' })
  @ApiResponse({ status: 200, description: 'Ranking round closed' })
  async closeRankingRound(@Param('round') round: number) {
    await this.airdropsService.closeRankingRound(round);
    return { success: true, message: `Round ${round} closed` };
  }

  @Post('ranking/update-snapshots')
  @ApiOperation({ summary: '[Admin] Update snapshot points for all users' })
  @ApiResponse({ status: 200, description: 'Snapshots updated' })
  async updateAllSnapshots() {
    console.log('Controller: updateAllSnapshots endpoint called');
    try {
      const affected = await this.airdropsService.updateAllUserSnapshots();
      console.log('Controller: Snapshots updated, affected rows:', affected);
      return { success: true, usersUpdated: affected };
    } catch (err) {
      console.error('Controller: Error updating snapshots:', err.message);
      throw err;
    }
  }

  @Post('ranking/update-snapshots/batch')
  @ApiOperation({ summary: '[Admin] Update snapshot points for specific users' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        addresses: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Snapshots updated' })
  async updateBatchSnapshots(@Body() body: { addresses: string[] }) {
    const affected = await this.airdropsService.updateUserSnapshots(body.addresses);
    return { success: true, usersUpdated: affected };
  }

  @Post('ranking/reset-snapshots')
  @ApiOperation({ summary: '[Admin] Reset snapshot points to 0 for all users' })
  @ApiResponse({ status: 200, description: 'Snapshots reset to 0' })
  async resetAllSnapshots() {
    console.log('Controller: resetAllSnapshots endpoint called');
    try {
      const affected = await this.airdropsService.resetAllSnapshots();
      console.log('Controller: Snapshots reset, affected rows:', affected);
      return { success: true, usersUpdated: affected };
    } catch (err) {
      console.error('Controller: Error resetting snapshots:', err.message);
      throw err;
    }
  }
}
