document.addEventListener("DOMContentLoaded", () => {
  if (!App.requireLogin()) {
    return;
  }

  const dashboardMessage = document.getElementById("dashboard-message");
  const profileSuccess = document.getElementById("profile-success");
  const profileError = document.getElementById("profile-error");
  const editSuccess = document.getElementById("edit-success");
  const editError = document.getElementById("edit-error");
  const passwordSuccess = document.getElementById("password-success");
  const passwordError = document.getElementById("password-error");
  const profileForm = document.getElementById("profile-form");
  const passwordForm = document.getElementById("password-form");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const pageMessage = sessionStorage.getItem("pageMessage");
  if (pageMessage) {
    App.showMessage(dashboardMessage, pageMessage, "error");
    sessionStorage.removeItem("pageMessage");
  }

  async function handlePageForbidden(message) {
    App.clearAuth();
    sessionStorage.setItem(
      "sessionMessage",
      message || "Your account cannot access this page."
    );
    window.location.href = "/login.html";
  }

  function displayProfile(user) {
    document.getElementById("welcome-name").textContent = user.name || "there";
    document.getElementById("profile-name").textContent = user.name || "—";
    document.getElementById("profile-email").textContent = user.email || "—";
    document.getElementById("profile-role").textContent = user.role || "—";
    document.getElementById("profile-created").textContent =
      App.formatDate(user.createdAt);

    const roleBadge = document.getElementById("profile-role");
    roleBadge.className = `status-badge role-badge ${
      user.role === "admin" ? "role-admin" : "role-user"
    }`;

    const statusClass = {
      approved: "status-approved",
      pending: "status-pending",
      rejected: "status-rejected",
    }[user.approvalStatus] || "status-neutral";

    const statusBadge = document.getElementById("profile-status");
    statusBadge.textContent = user.approvalStatus || "Unknown";
    statusBadge.className = `status-badge ${statusClass}`;

    const summaryBadge = document.getElementById("profile-status-badge");
    summaryBadge.textContent = user.approvalStatus || "Unknown";
    summaryBadge.className = `status-badge ${statusClass}`;

    document.getElementById("profile-edit-name").value = user.name || "";
    document.getElementById("profile-edit-email").value = user.email || "";
    document.getElementById("admin-panel-link").hidden =
      user.role !== "admin";
  }

  async function loadProfile() {
    profileError.hidden = true;

    try {
      const response = await fetch("/api/users/profile", {
        headers: App.getAuthHeaders(),
      });

      if (App.handleUnauthorizedResponse(response)) {
        return false;
      }

      const data = await App.readJsonResponse(response);
      if (response.status === 403) {
        await handlePageForbidden(data.message);
        return false;
      }

      if (!response.ok || !data.success || !data.user) {
        App.showMessage(
          profileError,
          data.message || "Unable to load your profile.",
          "error"
        );
        return false;
      }

      displayProfile(data.user);
      App.saveAuth(App.getToken(), data.user);
      return true;
    } catch {
      App.showMessage(
        profileError,
        "Unable to connect to the server. Please try again.",
        "error"
      );
      return false;
    }
  }

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    editSuccess.hidden = true;
    editError.hidden = true;

    const name = document.getElementById("profile-edit-name").value.trim();
    const email = document.getElementById("profile-edit-email").value.trim();
    const submitButton = document.getElementById("profile-submit");

    if (name.length < 3) {
      App.showMessage(
        editError,
        "Name must be at least 3 characters.",
        "error"
      );
      return;
    }

    if (!emailPattern.test(email)) {
      App.showMessage(editError, "Enter a valid email address.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: App.getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ name, email }),
      });

      if (App.handleUnauthorizedResponse(response)) {
        return;
      }

      const data = await App.readJsonResponse(response);
      if (response.status === 403) {
        await handlePageForbidden(data.message);
        return;
      }

      if (!response.ok || !data.success) {
        App.showMessage(
          editError,
          data.message || "Unable to update your profile.",
          "error"
        );
        return;
      }

      App.showMessage(
        editSuccess,
        data.message || "Profile updated successfully.",
        "success"
      );
      await loadProfile();
    } catch {
      App.showMessage(
        editError,
        "Unable to connect to the server. Please try again.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Save changes";
    }
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    passwordSuccess.hidden = true;
    passwordError.hidden = true;

    const currentPassword =
      document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword =
      document.getElementById("confirm-new-password").value;
    const submitButton = document.getElementById("password-submit");

    if (!currentPassword || !newPassword || !confirmPassword) {
      App.showMessage(
        passwordError,
        "Complete all password fields.",
        "error"
      );
      return;
    }

    if (newPassword.length < 6) {
      App.showMessage(
        passwordError,
        "New password must be at least 6 characters.",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      App.showMessage(
        passwordError,
        "New passwords do not match.",
        "error"
      );
      return;
    }

    if (newPassword === currentPassword) {
      App.showMessage(
        passwordError,
        "New password must be different from the current password.",
        "error"
      );
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Changing...";

    try {
      const response = await fetch("/api/users/profile/password", {
        method: "PATCH",
        headers: App.getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (App.handleUnauthorizedResponse(response)) {
        return;
      }

      const data = await App.readJsonResponse(response);
      if (response.status === 403) {
        await handlePageForbidden(data.message);
        return;
      }

      if (!response.ok || !data.success) {
        App.showMessage(
          passwordError,
          data.message || "Unable to change your password.",
          "error"
        );
        return;
      }

      App.showMessage(
        passwordSuccess,
        data.message || "Password changed successfully.",
        "success"
      );
      passwordForm.reset();
    } catch {
      App.showMessage(
        passwordError,
        "Unable to connect to the server. Please try again.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Change password";
    }
  });

  loadProfile();
});
