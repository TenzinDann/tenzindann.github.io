const http = require("http");
const fs = require("fs");
const path = require("path");

const rootArg = process.argv[2];
const portArg = process.argv[3];

if (!rootArg) {
  console.error("Usage: node local-static-server.js <rootDir> [port]");
  process.exit(1);
}

const rootDir = path.resolve(rootArg);
const port = Number.parseInt(portArg || "1313", 10);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const sendError = (res, statusCode, message) => {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
};

const server = http.createServer((req, res) => {
  const safeUrlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const requestedPath = safeUrlPath === "/" ? "/index.html" : safeUrlPath;

  const resolvedPath = path.resolve(rootDir, `.${requestedPath}`);
  if (!resolvedPath.startsWith(rootDir)) {
    sendError(res, 403, "Forbidden");
    return;
  }

  fs.stat(resolvedPath, (statErr, stats) => {
    if (statErr) {
      sendError(res, 404, "Not Found");
      return;
    }

    const filePath = stats.isDirectory()
      ? path.join(resolvedPath, "index.html")
      : resolvedPath;

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        sendError(res, 404, "Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static site serving: ${rootDir}`);
  console.log(`Local URL: http://127.0.0.1:${port}`);
});

server.on("error", (err) => {
  console.error(`Server error: ${err.message}`);
  process.exit(1);
});
