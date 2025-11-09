// Popup script for Udemy Transcript Copier

const defaultTemplate = `Analyze this video and provide insights.

Transcript: {{ transcript }}

Please provide:
1. Executive Summary
2. Key Points & Takeaways
3. Notable Quotes
4. Actionable Insights

Format as clear, structured content.
Result in Vietnamese and English.`;

// Get template from storage
const getTemplate = async () => {
  try {
    const result = await chrome.storage.local.get([
      "udemy-transcript-template",
    ]);
    return result["udemy-transcript-template"] || defaultTemplate;
  } catch (_error) {
    // Fallback to localStorage for compatibility
    return localStorage.getItem("udemy-transcript-template") || defaultTemplate;
  }
};

// Save template to storage
const saveTemplate = async (template) => {
  try {
    await chrome.storage.local.set({"udemy-transcript-template": template});
    // Also save to localStorage for content script compatibility
    localStorage.setItem("udemy-transcript-template", template);
  } catch (_error) {
    // Fallback to localStorage
    localStorage.setItem("udemy-transcript-template", template);
  }
};

// Show message
const showMessage = (text, isError = false) => {
  const messageEl = document.getElementById("message");
  messageEl.textContent = text;
  messageEl.className = `message ${isError ? "error" : "success"} show`;

  setTimeout(() => {
    messageEl.classList.remove("show");
  }, 3000);
};

// Load template on popup open
document.addEventListener("DOMContentLoaded", async () => {
  const textarea = document.getElementById("template-input");
  const resetBtn = document.getElementById("reset-btn");
  const saveBtn = document.getElementById("save-btn");

  // Load current template
  const currentTemplate = await getTemplate();
  textarea.value = currentTemplate;

  // Reset button
  resetBtn.addEventListener("click", () => {
    textarea.value = defaultTemplate;
    showMessage("Template reset to default");
  });

  // Save button
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
