const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sendValidationError(res, message) {
  return res.status(400).json({
    success: false,
    message,
  });
}

function getRequestBody(req) {
  return req.body && typeof req.body === "object" ? req.body : {};
}

function validateSignup(req, res, next) {
  const body = getRequestBody(req);

  if (typeof body.name !== "string" || body.name.trim().length < 3) {
    return sendValidationError(res, "Name must be at least 3 characters");
  }

  if (
    typeof body.email !== "string" ||
    !emailPattern.test(body.email.trim())
  ) {
    return sendValidationError(res, "A valid email is required");
  }

  if (typeof body.password !== "string" || body.password.length < 6) {
    return sendValidationError(
      res,
      "Password must be at least 6 characters"
    );
  }

  if (body.role !== undefined && !["user", "admin"].includes(body.role)) {
    return sendValidationError(res, "Role must be user or admin");
  }

  if (Object.prototype.hasOwnProperty.call(body, "approvalStatus")) {
    return sendValidationError(
      res,
      "Approval status cannot be set during signup"
    );
  }

  return next();
}

function validateLogin(req, res, next) {
  const body = getRequestBody(req);

  if (
    typeof body.email !== "string" ||
    !body.email.trim() ||
    typeof body.password !== "string" ||
    !body.password
  ) {
    return sendValidationError(res, "Email and password are required");
  }

  return next();
}

function validateProfileUpdate(req, res, next) {
  const body = getRequestBody(req);
  const hasName = Object.prototype.hasOwnProperty.call(body, "name");
  const hasEmail = Object.prototype.hasOwnProperty.call(body, "email");
  const hasRestrictedField = ["password", "role", "approvalStatus"].some(
    (field) => Object.prototype.hasOwnProperty.call(body, field)
  );

  if (hasRestrictedField) {
    return sendValidationError(
      res,
      "You cannot update password, role, or approval status from this route"
    );
  }

  if (!hasName && !hasEmail) {
    return sendValidationError(res, "Provide a name or email to update");
  }

  if (hasName && (typeof body.name !== "string" || body.name.trim().length < 3)) {
    return sendValidationError(res, "Name must be at least 3 characters");
  }

  if (
    hasEmail &&
    (typeof body.email !== "string" ||
      !emailPattern.test(body.email.trim()))
  ) {
    return sendValidationError(res, "A valid email is required");
  }

  return next();
}

function validatePasswordChange(req, res, next) {
  const body = getRequestBody(req);

  if (
    typeof body.currentPassword !== "string" ||
    !body.currentPassword ||
    typeof body.newPassword !== "string" ||
    !body.newPassword
  ) {
    return sendValidationError(
      res,
      "Current password and new password are required"
    );
  }

  if (body.newPassword.length < 6) {
    return sendValidationError(
      res,
      "New password must be at least 6 characters"
    );
  }

  if (body.newPassword === body.currentPassword) {
    return sendValidationError(
      res,
      "New password must be different from the current password"
    );
  }

  return next();
}

function validateApprovalUpdate(req, res, next) {
  const body = getRequestBody(req);

  if (!["approved", "rejected"].includes(body.approvalStatus)) {
    return sendValidationError(
      res,
      "Approval status must be approved or rejected"
    );
  }

  return next();
}

module.exports = {
  validateSignup,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateApprovalUpdate,
};
