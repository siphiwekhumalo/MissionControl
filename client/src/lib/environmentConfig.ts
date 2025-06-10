// Environment configuration that works in both local and Replit setups
export interface EnvironmentConfig {
  apiBaseUrl: string;
  isLocal: boolean;
  isReplit: boolean;
  isDevelopment: boolean;
}

function detectEnvironment(): EnvironmentConfig {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return {
      apiBaseUrl: '',
      isLocal: false,
      isReplit: false,
      isDevelopment: false,
    };
  }

  const { hostname, protocol, port } = window.location;
  
  const isReplit = hostname.includes('replit.dev') || hostname.includes('replit.app');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isDevelopment = !isReplit && isLocal;

  // Always use relative URLs for API calls
  // This ensures same-origin requests that work in both environments
  const apiBaseUrl = '';

  return {
    apiBaseUrl,
    isLocal,
    isReplit,
    isDevelopment,
  };
}

export const ENV = detectEnvironment();

// Universal API call function that works in all environments
export async function universalFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  console.log(`API: ${options.method || 'GET'} ${normalizedEndpoint} (env: ${ENV.isReplit ? 'replit' : ENV.isLocal ? 'local' : 'unknown'})`);
  
  // Use fetch with relative URL - this forces same-origin request
  return fetch(normalizedEndpoint, {
    ...options,
    // Force same-origin to prevent cross-origin issues
    mode: 'same-origin',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      ...options.headers,
    },
  });
}