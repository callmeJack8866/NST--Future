import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AirdropsService } from './airdrops.service';

// DTO for processing ranking round
class ProcessRankingRoundDto {
  growthAirdropAmount: string;
  cumulativeAirdropAmount: string;
  txHash?: string;
  blockNumber?: number;
}

@ApiTags('airdrops')
@Controller('airdrops')
export class AirdropsController {
  constructor(private readonly airdropsService: AirdropsService) {}

  // ============ Legacy Airdrop Round Endpoints ============

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

  // ============ Ranking Airdrop Endpoints ============

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
  @ApiOperation({ summary: 'Prepare airdrop data (preview before processing)' })
  @ApiResponse({ status: 200, description: 'Prepared airdrop data with rankings' })
  async prepareAirdropData() {
    return this.airdropsService.prepareAirdropData();
  }

  @Get('ranking/contract-data')
  @ApiOperation({ summary: 'Get data formatted for smart contract call' })
  @ApiResponse({ status: 200, description: 'Contract call data' })
  async getContractCallData() {
    return this.airdropsService.getContractCallData();
  }

  @Get('ranking/user/:address')
  @ApiOperation({ summary: 'Get user ranking history' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'User ranking history' })
  async getUserRankingHistory(@Param('address') address: string) {
    return this.airdropsService.getUserRankingHistory(address);
  }

  @Get('ranking/user/:address/eligibility')
  @ApiOperation({ summary: 'Check user ranking eligibility for specific round' })
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

  @Post('ranking/process')
  @ApiOperation({ summary: '[Admin] Process a new ranking round' })
  @ApiBody({ type: ProcessRankingRoundDto })
  @ApiResponse({ status: 201, description: 'Ranking round processed' })
  async processRankingRound(@Body() dto: ProcessRankingRoundDto) {
    return this.airdropsService.processRankingRound(
      dto.growthAirdropAmount,
      dto.cumulativeAirdropAmount,
      dto.txHash,
      dto.blockNumber,
    );
  }

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
    const affected = await this.airdropsService.updateAllUserSnapshots();
    return { success: true, usersUpdated: affected };
  }

  @Post('ranking/update-snapshots/batch')
  @ApiOperation({ summary: '[Admin] Update snapshot points for specific users' })
  @ApiBody({ schema: { type: 'object', properties: { addresses: { type: 'array', items: { type: 'string' } } } } })
  @ApiResponse({ status: 200, description: 'Snapshots updated' })
  async updateBatchSnapshots(@Body() body: { addresses: string[] }) {
    const affected = await this.airdropsService.updateUserSnapshots(body.addresses);
    return { success: true, usersUpdated: affected };
  }
}
