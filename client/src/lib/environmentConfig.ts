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
  
  // More robust Replit detection
  const isReplit = hostname.includes('replit.dev') || 
                   hostname.includes('replit.app') || 
                   hostname.includes('replit.') ||
                   hostname.includes('spock.replit.dev');
  
  const isLocal = !isReplit && (hostname === 'localhost' || hostname === '127.0.0.1');
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
  
  // Force absolute URL using current domain to prevent localhost issues
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = `${currentOrigin}${normalizedEndpoint}`;
  
  console.log(`API: ${options.method || 'GET'} ${fullUrl} [Cache-Busted-v3]`);
  
  // Use absolute URL with current domain
  return fetch(fullUrl, {
    ...options,
    credentials: 'same-origin',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    },
  });
}