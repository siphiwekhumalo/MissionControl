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

// EMERGENCY FIX: Force correct domain detection
function getCorrectApiUrl(endpoint: string): string {
  if (typeof window === 'undefined') return endpoint;
  
  // Force detection of current domain
  const currentHost = window.location.host;
  const protocol = window.location.protocol;
  
  // If we detect localhost in any form, force use of current domain
  const isReplitDomain = currentHost.includes('replit.dev') || 
                        currentHost.includes('replit.app') ||
                        currentHost.includes('spock.replit');
  
  if (isReplitDomain) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${protocol}//${currentHost}${normalizedEndpoint}`;
  }
  
  // Fallback for local development
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

// Universal API call function that works in all environments
export async function universalFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = getCorrectApiUrl(endpoint);
  
  console.log(`API: ${options.method || 'GET'} ${fullUrl} [FORCED-DOMAIN-v4]`);
  
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