// Production-ready logging utility
export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level,
      message,
      ...(context && { context })
    };
    
    return JSON.stringify(baseLog);
  }

  error(message: string, context?: LogContext): void {
    const formatted = this.formatMessage(LogLevel.ERROR, message, context);
    console.error(formatted);
  }

  warn(message: string, context?: LogContext): void {
    const formatted = this.formatMessage(LogLevel.WARN, message, context);
    console.warn(formatted);
  }

  info(message: string, context?: LogContext): void {
    const formatted = this.formatMessage(LogLevel.INFO, message, context);
    console.log(formatted);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage(LogLevel.DEBUG, message, context);
      console.log(formatted);
    }
  }

  // Request logging helper
  request(req: any, res: any, duration: number): void {
    const context: LogContext = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    if (req.user) {
      context.userId = req.user.id;
    }
    
    const level = res.statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;
    
    if (level === LogLevel.ERROR) {
      this.error(message, context);
    } else {
      this.info(message, context);
    }
  }
}

export const logger = new Logger();