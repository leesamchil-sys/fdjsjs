import { Handler } from '@netlify/functions';
// @ts-ignore
import parser from 'lambda-multipart-parser';

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse multipart form data
    const parsedData = await parser.parse(event);
    const message = parsedData.message;
    const files = parsedData.files || [];

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

    let response;
    const totalMedia = files.length;

    if (totalMedia === 0) {
      // Send Message (No files)
      const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
      response = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });
    } else if (totalMedia === 1) {
      // Send Single Photo
      const tgUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
      const file = files[0];
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', message);
      
      const blob = new Blob([file.content], { type: file.contentType });
      formData.append('photo', blob, file.filename);

      response = await fetch(tgUrl, {
        method: 'POST',
        body: formData,
      });
    } else {
      // Send Multiple Photos as Media Group (2-10 items)
      const tgUrl = `https://api.telegram.org/bot${token}/sendMediaGroup`;
      const itemsToSend = files.slice(0, 10);
      const formData = new FormData();
      formData.append('chat_id', chatId);

      const mediaGroup = itemsToSend.map((file: any, index: number) => {
        const attachName = `photo_${index}`;
        const blob = new Blob([file.content], { type: file.contentType });
        formData.append(attachName, blob, file.filename);
        
        return {
          type: 'photo',
          media: `attach://${attachName}`,
          caption: index === 0 ? message : undefined,
        };
      });

      formData.append('media', JSON.stringify(mediaGroup));

      response = await fetch(tgUrl, {
        method: 'POST',
        body: formData,
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
    console.error("Netlify contact function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' }),
    };
  }
};
