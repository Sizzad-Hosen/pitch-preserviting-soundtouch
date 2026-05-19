import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  
  app.get("/api/proxy", async (req, res) => {
    let url = req.query.url as string;
    if (!url) {
      return res.status(400).send("URL is required");
    }

    if (url.includes("github.com") && url.includes("/blob/")) {
      url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
      console.log("Converted GitHub URL to raw:", url);
    }

    try {
      const response = await axios({
        method: "get",
        url: url,
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
          "Accept": "audio/*, video/*, */*",
        },
        timeout: 20000,
        maxContentLength: 50 * 1024 * 1024, 
      });


      const contentType = response.headers["content-type"];
      if (contentType) {
        res.setHeader("Content-Type", contentType.toString());
      }
      
      const contentLength = response.headers["content-length"];
      if (contentLength) {
        res.setHeader("Content-Length", contentLength.toString());
      }

      res.setHeader("Access-Control-Allow-Origin", "*");
      
      response.data.on('error', (err: any) => {
        console.error("Stream error during pipe:", err);
        if (!res.headersSent) {
          res.status(500).send("Stream error");
        } else {
          res.end();
        }
      });

      response.data.pipe(res);
    } catch (error: any) {
      console.error("Proxy error for URL:", url, error.message);
      const status = error.response?.status || 500;
      if (!res.headersSent) {
        res.status(status).send(error.message || "Failed to fetch audio");
      }
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
