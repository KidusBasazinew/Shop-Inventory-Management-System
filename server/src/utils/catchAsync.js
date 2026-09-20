// Wraps an async route handler so a thrown/rejected error is passed to
// next(err) instead of crashing the process or requiring try/catch in
// every controller.
export default function catchAsync(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
