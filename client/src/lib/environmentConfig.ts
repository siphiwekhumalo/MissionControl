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
  
  // Detect local development
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Detect Replit environment
  const isReplit = hostname.includes('replit.dev') || 
                   hostname.includes('replit.app') || 
                   hostname.includes('replit.') ||
                   hostname.includes('spock.replit.dev');
  
  const isDevelopment = isLocal;

  // Set API base URL based on environment
  let apiBaseUrl = '';
  if (isLocal) {
    // For local development, use localhost:5000
    apiBaseUrl = 'http://localhost:5000';
  } else if (isReplit) {
    // For Replit, use relative URLs (same origin)
    apiBaseUrl = '';
  }

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
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${ENV.apiBaseUrl}${normalizedEndpoint}`;
  
  console.log(`API: ${options.method || 'GET'} ${fullUrl} [ENV: ${ENV.isLocal ? 'local' : ENV.isReplit ? 'replit' : 'unknown'}]`);
  
  return fetch(fullUrl, {
    ...options,
    credentials: ENV.isLocal ? 'include' : 'same-origin',
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