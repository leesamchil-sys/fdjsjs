import { Handler } from '@netlify/functions';

// Simple in-memory cache for Netlify Function container reuse cases
let cachedData: any = null;
let cacheExpiry = 0;

export const handler: Handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  // Check memory cache
  if (cachedData && Date.now() < cacheExpiry) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // HTTP level caching for client browsers (1 minute)
      },
      body: JSON.stringify(cachedData),
    };
  }

  try {
    const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
    
    if (!response.ok) {
      throw new Error(`External API status error: ${response.status}`);
    }

    const data = await response.json();
    
    cachedData = data;
    cacheExpiry = Date.now() + 60000; // 1 minute in-memory cache

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    // If the external API falls back, return system time of the serverless function as fallback
    const fallbackTime = new Date().toISOString();
    const fallbackData = {
      utc_datetime: fallbackTime,
      unixtime: Math.floor(Date.now() / 1000)
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(fallbackData),
    };
  }
};
