import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateEnvironment } from "./middleware/validation";
import { securityHeaders, sanitizeInput } from "./middleware/security";
import { logger } from "./utils/logger";

// Validate environment variables on startup
const env = validateEnvironment();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // We'll handle this manually for better control
}));
app.use(securityHeaders);
app.use(compression());

// Input sanitization
app.use(sanitizeInput);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // Only log API requests and errors
    if (req.path.startsWith("/api") || res.statusCode >= 400) {
      logger.request(req, res, duration);
    }
  });

  next();
});

(async () => {
  // Setup admin user
  const { setupAdmin } = await import("./setup-admin");
  await setupAdmin();
  
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log error with context
    logger.error(`Error handling request: ${message}`, {
      method: req.method,
      url: req.url,
      statusCode: status,
      stack: err.stack,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`Server started successfully`, {
      port,
      environment: env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    });
  });
})();
