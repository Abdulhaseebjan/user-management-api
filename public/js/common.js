function getToken() {
  return localStorage.getItem("token");
}

function getStoredUser() {
  const savedUser = localStorage.getItem("user");
  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function getAuthHeaders(headers = {}) {
  const token = getToken();
  const authHeaders = { ...headers };

  if (token) {
    authHeaders.Authorization = `Bearer ${token}`;
  }

  return authHeaders;
}

function saveAuth(token, user) {
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Production apps generally prefer secure httpOnly cookies to reduce token theft through XSS.
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(safeUser));
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function logout() {
  clearAuth();
  window.location.href = "/login.html";
}

function requireLogin() {
  if (!getToken()) {
    sessionStorage.setItem("sessionMessage", "Please log in to continue.");
    window.location.href = "/login.html";
    return false;
  }

  return true;
}

function handleUnauthorizedResponse(response) {
  if (response.status !== 401) {
    return false;
  }

  clearAuth();
  sessionStorage.setItem(
    "sessionMessage",
    "Your session expired. Please log in again."
  );
  window.location.href = "/login.html";
  return true;
}

function showMessage(element, message, type) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.remove("alert-success", "alert-error");
  element.classList.add(type === "success" ? "alert-success" : "alert-error");
  element.hidden = false;
}

async function readJsonResponse(response) {
  try {
    const data = await response.json();
    if (data && typeof data === "object") {
      return data;
    }
  } catch {
    return {
      success: false,
      message: "The server returned an invalid response.",
    };
  }

  return {
    success: false,
    message: "The server returned an invalid response.",
  };
}

function formatDate(dateString) {
  if (!dateString) {
    return "Not available";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function addNavigationLink(container, label, href) {
  const link = document.createElement("a");
  link.className = "nav-link";
  link.href = href;
  link.textContent = label;

  const currentPath = window.location.pathname;
  if (currentPath === href || (href === "/" && currentPath === "/index.html")) {
    link.classList.add("nav-link-current");
    link.setAttribute("aria-current", "page");
  }

  container.append(link);
}

function updateNavigation() {
  const navigation = document.getElementById("site-nav");
  const toggle = document.getElementById("nav-toggle");

  if (!navigation) {
    return;
  }

  navigation.replaceChildren();

  if (getToken()) {
    addNavigationLink(navigation, "Dashboard", "/dashboard.html");
    const user = getStoredUser();
    if (user && user.role === "admin") {
      addNavigationLink(navigation, "Admin Panel", "/admin.html");
    }

    const logoutButton = document.createElement("button");
    logoutButton.className = "nav-link";
    logoutButton.type = "button";
    logoutButton.textContent = "Logout";
    logoutButton.addEventListener("click", logout);
    navigation.append(logoutButton);
  } else {
    addNavigationLink(navigation, "Home", "/");
    addNavigationLink(navigation, "Sign Up", "/signup.html");
    addNavigationLink(navigation, "Login", "/login.html");
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.textContent = isOpen ? "Close" : "Menu";
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
      });
    });
  }
}

async function checkServerHealth() {
  const badge = document.getElementById("server-status");
  const detail = document.getElementById("server-status-detail");

  if (!badge || !detail) {
    return;
  }

  try {
    const response = await fetch("/api/health");
    const data = await readJsonResponse(response);

    if (!response.ok || !data.success) {
      throw new Error("Health check failed");
    }

    badge.textContent = "Server Online";
    badge.className = "status-badge status-online";
    detail.textContent = data.message;
  } catch {
    badge.textContent = "Server Offline";
    badge.className = "status-badge status-offline";
    detail.textContent = "The API server is not responding.";
  }
}

window.App = {
  getToken,
  getStoredUser,
  getAuthHeaders,
  saveAuth,
  clearAuth,
  logout,
  requireLogin,
  handleUnauthorizedResponse,
  showMessage,
  readJsonResponse,
  formatDate,
  escapeHTML,
  updateNavigation,
  checkServerHealth,
};

document.addEventListener("DOMContentLoaded", () => {
  updateNavigation();
  checkServerHealth();
});
