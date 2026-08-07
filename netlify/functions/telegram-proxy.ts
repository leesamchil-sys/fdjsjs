import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    let { token, chat_id, text, parse_mode } = JSON.parse(event.body || "{}");

    if (!token || !chat_id || !text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields: token, chat_id, or text" }),
      };
    }

    // Clean token if it has "bot" prefix
    if (typeof token === 'string' && token.toLowerCase().startsWith('bot')) {
      token = token.substring(3).trim();
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: parse_mode || 'HTML' }),
    });

    const data = await response.json();
    
    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message || "Failed to proxy telegram request" }),
    };
  }
};
