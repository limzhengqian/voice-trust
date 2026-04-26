export function errorHandler(err, req, res, _next) {
  console.error(`[error] ${req.method} ${req.path}:`, err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  const status = err.status || (err.message?.includes('not found') ? 404 : 400);
  res.status(status).json({ error: err.message || 'Internal error' });
}
