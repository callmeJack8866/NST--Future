import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DonationsService } from './donations.service';

@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Get('user/:address')
  @ApiOperation({ summary: 'Get donations by user address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getUserDonations(
    @Param('address') address: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.donationsService.findByUser(address, limit, offset);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent donations' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentDonations(@Query('limit') limit = 20) {
    return this.donationsService.getRecentDonations(limit);
  }
}