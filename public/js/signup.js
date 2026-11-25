document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");
  const submitButton = document.getElementById("signup-submit");
  const successMessage = document.getElementById("signup-success");
  const errorMessage = document.getElementById("signup-error");
  const approvalNote = document.getElementById("approval-note");
  const passwordInput = document.getElementById("signup-password");
  const confirmInput = document.getElementById("signup-confirm-password");
  const showPasswords = document.getElementById("show-passwords");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  showPasswords.addEventListener("change", () => {
    const inputType = showPasswords.checked ? "text" : "password";
    passwordInput.type = inputType;
    confirmInput.type = inputType;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    successMessage.hidden = true;
    errorMessage.hidden = true;
    approvalNote.hidden = true;

    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    const role = document.getElementById("signup-role").value;

    if (!name || !email || !password || !confirmPassword || !role) {
      App.showMessage(errorMessage, "Please complete every field.", "error");
      return;
    }

    if (name.length < 3) {
      App.showMessage(
        errorMessage,
        "Name must be at least 3 characters.",
        "error"
      );
      return;
    }

    if (!emailPattern.test(email)) {
      App.showMessage(errorMessage, "Enter a valid email address.", "error");
      return;
    }

    if (password.length < 6) {
      App.showMessage(
        errorMessage,
        "Password must be at least 6 characters.",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      App.showMessage(errorMessage, "Passwords do not match.", "error");
      return;
    }

    if (role !== "user" && role !== "admin") {
      App.showMessage(errorMessage, "Choose a valid account type.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await App.readJsonResponse(response);

      if (!response.ok || !data.success) {
        App.showMessage(
          errorMessage,
          data.message || "Unable to create the account.",
          "error"
        );
        return;
      }

      App.showMessage(successMessage, data.message, "success");
      approvalNote.hidden = false;
      form.reset();
      document.getElementById("signup-role").value = "user";
    } catch {
      App.showMessage(
        errorMessage,
        "Unable to connect to the server. Please try again.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Create Account";
    }
  });
});
