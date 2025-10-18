/**
 * Example usage of the modularized Cloudflare API service
 * This file demonstrates how to use the new chat API methods
 */

import { checkCloudflareHealth, getCloudflareApiService } from "./ai";

// Example 4: Get service information
export function getServiceInfo() {
  const service = getCloudflareApiService();
  return {
    baseUrl: service.getBaseUrl(),
    projectId: service.getProjectId()
  };
}

// Example 5: Batch health check
export async function checkServiceStatus() {
  try {
    const isHealthy = await checkCloudflareHealth();
    const serviceInfo = getServiceInfo();
    
    return {
      healthy: isHealthy,
      baseUrl: serviceInfo.baseUrl,
      projectId: serviceInfo.projectId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    };
  }
}
