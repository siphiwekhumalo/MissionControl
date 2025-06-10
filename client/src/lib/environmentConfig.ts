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
    // For local development, backend runs on port 3001, frontend on 5000
    apiBaseUrl = 'http://localhost:3001';
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

// Force fresh detection on each import to avoid caching issues
export const ENV = detectEnvironment();

// Helper function to get current environment (for debugging)
export function getCurrentEnv() {
  return detectEnvironment();
}

// Universal API call function that works in all environments
export async function universalFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // Get fresh environment detection for each API call to avoid caching issues
  const currentEnv = getCurrentEnv();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${currentEnv.apiBaseUrl}${normalizedEndpoint}`;
  
  // Debug environment detection (remove in production)
  if (typeof window !== 'undefined' && currentEnv.isDevelopment) {
    console.log('=== ENVIRONMENT DEBUG ===');
    console.log('hostname:', window.location.hostname);
    console.log('origin:', window.location.origin);
    console.log('ENV.isLocal:', currentEnv.isLocal);
    console.log('ENV.isReplit:', currentEnv.isReplit);
    console.log('ENV.apiBaseUrl:', currentEnv.apiBaseUrl);
    console.log('fullUrl:', fullUrl);
    console.log('=== END DEBUG ===');
  }
  
  console.log(`API: ${options.method || 'GET'} ${fullUrl} [ENV: ${currentEnv.isLocal ? 'local' : currentEnv.isReplit ? 'replit' : 'unknown'}]`);
  
  return fetch(fullUrl, {
    ...options,
    credentials: currentEnv.isLocal ? 'include' : 'same-origin',
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