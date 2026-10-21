"use strict";

/* =========================================================
   VERTEX — PLATAFORMA DE MOBILIDADE ASSISTIVA
   ========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const loginScreen = $("#loginScreen");
const loginForm = $("#loginForm");
const loginError = $("#loginError");
const appShell = $("#appShell");
const sidebar = $("#sidebar");
const toast = $("#toast");

const USER = {
  name: "Matheus Masson",
  email: "matheus.m@vertex.com",
  password: "Vertex2026!",
  initials: "MM"
};

const STORAGE = {
  session: "vertex_session_v1",
  history: "vertex_history_v1",
  theme: "vertex_theme_v1"
};

const TITLES = {
  inicio: "Painel principal",
  rotas: "Rotas e GPS",
  bateria: "Central de bateria",
  historico: "Histórico de trajetos",
  sobre: "Sobre o VERTEX"
};

let toastTimer = null;
let currentMapQuery = "UNASP Campus São Paulo";
let currentMapUrl = "https://www.google.com/maps/search/?api=1&query=UNASP%20Campus%20S%C3%A3o%20Paulo";

/* =========================================================
   NOTIFICAÇÕES
   ========================================================= */

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* =========================================================
   ARMAZENAMENTO LOCAL
   ========================================================= */

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast("Não foi possível salvar os dados neste navegador.");
    return false;
  }
}

function getHistory() {
  const value = readStorage(STORAGE.history, null);
  return Array.isArray(value) ? value : createInitialHistory();
}

function saveHistory(history) {
  writeStorage(STORAGE.history, history);
  renderHistory();
}

/* =========================================================
   HISTÓRICO INICIAL DO PERFIL
   ========================================================= */

function createInitialHistory() {
  const records = [
    {
      id: "vx-001",
      origin: "UNASP — Campus São Paulo",
      destination: "Biblioteca do UNASP",
      date: "2026-10-16T09:15:00",
      status: "Registrado",
      type: "initial"
    },
    {
      id: "vx-002",
      origin: "UNASP — Campus São Paulo",
      destination: "Restaurante Universitário",
      date: "2026-10-17T12:30:00",
      status: "Registrado",
      type: "initial"
    },
    {
      id: "vx-003",
      origin: "Biblioteca do UNASP",
      destination: "UNASP — Campus São Paulo",
      date: "2026-10-19T15:40:00",
      status: "Registrado",
      type: "initial"
    }
  ];

  writeStorage(STORAGE.history, records);
  return records;
}

/* =========================================================
   LOGIN E SESSÃO
   ========================================================= */

function showApp() {
  loginScreen.hidden = true;
  appShell.hidden = false;
  populateUser();
  renderHistory();
  updateDate();
  showPage("inicio");
}

function showLogin() {
  appShell.hidden = true;
  loginScreen.hidden = false;
  $("#loginEmail").value = USER.email;
  $("#loginPassword").value = USER.password;
  loginError.textContent = "";
}

function populateUser() {
  $("#sidebarName").textContent = USER.name;
  $("#topbarName").textContent = USER.name;
  $("#welcomeName").textContent = USER.name.split(" ")[0];
  $("#historyUser").textContent = USER.name;
  $("#sidebarAvatar").textContent = USER.initials;
  $$(".small-avatar").forEach(el => el.textContent = USER.initials);
}

loginForm.addEventListener("submit", event => {
  event.preventDefault();

  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;

  if (email === USER.email && password === USER.password) {
    writeStorage(STORAGE.session, { email: USER.email, name: USER.name });
    if (!Array.isArray(readStorage(STORAGE.history, null))) {
      createInitialHistory();
    }
    loginError.textContent = "";
    showApp();
    showToast(`Bem-vindo ao VERTEX, ${USER.name.split(" ")[0]}!`);
    return;
  }

  loginError.textContent = "E-mail ou senha incorretos. Verifique os dados e tente novamente.";
});

$("#togglePassword").addEventListener("click", () => {
  const input = $("#loginPassword");
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  $("#togglePassword").setAttribute("aria-label", showing ? "Mostrar senha" : "Ocultar senha");
});

$("#logoutButton").addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE.session);
  } catch {}
  sidebar.classList.remove("open");
  showLogin();
  showToast("Você saiu da sua conta.");
});

$("#userChip").addEventListener("click", () => {
  showPage("sobre");
  showToast(`Perfil conectado: ${USER.name}`);
});

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function showPage(pageId) {
  const target = document.getElementById(pageId);
  if (!target || !target.classList.contains("page")) return;

  $$(".page").forEach(page => page.classList.toggle("active", page.id === pageId));

  $$(".nav-item").forEach(item => {
    const active = item.dataset.page === pageId;
    item.classList.toggle("active", active);

    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });

  $("#pageTitle").textContent = TITLES[pageId] || "VERTEX";
  sidebar.classList.remove("open");

  if (pageId === "historico") renderHistory();
  if (pageId === "inicio") renderRecentRoutes();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

$$("[data-page]").forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();
    showPage(button.dataset.page);
  });
});

$("#menuToggle").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

document.addEventListener("click", event => {
  if (window.innerWidth > 700 || !sidebar.classList.contains("open")) return;
  if (sidebar.contains(event.target) || $("#menuToggle").contains(event.target)) return;
  sidebar.classList.remove("open");
});

/* =========================================================
   TEMA CLARO / ESCURO
   ========================================================= */

function setTheme(theme) {
  const dark = theme === "dark";

  document.body.classList.toggle("dark", dark);
  $("#themeIcon").textContent = dark ? "☀" : "☾";
  $("#themeLabel").textContent = dark ? "Modo claro" : "Modo escuro";
  $("#themeToggle").setAttribute(
    "aria-label",
    dark ? "Ativar tema claro" : "Ativar tema escuro"
  );

  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  $('meta[name="theme-color"]').setAttribute(
    "content",
    dark ? "#0b1321" : "#f3f6fb"
  );

  writeStorage(STORAGE.theme, theme);
}

$("#themeToggle").addEventListener("click", () => {
  setTheme(document.body.classList.contains("dark") ? "light" : "dark");
});

const savedTheme = readStorage(STORAGE.theme, null);
const preferredTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";

setTheme(savedTheme || preferredTheme);

/* =========================================================
   DATA DO PAINEL
   ========================================================= */

function updateDate() {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(now);

  $("#welcomeDate").textContent = formatted.toLocaleUpperCase("pt-BR");
}

/* =========================================================
   MAPA E CONSULTA DE ROTAS
   ========================================================= */

const mapFrame = $("#mapFrame");
const mapLocationTitle = $("#mapLocationTitle");
const mapLocationSubtitle = $("#mapLocationSubtitle");

function encodeQuery(value) {
  return encodeURIComponent(value.trim());
}

function updateMap(query, subtitle = "Destino pesquisado no Google Maps") {
  currentMapQuery = query;
  currentMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeQuery(query)}`;

  mapFrame.src =
    `https://maps.google.com/maps?q=${encodeQuery(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  mapLocationTitle.textContent = query;
  mapLocationSubtitle.textContent = subtitle;
}

$("#openGoogleMaps").addEventListener("click", () => {
  window.open(currentMapUrl, "_blank", "noopener,noreferrer");
});

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Data não disponível";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function makeRouteId() {
  return `vx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

$("#routeForm").addEventListener("submit", event => {
  event.preventDefault();

  const origin = $("#origin").value.trim();
  const destination = $("#destination").value.trim();
  const message = $("#routeMessage");

  if (!origin || !destination) {
    message.textContent = "Informe a origem e o destino para consultar a rota.";
    showToast("Preencha a origem e o destino.");
    return;
  }

  if (origin.toLowerCase() === destination.toLowerCase()) {
    message.textContent = "Escolha um destino diferente do ponto de partida.";
    showToast("Origem e destino precisam ser diferentes.");
    return;
  }

  const record = {
    id: makeRouteId(),
    origin,
    destination,
    date: new Date().toISOString(),
    status: "Consultado",
    type: "user"
  };

  const history = getHistory();
  history.unshift(record);
  saveHistory(history);

  updateMap(destination, `Destino: ${destination}`);

  const directionsUrl =
    `https://www.google.com/maps/dir/?api=1&origin=${encodeQuery(origin)}` +
    `&destination=${encodeQuery(destination)}&travelmode=walking`;

  message.textContent = "Consulta preparada. O Google Maps será aberto em uma nova aba.";
  showToast("Trajeto adicionado ao seu histórico.");

  window.open(directionsUrl, "_blank", "noopener,noreferrer");
});

$$("[data-destination]").forEach(button => {
  button.addEventListener("click", () => {
    const destination = button.dataset.destination;
    $("#destination").value = destination;
    updateMap(destination, "Destino selecionado");

    $("#routeMessage").textContent = `Destino selecionado: ${destination}.`;
    showToast("Destino selecionado no mapa.");

    if (window.innerWidth <= 700) {
      $("#destination").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
});

/* =========================================================
   HISTÓRICO DE TRAJETOS
   ========================================================= */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function routeName(record) {
  return `${record.origin} → ${record.destination}`;
}

function renderRecentRoutes() {
  const history = getHistory().slice().sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  ).slice(0, 3);

  const container = $("#recentRoutes");
  container.innerHTML = "";

  if (!history.length) {
    container.innerHTML = '<p class="muted small">Seus novos trajetos aparecerão aqui.</p>';
    $("#routeCount").textContent = "0";
    return;
  }

  history.forEach(record => {
    const item = document.createElement("div");
    item.className = "recent-route";
    item.innerHTML = `
      <div class="recent-route-icon">⌖</div>
      <div class="recent-route-info">
        <strong>${escapeHTML(routeName(record))}</strong>
        <small>${escapeHTML(formatDate(record.date))}</small>
      </div>
      <span class="table-status">${escapeHTML(record.status || "Registrado")}</span>
    `;
    container.appendChild(item);
  });

  $("#routeCount").textContent = String(getHistory().length);
}

function renderHistory() {
  const history = getHistory().slice().sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const body = $("#historyTableBody");
  const empty = $("#emptyHistory");

  body.innerHTML = "";
  $("#historyTotal").textContent = String(history.length);
  $("#routeCount").textContent = String(history.length);
  $("#historyUser").textContent = USER.name;

  empty.hidden = history.length !== 0;

  history.forEach(record => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHTML(routeName(record))}</td>
      <td>${escapeHTML(formatDate(record.date))}</td>
      <td>${escapeHTML(record.origin)}</td>
      <td>${escapeHTML(record.destination)}</td>
      <td><span class="table-status">${escapeHTML(record.status || "Registrado")}</span></td>
    `;
    body.appendChild(row);
  });

  renderRecentRoutes();
}

$("#clearHistory").addEventListener("click", () => {
  const confirmed = window.confirm(
    "Deseja realmente apagar todos os trajetos deste navegador? Essa ação não poderá ser desfeita."
  );

  if (!confirmed) return;

  saveHistory([]);
  showToast("Histórico limpo.");
});

$("#exportHistory").addEventListener("click", () => {
  const history = getHistory().slice().sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  if (!history.length) {
    showToast("Não há trajetos para exportar.");
    return;
  }

  const rows = [
    ["ID", "Origem", "Destino", "Data e hora", "Status"],
    ...history.map(item => [
      item.id,
      item.origin,
      item.destination,
      formatDate(item.date),
      item.status || "Registrado"
    ])
  ];

  const csv = "\uFEFF" + rows.map(row =>
    row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(";")
  ).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "vertex-historico-trajetos.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showToast("Arquivo CSV exportado.");
});

/* =========================================================
   BATERIA — ANIMAÇÃO VISUAL
   ========================================================= */

const batteryReference = 85;

function updateBatteryDisplay(value) {
  const percentage = Math.max(0, Math.min(100, value));
  const formatted = `${Math.round(percentage)}%`;

  $("#batteryValue").textContent = formatted;
  $("#batteryDetail").textContent = formatted;
  $("#batteryDetailSecond").textContent = formatted;
  $("#bigBatteryValue").textContent = formatted;

  $("#batteryProgress").style.width = `${percentage}%`;
  $("#batteryProgressLarge").style.width = `${percentage}%`;
  $("#bigBatteryFill").style.height = `${percentage}%`;
}

updateBatteryDisplay(batteryReference);

/*
  A onda anima a apresentação visual sem alterar o percentual.
  Para leituras reais, conecte aqui a fonte de dados do hardware.
*/

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

function initialize() {
  updateDate();

  const session = readStorage(STORAGE.session, null);

  if (session && session.email === USER.email) {
    showApp();
  } else {
    showLogin();
  }

  if (!Array.isArray(readStorage(STORAGE.history, null))) {
    createInitialHistory();
  }
}

initialize();