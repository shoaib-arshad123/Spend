// src/utils/errorHandler.js
// Centralized error handling and error types

export class AppError extends Error {
  constructor(message, statusCode = 500, type = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Invalid credentials') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timeout') {
    super(message, 503, 'TIMEOUT');
  }
}

// Error response formatter
export const formatErrorResponse = (error, isDevelopment = false) => {
  if (error instanceof AppError) {
    return {
      success: false,
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
      ...(isDevelopment && { stack: error.stack })
    };
  }
  
  // Unknown error
  return {
    success: false,
    message: 'Internal server error',
    type: 'INTERNAL_ERROR',
    statusCode: 500,
    ...(isDevelopment && { 
      originalError: error.message,
      stack: error.stack 
    })
  };
};

// Async error wrapper for route handlers
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Central error logging
export const logError = (error, context = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: error.type || 'UNKNOWN',
    message: error.message,
    statusCode: error.statusCode || 500,
    context,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      originalError: error
    })
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ ERROR:', JSON.stringify(errorLog, null, 2));
  }
  
  // TODO: Log to external service in production (e.g., Sentry, LogRocket)
  
  return errorLog;
};
