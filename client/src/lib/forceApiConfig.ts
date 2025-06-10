// Emergency API configuration override to force correct domain usage
export function createApiCall() {
  return async function apiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
    // Get current domain from window location
    const currentOrigin = window.location.origin;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${currentOrigin}${normalizedEndpoint}`;
    
    console.log(`EMERGENCY-API: ${options.method || 'GET'} ${fullUrl}`);
    
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
  };
}

export const emergencyApiCall = createApiCall();