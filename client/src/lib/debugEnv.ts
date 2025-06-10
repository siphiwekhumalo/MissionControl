// Debug environment detection
export function debugEnvironment() {
  if (typeof window === 'undefined') {
    console.log('Server-side rendering detected');
    return;
  }

  const { hostname, protocol, port, origin } = window.location;
  
  console.log('=== ENVIRONMENT DEBUG ===');
  console.log('hostname:', hostname);
  console.log('protocol:', protocol);
  console.log('port:', port);
  console.log('origin:', origin);
  
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isReplit = hostname.includes('replit.dev') || 
                   hostname.includes('replit.app') || 
                   hostname.includes('replit.') ||
                   hostname.includes('spock.replit.dev');
  
  console.log('isLocal:', isLocal);
  console.log('isReplit:', isReplit);
  
  let apiBaseUrl = '';
  if (isLocal) {
    apiBaseUrl = 'http://localhost:5000';
  } else if (isReplit) {
    apiBaseUrl = '';
  }
  
  console.log('apiBaseUrl:', apiBaseUrl);
  console.log('=== END DEBUG ===');
}