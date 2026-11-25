document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const submitButton = document.getElementById("login-submit");
  const successMessage = document.getElementById("login-success");
  const errorMessage = document.getElementById("login-error");
  const passwordInput = document.getElementById("login-password");
  const showPassword = document.getElementById("show-login-password");
  const sessionMessage = sessionStorage.getItem("sessionMessage");

  if (sessionMessage) {
    App.showMessage(errorMessage, sessionMessage, "error");
    sessionStorage.removeItem("sessionMessage");
  }

  showPassword.addEventListener("change", () => {
    passwordInput.type = showPassword.checked ? "text" : "password";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    successMessage.hidden = true;
    errorMessage.hidden = true;

    const email = document.getElementById("login-email").value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      App.showMessage(errorMessage, "Email and password are required.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await App.readJsonResponse(response);

      if (!response.ok || !data.success) {
        App.showMessage(
          errorMessage,
          data.message || "Unable to log in.",
          "error"
        );
        return;
      }

      if (!data.token || !data.user) {
        App.showMessage(
          errorMessage,
          "The server returned an incomplete login response.",
          "error"
        );
        return;
      }

      App.saveAuth(data.token, data.user);
      App.showMessage(successMessage, data.message, "success");
      window.setTimeout(() => {
        window.location.href =
          data.user.role === "admin" ? "/admin.html" : "/dashboard.html";
      }, 250);
    } catch {
      App.showMessage(
        errorMessage,
        "Unable to connect to the server. Please try again.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Login";
    }
  });
});
