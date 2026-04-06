// Popup script for UdePrompt
const THEME_STORAGE_KEY = "udeprompt-ui-theme";

const defaultTemplate =
  globalThis.UDEMY_TRANSCRIPT_DEFAULT_TEMPLATE ||
  "Transcript: {{ transcript }}";

const getTemplate = async () => {
  try {
    const result = await chrome.storage.local.get([
      "udemy-transcript-template",
    ]);
    return result["udemy-transcript-template"] ?? defaultTemplate;
  } catch {
    return defaultTemplate;
  }
};

const saveTemplate = async (template) => {
  try {
    await chrome.storage.local.set({"udemy-transcript-template": template});
  } catch {
    // ignore
  }
};

// Show message
const showMessage = (text, isError = false) => {
  const messageEl = document.getElementById("message");
  messageEl.setAttribute("role", isError ? "alert" : "status");
  messageEl.setAttribute("aria-live", isError ? "assertive" : "polite");
  messageEl.textContent = text;
  messageEl.className = `message ${isError ? "error" : "success"} show`;

  setTimeout(() => {
    messageEl.classList.remove("show");
  }, 3000);
};

const applyTheme = (mode) => {
  const html = document.documentElement;
  if (mode === "system") {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", mode);
  }
  for (const m of ["system", "light", "dark"]) {
    const btn = document.getElementById(`theme-${m}`);
    if (btn) {
      btn.setAttribute("aria-pressed", m === mode ? "true" : "false");
    }
  }
};

const loadTheme = async () => {
  try {
    const result = await chrome.storage.sync.get([THEME_STORAGE_KEY]);
    const stored = result[THEME_STORAGE_KEY];
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "system";
};

const saveTheme = async (mode) => {
  try {
    await chrome.storage.sync.set({[THEME_STORAGE_KEY]: mode});
  } catch {
    // ignore
  }
  applyTheme(mode);
};

// Load template on popup open
document.addEventListener("DOMContentLoaded", async () => {
  const textarea = document.getElementById("template-input");
  const resetBtn = document.getElementById("reset-btn");
  const saveBtn = document.getElementById("save-btn");

  applyTheme(await loadTheme());

  for (const m of ["system", "light", "dark"]) {
    document.getElementById(`theme-${m}`)?.addEventListener("click", () => {
      void saveTheme(m);
    });
  }

  resetBtn.disabled = true;
  saveBtn.disabled = true;

  let currentTemplate = defaultTemplate;
  try {
    currentTemplate = await getTemplate();
  } catch {
    // keep default
  }
  textarea.value = currentTemplate;
  textarea.disabled = false;
  textarea.removeAttribute("aria-busy");
  resetBtn.disabled = false;
  saveBtn.disabled = false;

  resetBtn.addEventListener("click", () => {
    textarea.value = defaultTemplate;
    showMessage("Template reset to default");
  });

  saveBtn.addEventListener("click", async () => {
    const newTemplate = textarea.value.trim();
    if (newTemplate) {
      await saveTemplate(newTemplate);
      showMessage("Template saved successfully!");
    } else {
      showMessage("Template cannot be empty.", true);
    }
  });
});
