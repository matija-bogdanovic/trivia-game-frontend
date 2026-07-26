'use client';

import { useEffect, useState } from 'react';

export function getPort(): string {
  // Server-side: always use environment-based logic with fallbacks
  if (typeof window === 'undefined') {
    const nodeEnv = process.env.NODE_ENV || 'development';
    return nodeEnv === 'production'
      ? 'https://whoisfaster.onrender.com'
      : 'http://localhost:3001';
  }

  // Client-side: use window properties with fallbacks
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const host = isLocalhost ? 'localhost:3001' : 'whoisfaster.onrender.com';

  return `${protocol}://${host}`;
}

export function getWebSocketPort(): string {
  // Server-side: determine based on environment
  if (typeof window === 'undefined') {
    const nodeEnv = process.env.NODE_ENV || 'development';
    return nodeEnv === 'production' ? 'wss' : 'ws';
  }

  // Client-side: determine based on current protocol
  return window.location.protocol === 'https:' ? 'wss' : 'ws';
}

// Alternative: Use a hook for client-side only usage
export function usePort(): string | null {
  const [port, setPort] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client-side
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    const host = isLocalhost ? 'localhost:3001' : 'whoisfaster.onrender.com';
    setPort(`${protocol}://${host}`);
  }, []);

  return port;
}

// You'll need to import useState and useEffect if using the hook:
// import { useState, useEffect } from 'react';
