// Global error handling middleware — must have 4 params for Express to treat it as error handler
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Always log server-side for diagnostics.
  console.error(`[ERROR] ${req.method} ${req.url} — ${status}: ${err.message}`);
  if (!isProd && err.stack) console.error(err.stack);

  // Never leak internal error details (stack traces, DB messages, file paths) to
  // clients on 5xx errors. Client (4xx) errors carry safe, intentional messages.
  const clientMessage =
    status >= 500
      ? 'Internal Server Error'
      : err.message || 'Request failed.';

  res.status(status).json({
    success: false,
    message: clientMessage,
  });
}

module.exports = errorHandler;
