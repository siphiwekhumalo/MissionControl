// Force clear any cached authentication state and ensure fresh API calls
export function clearAuthCache() {
  // Clear localStorage
  localStorage.removeItem("token");
  
  // Clear any cached queries
  if (typeof window !== 'undefined') {
    // Force reload if needed
    console.log("Authentication cache cleared");
  }
}

// Ensure API calls always use the current domain
export function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  
  return fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
}