import { UserProfile } from "@app/lib/firebaseHelpers";
import { auth } from "@lib/firebase";

export interface CloudflareChatRequest {
  message: string
}

export interface CloudflareChatResponse {
  reply: string
}

export interface CloudflareErrorResponse {
  error: string
}

export interface CloudflareCreatePlanRequest {
  message: string
  profile: UserProfile
}

export interface CloudflareCreatePlanResponse {
  reply: string
}

export class CloudflareApiService {
  private baseUrl: string
  private projectId: string

  constructor(baseUrl: string, projectId: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.projectId = projectId
  }

  /**
   * Get Firebase ID token for authentication
   */
  private async getIdToken(): Promise<string> {
    const user = auth.currentUser
    if (!user) {
      throw new Error("User not authenticated")
    }
    return await user.getIdToken()
  }

  /**
   * Make authenticated request to Cloudflare Worker
   */
  private async makeRequest<T>(
    endpoint: string,
    data: any,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<T> {
    const idToken = await this.getIdToken()
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Cloudflare Worker error (${response.status}): ${errorText}`)
    }

    return await response.json()
  }

  /**
   * Send a chat message to OpenAI via Cloudflare Worker
   */
  async sendChatMessage(message: string, userData: UserProfile): Promise<string> {
    try {
      const response = await this.makeRequest<CloudflareChatResponse>(
        '/chat',
        { message, userData }
      )
      return response.reply
    } catch (error) {
      console.error('Cloudflare chat error:', error)
      throw error
    }
  }

  /**
   * Create a personalized meal and workout plan via Cloudflare Worker
   */
  async createPlan(message: string, profile: UserProfile, coreMotivation: string): Promise<string> {
    try {
      const response = await this.makeRequest<CloudflareCreatePlanResponse>(
        '/create-plan',
        { message, profile, coreMotivation }
      )
      return response.reply
    } catch (error) {
      console.error('Cloudflare create plan error:', error)
      throw error
    }
  }

  /**
   * Check if the Cloudflare Worker is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'GET',
      })
      return response.ok
    } catch (error) {
      console.error('Cloudflare health check failed:', error)
      return false
    }
  }

  /**
   * Get the base URL for this service
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Get the project ID
   */
  getProjectId(): string {
    return this.projectId
  }
}

// Factory function to create a configured instance
export function createCloudflareApiService(): CloudflareApiService {
  const baseUrl = process.env.EXPO_PUBLIC_CF_CHAT_ENDPOINT || "https://aura-ai.maesantos713.workers.dev"
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || ""
  
  if (!projectId) {
    console.warn("EXPO_PUBLIC_FIREBASE_PROJECT_ID not set")
  }
  
  return new CloudflareApiService(baseUrl, projectId)
}

// Default instance for easy importing
export const cloudflareApi = createCloudflareApiService()
