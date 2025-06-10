// API configuration for different environments
export function getApiUrl(endpoint: string): string {
  // Always use relative URLs - this works in both local and Replit environments
  // since the frontend and backend are served from the same domain/port
  return endpoint;
}

export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(endpoint);
  console.log(`Making API request to: ${url} (timestamp: ${Date.now()})`);
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...options.headers,
    },
  });
}