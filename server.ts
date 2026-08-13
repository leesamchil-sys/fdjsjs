import "dotenv/config";
import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));
  const PORT = 3000;

  // Telegram API endpoint
  app.post("/api/contact", upload.single('file'), async (req, res) => {
    const { message, photo } = req.body;
    const file = req.file;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token || !chatId) {
      return res.status(500).json({ error: "Server configuration missing" });
    }

    try {
      let photoBuffer: Buffer | null = null;
      let photoMimeType = "image/png";
      let photoName = "screenshot.png";

      if (file) {
        photoBuffer = file.buffer;
        photoMimeType = file.mimetype;
        photoName = file.originalname;
      } else if (photo && typeof photo === "string") {
        const matches = photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          photoMimeType = matches[1];
          photoBuffer = Buffer.from(matches[2], 'base64');
        }
      }

      if (photoBuffer) {
        // Send Photo
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('caption', message);
        formData.append('photo', new Blob([photoBuffer], { type: photoMimeType }), photoName);

        const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("Telegram sendPhoto failed:", errText);
          throw new Error("Failed to send photo");
        }
      } else {
        // Send Message
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message }),
        });
        
        if (!response.ok) {
          const errText = await response.text();
          console.error("Telegram sendMessage failed:", errText);
          throw new Error("Failed to send message");
        }
      }
      
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Proxy Telegram Message requests to bypass client-side browser blocks (AdBlock, CORS, or local failures)
  app.get("/api/proxy/telegram", (req, res) => {
    res.json({ status: "alive", info: "Telegram proxy is ready. Please use POST for actual proxying." });
  });

  app.post("/api/proxy/telegram", async (req, res) => {
    let { token, chat_id, text, parse_mode } = req.body;

    if (!token || !chat_id || !text) {
      return res.status(400).json({ error: "Missing required fields: token, chat_id, or text" });
    }

    // Clean token if it has "bot" prefix
    if (typeof token === 'string' && token.toLowerCase().startsWith('bot')) {
      token = token.substring(3).trim();
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text, parse_mode: parse_mode || 'HTML' }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error("Telegram API Error:", data);
      }
      res.status(response.status).json(data);
    } catch (e: any) {
      console.error("Proxy Error:", e);
      res.status(500).json({ error: e.message || "Failed to proxy telegram request" });
    }
  });

  // Time Proxy endpoint with caching
  const timeCache = { data: null, expiry: 0 };
  app.get("/api/proxy/time", async (req, res) => {
    if (timeCache.data && Date.now() < timeCache.expiry) {
      return res.json(timeCache.data);
    }
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
      const data = await response.json();
      timeCache.data = data;
      timeCache.expiry = Date.now() + 60000; // Cache for 1 min
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch time" });
    }
  });

  // Admin Check endpoint
  app.post("/api/admin/check", (req, res) => {
    const { uid, email } = req.body;
    const adminUids = (process.env.ADMIN_UIDS || '').split(',');
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');

    const isAdmin = (uid && adminUids.includes(uid)) || (email && adminEmails.includes(email));
    res.json({ isAdmin: !!isAdmin });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
  });
}

startServer();
