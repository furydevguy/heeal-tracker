import { UserProfile } from "@app/lib/firebaseHelpers"
import { cloudflareApi, CloudflareApiService } from "./cloudflareApi"

export interface ChatRequest {
  endpoint?: string
  threadId?: string
  userText: string
  userData: UserProfile
}

export interface ChatResponse {
  reply: string
}

/**
 * Send a message to Aura via Cloudflare Worker
 * @param params Chat request parameters
 * @returns Promise with AI response
 */
export async function askAuraCF(params: ChatRequest): Promise<ChatResponse> {
  const { userText, endpoint, userData } = params

  // Use provided endpoint or default Cloudflare API service
  if (endpoint) {
    // Legacy support for custom endpoints
    return await askAuraCFLegacy(params)
  }

  // Use the new modularized Cloudflare API service
  const reply = await cloudflareApi.sendChatMessage(userText, userData)
  return { reply }
}

/**
 * Legacy function for backward compatibility with custom endpoints
 * @deprecated Use askAuraCF with cloudflareApi service instead
 */
async function askAuraCFLegacy(params: ChatRequest): Promise<ChatResponse> {
  const { endpoint, threadId, userText, userData } = params

  if (!endpoint) {
    throw new Error("Endpoint is required for legacy function")
  }
  const { auth } = await import("@lib/firebase")
  const user = auth.currentUser
  if (!user) throw new Error("Not signed in")
  const idToken = await user.getIdToken()

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ threadId, userText, userData }),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`AI error: ${msg}`)
  }
  const data = await res.json()
  return data as ChatResponse
}

/**
 * Check if Cloudflare Worker is available and healthy
 */
export async function checkCloudflareHealth(): Promise<boolean> {
  try {
    return await cloudflareApi.checkHealth()
  } catch (error) {
    console.error("Cloudflare health check failed:", error)
    return false
  }
}

/**
 * Get Cloudflare API service instance for advanced usage
 */
export function getCloudflareApiService(): CloudflareApiService {
  return cloudflareApi
}