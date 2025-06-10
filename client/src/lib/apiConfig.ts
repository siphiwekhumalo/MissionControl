// API configuration for different environments
export function getApiUrl(endpoint: string): string {
  // In Replit environment, use relative URLs
  if (typeof window !== 'undefined' && window.location.hostname.includes('replit.dev')) {
    return endpoint;
  }
  
  // For local development, check if we're running on the same port as the backend
  if (typeof window !== 'undefined' && window.location.port === '5000') {
    return endpoint;
  }
  
  // Default to relative URLs for same-origin requests
  return endpoint;
}

export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(endpoint);
  console.log(`Making API request to: ${url}`);
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}