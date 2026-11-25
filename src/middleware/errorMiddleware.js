function notFound(req, res, next) {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || 500;
  let message = statusCode >= 500 ? "Server error" : error.message;

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  } else if (error.code === 11000) {
    statusCode = 400;
    message = "Email already exists";
  } else if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(", ");
  } else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  if (statusCode >= 500) {
    console.error(error);
    message = "Server error";
  }

  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === "development" && error.stack) {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };
