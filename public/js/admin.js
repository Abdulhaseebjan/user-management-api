document.addEventListener("DOMContentLoaded", () => {
  if (!App.requireLogin()) {
    return;
  }

  const storedUser = App.getStoredUser();
  if (!storedUser || storedUser.role !== "admin") {
    window.location.href = "/dashboard.html";
    return;
  }

  const successMessage = document.getElementById("admin-success");
  const errorMessage = document.getElementById("admin-error");
  const filterSelect = document.getElementById("user-filter");
  const tableBody = document.getElementById("users-table-body");
  const tableWrap = document.getElementById("users-table-wrap");
  const loadingState = document.getElementById("users-loading");
  const emptyState = document.getElementById("users-empty");
  const modal = document.getElementById("confirm-modal");
  const modalDescription = document.getElementById("confirm-description");
  const confirmButton = document.getElementById("confirm-action");
  let currentFilter = "all";
  let pendingAction = null;
  const creationDates = new Map();

  function showAdminMessage(element, message, type) {
    const otherMessage = element === successMessage ? errorMessage : successMessage;
    otherMessage.hidden = true;
    App.showMessage(element, message, type);
  }

  function setSummary(users) {
    document.getElementById("total-users").textContent = users.length;
    document.getElementById("pending-users").textContent = users.filter(
      (user) => user.approvalStatus === "pending"
    ).length;
    document.getElementById("approved-users").textContent = users.filter(
      (user) => user.approvalStatus === "approved"
    ).length;
    document.getElementById("rejected-users").textContent = users.filter(
      (user) => user.approvalStatus === "rejected"
    ).length;
  }

  function addTextCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value || "—";
    row.append(cell);
    return cell;
  }

  function addBadgeCell(row, value, className) {
    const cell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `status-badge ${className}`;
    badge.textContent = value;
    cell.append(badge);
    row.append(cell);
  }

  function createActionButton(label, action, user, className) {
    const button = document.createElement("button");
    button.className = `button button-small ${className}`;
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => openConfirmation(action, user));
    return button;
  }

  function renderUsers(users) {
    tableBody.replaceChildren();
    document.getElementById("user-list-count").textContent =
      `${users.length} ${users.length === 1 ? "user" : "users"}`;

    if (users.length === 0) {
      tableWrap.hidden = true;
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    tableWrap.hidden = false;

    users.forEach((user) => {
      const row = document.createElement("tr");
      addTextCell(row, user.name);
      addTextCell(row, user.email);
      addBadgeCell(
        row,
        user.role || "user",
        user.role === "admin" ? "role-admin" : "role-user"
      );

      const statusClass = {
        pending: "status-pending",
        approved: "status-approved",
        rejected: "status-rejected",
      }[user.approvalStatus] || "status-neutral";
      addBadgeCell(row, user.approvalStatus || "Unknown", statusClass);
      addTextCell(row, App.formatDate(user.createdAt));

      const actionsCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "table-actions";

      const isCurrentAdmin =
        String(user.id).toLowerCase() === String(storedUser.id).toLowerCase();

      if (user.approvalStatus === "pending" && !isCurrentAdmin) {
        actions.append(
          createActionButton("Approve", "approve", user, "button-primary"),
          createActionButton("Reject", "reject", user, "button-secondary")
        );
      }

      if (!isCurrentAdmin) {
        actions.append(
          createActionButton("Delete", "delete", user, "button-danger")
        );
      }

      actionsCell.append(actions);
      row.append(actionsCell);
      tableBody.append(row);
    });
  }

  function handleForbidden(data) {
    const message = data.message || "Admin access required.";
    sessionStorage.setItem("pageMessage", message);
    window.location.href = "/dashboard.html";
  }

  async function loadCreationDate(user) {
    const userId = String(user.id);
    if (creationDates.has(userId)) {
      return true;
    }

    const response = await fetch(
      `/api/admin/users/${encodeURIComponent(userId)}`,
      {
        headers: App.getAuthHeaders(),
      }
    );

    if (App.handleUnauthorizedResponse(response)) {
      return false;
    }

    const data = await App.readJsonResponse(response);
    if (response.status === 403) {
      handleForbidden(data);
      return false;
    }

    if (response.status === 404) {
      creationDates.set(userId, null);
      return true;
    }

    if (!response.ok || !data.success || !data.user) {
      throw new Error("Unable to load account details.");
    }

    creationDates.set(userId, data.user.createdAt || null);
    return true;
  }

  async function loadCreationDates(users) {
    const results = await Promise.all(users.map(loadCreationDate));
    if (results.includes(false)) {
      return null;
    }

    return users.map((user) => ({
      ...user,
      createdAt: creationDates.get(String(user.id)),
    }));
  }

  async function loadUsers() {
    successMessage.hidden = true;
    errorMessage.hidden = true;
    loadingState.hidden = false;
    emptyState.hidden = true;
    tableWrap.hidden = true;

    try {
      const allResponse = await fetch("/api/admin/users", {
        headers: App.getAuthHeaders(),
      });

      if (App.handleUnauthorizedResponse(allResponse)) {
        return;
      }

      const allData = await App.readJsonResponse(allResponse);
      if (allResponse.status === 403) {
        handleForbidden(allData);
        return;
      }

      if (!allResponse.ok || !allData.success || !Array.isArray(allData.users)) {
        showAdminMessage(
          errorMessage,
          allData.message || "Unable to load users.",
          "error"
        );
        return;
      }

      setSummary(allData.users);
      const usersWithDates = await loadCreationDates(allData.users);
      if (!usersWithDates) {
        return;
      }

      if (currentFilter === "all") {
        renderUsers(usersWithDates);
        return;
      }

      const filteredResponse = await fetch(
        `/api/admin/users?approvalStatus=${encodeURIComponent(currentFilter)}`,
        {
          headers: App.getAuthHeaders(),
        }
      );

      if (App.handleUnauthorizedResponse(filteredResponse)) {
        return;
      }

      const filteredData = await App.readJsonResponse(filteredResponse);
      if (filteredResponse.status === 403) {
        handleForbidden(filteredData);
        return;
      }

      if (
        !filteredResponse.ok ||
        !filteredData.success ||
        !Array.isArray(filteredData.users)
      ) {
        showAdminMessage(
          errorMessage,
          filteredData.message || "Unable to filter users.",
          "error"
        );
        return;
      }

      const visibleUsers = filteredData.users.map((user) => ({
        ...user,
        createdAt: creationDates.get(String(user.id)),
      }));
      renderUsers(visibleUsers);
    } catch {
      showAdminMessage(
        errorMessage,
        "Unable to load users. Please try again.",
        "error"
      );
    } finally {
      loadingState.hidden = true;
    }
  }

  function openConfirmation(action, user) {
    pendingAction = { action, user };
    const descriptions = {
      approve: `Approve ${user.name}'s account?`,
      reject: `Reject ${user.name}'s account?`,
      delete: `Delete ${user.name}'s account? This cannot be undone.`,
    };

    modalDescription.textContent = descriptions[action];
    confirmButton.textContent =
      action === "delete" ? "Confirm delete" : `Confirm ${action}`;
    confirmButton.className = `button ${
      action === "delete" || action === "reject"
        ? "button-danger"
        : "button-primary"
    }`;
    modal.hidden = false;
    confirmButton.focus();
  }

  function closeConfirmation() {
    modal.hidden = true;
    pendingAction = null;
  }

  async function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    const { action, user } = pendingAction;
    const isDelete = action === "delete";
    confirmButton.disabled = true;
    confirmButton.textContent = isDelete ? "Deleting..." : "Updating...";

    try {
      const requestOptions = {
        method: isDelete ? "DELETE" : "PATCH",
        headers: App.getAuthHeaders(),
      };

      if (!isDelete) {
        requestOptions.headers["Content-Type"] = "application/json";
        requestOptions.body = JSON.stringify({
          approvalStatus: action === "approve" ? "approved" : "rejected",
        });
      }

      const endpoint = isDelete
        ? `/api/admin/users/${encodeURIComponent(user.id)}`
        : `/api/admin/users/${encodeURIComponent(user.id)}/approval`;
      const response = await fetch(endpoint, requestOptions);

      if (App.handleUnauthorizedResponse(response)) {
        return;
      }

      const data = await App.readJsonResponse(response);
      if (response.status === 403) {
        closeConfirmation();
        handleForbidden(data);
        return;
      }

      if (!response.ok || !data.success) {
        closeConfirmation();
        showAdminMessage(
          errorMessage,
          data.message || "Unable to complete that action.",
          "error"
        );
        return;
      }

      closeConfirmation();
      await loadUsers();
      showAdminMessage(
        successMessage,
        data.message || "The action was completed.",
        "success"
      );
    } catch {
      closeConfirmation();
      showAdminMessage(
        errorMessage,
        "Unable to connect to the server. Please try again.",
        "error"
      );
    } finally {
      confirmButton.disabled = false;
      confirmButton.textContent = "Confirm";
    }
  }

  filterSelect.addEventListener("change", () => {
    currentFilter = filterSelect.value;
    loadUsers();
  });

  document
    .getElementById("cancel-action")
    .addEventListener("click", closeConfirmation);
  confirmButton.addEventListener("click", confirmPendingAction);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeConfirmation();
    }
  });

  loadUsers();
});
