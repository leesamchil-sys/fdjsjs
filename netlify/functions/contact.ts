import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { message, photo } = JSON.parse(event.body || '{}');

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || !chatId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Telegram credentials missing on Netlify environment variables' }),
      };
    }

    // Send to Telegram API
    // Use sendPhoto if photo exists, otherwise sendMessage
    const endpoint = photo ? 'sendPhoto' : 'sendMessage';
    const tgUrl = `https://api.telegram.org/bot${token}/${endpoint}`;

    let response;
    if (photo) {
      // Photo is base64: "data:image/png;base64,xxxx"
      const parts = photo.split(',');
      const base64Data = parts[1];
      const contentType = parts[0].split(';')[0].split(':')[1] || 'image/jpeg';
      const buffer = Buffer.from(base64Data, 'base64');
      
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', message);
      
      // We need to create a Blob from the buffer for fetch to treat it as a file
      const blob = new Blob([buffer], { type: contentType });
      formData.append('photo', blob, 'image_upload');

      response = await fetch(tgUrl, {
        method: 'POST',
        body: formData,
      });
    } else {
      response = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Failed to send to Telegram', details: errorText }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
