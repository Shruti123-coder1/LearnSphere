const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "Server error";

  if (err.name === "CastError") {
    status = 404;
    message = "Resource not found";
  } else if (err.name === "ValidationError" && err.errors) {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    message = field ? `This ${field} is already in use.` : "Duplicate value.";
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired token. Please log in again.";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON in request body.";
  } else if (message === "Not allowed by CORS") {
    status = 403;
  }

  if (status < 400) status = 500;

  const body = { message };
  if (status === 500 && process.env.NODE_ENV !== "production") body.stack = err.stack;
  res.status(status).json(body);
};

module.exports = { notFound, errorHandler };