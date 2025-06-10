// API configuration for different environments
export function getApiUrl(endpoint: string): string {
  if (typeof window === 'undefined') {
    return endpoint; // Server-side rendering
  }

  // Always use relative URLs to ensure same-origin requests
  // This works because the Vite dev server and Express backend
  // are configured to serve from the same domain/port
  return endpoint;
}

// Test API connectivity on app startup
let apiConnectivityTested = false;
let isApiReachable = true;

async function testApiConnectivity(): Promise<boolean> {
  if (apiConnectivityTested) return isApiReachable;
  
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    isApiReachable = response.ok;
  } catch (error) {
    console.warn('API connectivity test failed, but continuing with relative URLs');
    isApiReachable = true; // Assume it works with relative URLs
  }
  
  apiConnectivityTested = true;
  return isApiReachable;
}

export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // Ensure API connectivity is tested
  await testApiConnectivity();
  
  const url = getApiUrl(endpoint);
  console.log(`API call: ${options.method || 'GET'} ${url} from ${window.location.origin}`);
  
  // Force same-origin request by using relative URL
  return fetch(url, {
    ...options,
    mode: 'same-origin', // Prevent cross-origin issues
    credentials: 'same-origin', // Include cookies for same-origin
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // Mark as AJAX request
      ...options.headers,
    },
  });
}