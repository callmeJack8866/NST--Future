const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User endpoints
  async getUserData(address: string) {
    return this.request(`/users/${address}`);
  }

  async getUserDonations(address: string) {
    return this.request(`/donations/user/${address}`);
  }

  async getUserNodes(address: string) {
    return this.request(`/nodes/user/${address}`);
  }

  async getUserReferrals(address: string) {
    return this.request(`/referrals/user/${address}`);
  }

  // Global stats
  async getGlobalStats() {
    return this.request('/stats/global');
  }

  async getNodeStats() {
    return this.request('/stats/nodes');
  }

  // Leaderboard
  async getLeaderboard(type: 'growth' | 'points', limit = 20) {
    return this.request(`/leaderboard/${type}?limit=${limit}`);
  }

  async getUserRank(address: string) {
    return this.request(`/leaderboard/rank/${address}`);
  }

  // Airdrops
  async getAirdropRounds() {
    return this.request('/airdrops/rounds');
  }

  async checkAirdropEligibility(address: string, round: number) {
    return this.request(`/airdrops/eligibility/${address}/${round}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);