import { type NextRequest, NextResponse } from 'next/server';

// Generate nonce for inline scripts
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

export function setSecurityHeaders(request: NextRequest, response: NextResponse): void {
  const nonce = generateNonce();

  // Content Security Policy
  const csp = [
    // Default to nothing
    "default-src 'none'",
    // Allow self-hosted resources
    "script-src 'self' 'strict-dynamic' 'nonce-" + nonce + "'",
    "style-src 'self' 'unsafe-inline'",
    // Allow images from self and data URIs (for avatars etc)
    "img-src 'self' data: blob: https:",
    // Allow AJAX calls to our API
    "connect-src 'self'",
    // Allow fonts
    "font-src 'self'",
    // Frame ancestors
    "frame-ancestors 'none'",
    // Form submissions only to self
    "form-action 'self'",
    // Worker scripts
    "worker-src 'self'",
    // Media
    "media-src 'self'",
    // Manifest
    "manifest-src 'self'"
  ].join('; ');

  const headers = {
    // Content Security Policy
    'Content-Security-Policy': csp,
    
    // Prevent browsers from incorrectly detecting non-scripts as scripts
    'X-Content-Type-Options': 'nosniff',
    
    // Don't allow being embedded in iframes
    'X-Frame-Options': 'DENY',
    
    // Enable browser XSS filtering
    'X-XSS-Protection': '1; mode=block',
    
    // Disable client-side caching for sensitive pages
    'Cache-Control': 'no-store, max-age=0',
    
    // Only send referrer header to same origin
    'Referrer-Policy': 'same-origin',
    
    // Required for Feature-Policy
    'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  };

  // Set all security headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Store nonce in response for use in templates
  response.headers.set('X-Nonce', nonce);
}
