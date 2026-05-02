// src/middleware/errorHandler.js
// Global error handler middleware

import { formatErrorResponse, logError } from '../utils/errorHandler.js';

export const errorHandler = (err, req, res, next) => {
  // Log the error with context
  const errorLog = logError(err, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userId: req.userId || 'anonymous',
    ip: req.ip
  });
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Format response
  const isDevelopment = process.env.NODE_ENV === 'development';
  const response = formatErrorResponse(err, isDevelopment);
  
  // Send response
  res.status(statusCode).json(response);
};

export default errorHandler;
