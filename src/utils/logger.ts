// Structured logging utility using Pino
// Provides fast, structured logging with levels and context

import pino from "pino";

// Configure pino based on environment
const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  // In production, output structured JSON for log aggregation
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

// Helper methods for common logging patterns
export const logRequest = (method: string, path: string, userId?: number) => {
  logger.info({ method, path, userId }, "HTTP Request");
};

export const logError = (
  message: string,
  error: Error | unknown,
  context?: Record<string, unknown>
) => {
  if (error instanceof Error) {
    logger.error(
      {
        ...context,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
      message
    );
  } else {
    logger.error({ ...context, error }, message);
  }
};

export const logDb = (operation: string, context?: Record<string, unknown>) => {
  logger.debug({ operation, ...context }, "Database Operation");
};
