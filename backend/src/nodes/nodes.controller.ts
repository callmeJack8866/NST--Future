import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { NodesService } from './nodes.service';

@ApiTags('nodes')
@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Get('user/:address')
  @ApiOperation({ summary: 'Get nodes by user address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'List of user nodes' })
  async getUserNodes(@Param('address') address: string) {
    return this.nodesService.findByUser(address);
  }

  @Get('user/:address/summary')
  @ApiOperation({ summary: 'Get node summary by user address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Node summary' })
  async getUserNodeSummary(@Param('address') address: string) {
    return this.nodesService.getUserNodeSummary(address);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent node purchases' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent node purchases' })
  async getRecentPurchases(@Query('limit') limit = 20) {
    return this.nodesService.getRecentNodePurchases(limit);
  }

  @Get('holders')
  @ApiOperation({ summary: 'Get all node holders' })
  @ApiResponse({ status: 200, description: 'List of node holders' })
  async getNodeHolders() {
    return this.nodesService.getNodeHolders();
  }
}