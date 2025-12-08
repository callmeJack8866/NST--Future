import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Node, NodeType } from './entities/node.entity';

@Injectable()
export class NodesService {
  constructor(
    @InjectRepository(Node)
    private nodeRepo: Repository<Node>,
  ) {}

  async findByUser(address: string) {
    return this.nodeRepo.find({
      where: { userAddress: address.toLowerCase() },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserNodeSummary(address: string) {
    const nodes = await this.nodeRepo.find({
      where: { userAddress: address.toLowerCase() },
    });

    const summary = {
      public: 0,
      team: 0,
      auto: 0,
      freeReferral: 0,
      total: 0,
    };

    for (const node of nodes) {
      summary.total += node.count;
      switch (node.type) {
        case NodeType.PUBLIC:
          summary.public += node.count;
          break;
        case NodeType.TEAM:
          summary.team += node.count;
          break;
        case NodeType.AUTO:
          summary.auto += node.count;
          break;
        case NodeType.FREE_REFERRAL:
          summary.freeReferral += node.count;
          break;
      }
    }

    return summary;
  }

  async getRecentNodePurchases(limit = 20) {
    return this.nodeRepo.find({
      where: { type: NodeType.PUBLIC },
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['userAddress', 'count', 'costUSD', 'txHash', 'createdAt'],
    });
  }

  async getNodeHolders() {
    const result = await this.nodeRepo
      .createQueryBuilder('node')
      .select('node.userAddress', 'userAddress')
      .addSelect('SUM(node.count)', 'totalNodes')
      .groupBy('node.userAddress')
      .orderBy('SUM(node.count)', 'DESC')
      .getRawMany();

    return result;
  }
}