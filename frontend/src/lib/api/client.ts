/**
 * API Client for backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003"

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { data: null, error: null }
      }
      const errorData = await response.json().catch(() => ({}))
      return { data: null, error: errorData.message || `HTTP error ${response.status}` }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    console.error("API Error:", error)
    return { data: null, error: error instanceof Error ? error.message : "Network error" }
  }
}

// User API
export interface UserDashboardResponse {
  address: string
  totalDonationUSD: string
  nodeCount: number
  teamNodeCount: number
  totalNodes: number
  referrerAddress: string | null
  directNodeCount: number
  directDonationUSD: string
  nstReward: string
  hasAutoNode: boolean
  points: string
  lastSnapshotPoints: string
  isNodeHolder: boolean
  isDonor: boolean
  isTeamMember: boolean
  createdAt: string
}

export interface ReferralResponse {
  address: string
  totalDonationUSD: string
  nodeCount: number
  createdAt: string
}

export async function getUserDashboard(address: string): Promise<ApiResponse<UserDashboardResponse>> {
  return fetchApi<UserDashboardResponse>(`/users/${address.toLowerCase()}`)
}

export async function getUserReferrals(address: string): Promise<ApiResponse<ReferralResponse[]>> {
  return fetchApi<ReferralResponse[]>(`/users/${address.toLowerCase()}/referrals`)
}

// Donations API
export interface DonationResponse {
  id: string
  userAddress: string
  tokenAddress: string
  tokenSymbol: string
  amount: string
  usdValue: string
  txHash: string
  blockNumber: number
  chainId: number
  source: "donation" | "node_purchase"
  referrerAddress: string | null
  createdAt: string
}

export async function getUserDonations(
  address: string,
  limit = 50,
  offset = 0
): Promise<ApiResponse<DonationResponse[]>> {
  return fetchApi<DonationResponse[]>(`/donations/user/${address.toLowerCase()}?limit=${limit}&offset=${offset}`)
}

export async function getRecentDonations(limit = 20): Promise<ApiResponse<DonationResponse[]>> {
  return fetchApi<DonationResponse[]>(`/donations/recent?limit=${limit}`)
}

// Stats API
export interface GlobalStatsResponse {
  totalUsers: number
  totalDonationsUSD: string
  totalNodesIssued: number
  publicNodesRemaining: number
  totalPointsDistributed: string
}

export interface NodeStatsResponse {
  publicNodesIssued: number
  teamNodesIssued: number
  publicNodesRemaining: number
  teamNodesRemaining: number
}

export async function getGlobalStats(): Promise<ApiResponse<GlobalStatsResponse>> {
  return fetchApi<GlobalStatsResponse>("/stats/global")
}

export async function getNodeStats(): Promise<ApiResponse<NodeStatsResponse>> {
  return fetchApi<NodeStatsResponse>("/stats/nodes")
}

// Nodes API
export interface NodeResponse {
  id: string
  userAddress: string
  type: "public" | "team" | "auto" | "free_referral"
  count: number
  costUSD: string
  txHash: string | null
  blockNumber: number | null
  createdAt: string
}

export interface NodeSummaryResponse {
  public: number
  team: number
  auto: number
  freeReferral: number
  total: number
}

export interface NodeHolderResponse {
  userAddress: string
  totalNodes: string
}

export interface RecentNodePurchaseResponse {
  userAddress: string
  count: number
  costUSD: string
  txHash: string
  createdAt: string
}

export async function getUserNodes(address: string): Promise<ApiResponse<NodeResponse[]>> {
  return fetchApi<NodeResponse[]>(`/nodes/user/${address.toLowerCase()}`)
}

export async function getUserNodeSummary(address: string): Promise<ApiResponse<NodeSummaryResponse>> {
  return fetchApi<NodeSummaryResponse>(`/nodes/user/${address.toLowerCase()}/summary`)
}

export async function getRecentNodePurchases(limit = 20): Promise<ApiResponse<RecentNodePurchaseResponse[]>> {
  return fetchApi<RecentNodePurchaseResponse[]>(`/nodes/recent?limit=${limit}`)
}

export async function getNodeHolders(): Promise<ApiResponse<NodeHolderResponse[]>> {
  return fetchApi<NodeHolderResponse[]>(`/nodes/holders`)
}

export { API_BASE_URL }

