import { Handler } from '@netlify/functions';

const timeCache = { data: null, expiry: 0 };

export const handler: Handler = async (event) => {
  if (timeCache.data && Date.now() < timeCache.expiry) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timeCache.data),
    };
  }

  try {
    const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
    if (!response.ok) throw new Error('Failed to fetch time');
    const data = await response.json();
    
    timeCache.data = data;
    timeCache.expiry = Date.now() + 60000; // Cache for 1 min

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch time" }),
    };
  }
};
