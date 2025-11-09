// Udemy Transcript Copier - Content Script
// Detects clicks on Transcript tab and automatically copies transcript to clipboard

(() => {
  let isProcessing = false;

  // Default template
  const defaultTemplate = `Analyze this video and provide insights.

Transcript: {{ transcript }}

Please provide:
1. Executive Summary
2. Key Points & Takeaways
3. Notable Quotes
4. Actionable Insights

Format as clear, structured content.
Result in Vietnamese and English.`;

  // Get template from storage or use default
  const getTemplate = async () => {
    try {
      // Try chrome.storage.local first (for popup sync)
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get([
          "udemy-transcript-template",
        ]);
        if (result["udemy-transcript-template"]) {
          return result["udemy-transcript-template"];
        }
      }
    } catch (_error) {
      // Fallback to localStorage
    }
    // Fallback to localStorage
    const saved = localStorage.getItem("udemy-transcript-template");
    return saved || defaultTemplate;
  };

  // Save template to storage
  const saveTemplate = async (template) => {
    try {
      // Save to chrome.storage.local for popup sync
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.set({
          "udemy-transcript-template": template,
        });
      }
    } catch (_error) {
      // Fallback to localStorage
    }
    // Also save to localStorage as fallback
    localStorage.setItem("udemy-transcript-template", template);
  };

  // Show notification message
  const showNotification = (message, isError = false) => {
    // Remove existing notification if any
    const existing = document.getElementById("udemy-transcript-notification");
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement("div");
    notification.id = "udemy-transcript-notification";
    notification.className = `udemy-transcript-notification ${
      isError ? "error" : "success"
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  };

  // Extract transcript text from the DOM
  const extractTranscript = () => {
    // First, find the transcript panel using stable selectors
    const transcriptPanel =
      document.querySelector('[data-purpose="transcript-panel"]') ||
      document.querySelector('[class*="transcript-panel"]') ||
      document.querySelector('[class*="sidebar--transcript"]') ||
      document.querySelector('[class*="transcript--transcript-panel"]');

    if (!transcriptPanel) {
      return null;
    }

    // Try multiple strategies to find transcript cue containers
    // Use attribute selectors that match partial class names (handles dynamic hashes)
    let transcriptContainers = transcriptPanel.querySelectorAll(
      '[class*="transcript--cue-container"]',
    );
    if (transcriptContainers.length === 0) {
      transcriptContainers = transcriptPanel.querySelectorAll(
        '[class*="cue-container"]',
      );
    }
    if (transcriptContainers.length === 0) {
      transcriptContainers = transcriptPanel.querySelectorAll(
        '[data-purpose*="cue"]',
      );
    }

    const transcriptTexts = [];

    // If we found specific containers, extract from them
    if (transcriptContainers.length > 0) {
      transcriptContainers.forEach((container) => {
        // Get all text nodes, excluding timestamps and other UI elements
        const textElements = container.querySelectorAll("span, p, div");
        let text = "";

        textElements.forEach((el) => {
          // Skip if it's a timestamp or control element
          if (
            el.classList.toString().includes("transcript--time") ||
            el.querySelector("svg") ||
            el.getAttribute("role") === "button" ||
            el.closest("button")
          ) {
            return;
          }

          const textContent = el.textContent?.trim();
          if (textContent && textContent.length > 0) {
            text += `${textContent} `;
          }
        });

        // Fallback: get direct text content if no child elements
        if (!text.trim()) {
          text = container.textContent?.trim() || "";
        }

        if (text.trim()) {
          transcriptTexts.push(text.trim());
        }
      });
    }

    // If no containers found or no text extracted, try getting all text from panel
    if (transcriptTexts.length === 0) {
      // Get all text but filter out UI elements
      const allElements = transcriptPanel.querySelectorAll("span, p, div");
      const filteredTexts = [];

      allElements.forEach((el) => {
        // Skip buttons, SVGs, and control elements
        if (
          el.closest("button") ||
          el.querySelector("svg") ||
          el.getAttribute("role") === "button" ||
          el.classList.toString().includes("time") ||
          el.classList.toString().includes("button")
        ) {
          return;
        }

        const text = el.textContent?.trim();
        if (text && text.length > 5) {
          // Only include substantial text (more than 5 chars)
          filteredTexts.push(text);
        }
      });

      if (filteredTexts.length > 0) {
        // Remove duplicates and join
        const uniqueTexts = [...new Set(filteredTexts)];
        return uniqueTexts.join("\n\n").replace(/\s+/g, " ").trim();
      }

      // Final fallback: get all text from panel
      const allText = transcriptPanel.innerText || transcriptPanel.textContent;
      if (allText && allText.trim().length > 0) {
        // Clean up the text - remove excessive whitespace
        return allText
          .trim()
          .split(/\n+/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .join("\n\n");
      }
    }

    if (transcriptTexts.length === 0) {
      return null;
    }

    return transcriptTexts.join("\n\n").replace(/\s+/g, " ").trim();
  };

  // Copy transcript to clipboard
  const copyTranscript = async () => {
    if (isProcessing) {
      return;
    }

    isProcessing = true;

    try {
      // Wait a bit for transcript to load after tab click
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try to extract transcript with retries
      let transcript = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!transcript && attempts < maxAttempts) {
        transcript = extractTranscript();
        if (!transcript) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          attempts++;
        }
      }

      if (!transcript) {
        showNotification(
          "Transcript not found. Please make sure the transcript panel is open.",
          true,
        );
        isProcessing = false;
        return;
      }

      // Get template and replace placeholder
      const template = await getTemplate();
      const formattedText = template.replace("{{ transcript }}", transcript);

      // Copy to clipboard
      await navigator.clipboard.writeText(formattedText);
      showNotification("Transcript copied to clipboard!");
    } catch (_error) {
      showNotification("Failed to copy transcript. Please try again.", true);
    } finally {
      isProcessing = false;
    }
  };

  // Find Transcript tab button
  const findTranscriptTab = () => {
    // Try multiple selectors to find the Transcript tab button
    const selectors = [
      'button[role="tab"] .ud-btn-label',
      "button.tabs-module--nav-button--DtB8V .ud-btn-label",
      "button.ud-nav-button .ud-btn-label",
    ];

    for (const selector of selectors) {
      const labels = document.querySelectorAll(selector);
      for (const label of labels) {
        if (label.textContent?.trim().toLowerCase() === "transcript") {
          const button =
            label.closest('button[role="tab"]') || label.closest("button");
          if (button) {
            return button;
          }
        }
      }
    }

    // Fallback: search by text content in buttons
    const allButtons = document.querySelectorAll('button[role="tab"]');
    for (const button of allButtons) {
      const text = button.textContent?.trim().toLowerCase();
      if (text === "transcript" || text.includes("transcript")) {
        return button;
      }
    }

    return null;
  };

  // Setup click listener on Transcript tab
  const setupTranscriptTabListener = () => {
    const transcriptTab = findTranscriptTab();

    if (transcriptTab) {
      // Add class for styling
      transcriptTab.classList.add("udemy-transcript-tab");
      // Remove existing listener if any
      transcriptTab.removeEventListener("click", handleTranscriptTabClick);
      // Add click listener
      transcriptTab.addEventListener("click", handleTranscriptTabClick, true);
    }
  };

  // Handle Transcript tab click
  const handleTranscriptTabClick = (_event) => {
    // Small delay to ensure transcript panel starts loading
    setTimeout(() => {
      copyTranscript();
    }, 100);
  };

  // Find transcript toggle button (sidebar button)
  const findTranscriptToggle = () => {
    return document.querySelector('button[data-purpose="transcript-toggle"]');
  };

  // Check if transcript sidebar is already open
  const isTranscriptSidebarOpen = () => {
    const transcriptToggle = findTranscriptToggle();
    if (transcriptToggle) {
      // Check aria-expanded attribute
      const ariaExpanded = transcriptToggle.getAttribute("aria-expanded");
      if (ariaExpanded === "true") {
        return true;
      }

      // Also check if transcript panel is visible
      const transcriptPanel =
        document.querySelector('[data-purpose="transcript-panel"]') ||
        document.querySelector('[class*="transcript-panel"]') ||
        document.querySelector('[class*="sidebar--transcript"]');

      if (transcriptPanel) {
        const style = window.getComputedStyle(transcriptPanel);
        if (style.display !== "none" && style.visibility !== "hidden") {
          return true;
        }
      }
    }
    return false;
  };

  // Open transcript sidebar programmatically
  const openTranscriptSidebar = () => {
    const transcriptToggle = findTranscriptToggle();
    if (transcriptToggle) {
      // Click the toggle button to open sidebar
      transcriptToggle.click();
      return true;
    }
    return false;
  };

  // Handle FAB button click - open transcript sidebar and copy
  const handleFABClick = async () => {
    if (isProcessing) {
      return;
    }

    // Check if sidebar is already open
    const isOpen = isTranscriptSidebarOpen();

    if (!isOpen) {
      // Open the transcript sidebar
      const sidebarOpened = openTranscriptSidebar();
      if (!sidebarOpened) {
        showNotification("Could not find Transcript button.", true);
        return;
      }

      // Wait a bit for the sidebar to open and transcript to load
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      // Sidebar is already open, just wait a bit for any dynamic content
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Copy the transcript
    await copyTranscript();
  };

  // Show/hide settings panel
  const toggleSettingsPanel = async () => {
    const existing = document.getElementById("udemy-transcript-settings");
    const existingBackdrop = document.getElementById(
      "udemy-transcript-settings-backdrop",
    );
    if (existing) {
      existing.remove();
      if (existingBackdrop) existingBackdrop.remove();
      return;
    }

    // Create backdrop
    const backdrop = document.createElement("div");
    backdrop.id = "udemy-transcript-settings-backdrop";
    backdrop.className = "udemy-transcript-settings-backdrop";

    const panel = document.createElement("div");
    panel.id = "udemy-transcript-settings";
    panel.className = "udemy-transcript-settings";

    const currentTemplate = await getTemplate();

    panel.innerHTML = `
      <div class="udemy-transcript-settings-header">
        <h3>Transcript Template Settings</h3>
        <button class="udemy-transcript-settings-close" aria-label="Close">×</button>
      </div>
      <div class="udemy-transcript-settings-body">
        <label for="udemy-transcript-template-input">Edit template (use {{ transcript }} as placeholder):</label>
        <textarea id="udemy-transcript-template-input" rows="12" placeholder="${defaultTemplate}">${currentTemplate}</textarea>
        <div class="udemy-transcript-settings-actions">
          <button class="udemy-transcript-settings-reset">Reset to Default</button>
          <button class="udemy-transcript-settings-save">Save</button>
        </div>
      </div>
    `;

    // Close function
    const closePanel = () => {
      panel.remove();
      backdrop.remove();
    };

    // Backdrop click handler
    backdrop.addEventListener("click", closePanel);

    panel
      .querySelector(".udemy-transcript-settings-close")
      .addEventListener("click", closePanel);

    // Reset button
    panel
      .querySelector(".udemy-transcript-settings-reset")
      .addEventListener("click", () => {
        const textarea = panel.querySelector(
          "#udemy-transcript-template-input",
        );
        textarea.value = defaultTemplate;
      });

    // Save button
    panel
      .querySelector(".udemy-transcript-settings-save")
      .addEventListener("click", async () => {
        const textarea = panel.querySelector(
          "#udemy-transcript-template-input",
        );
        const newTemplate = textarea.value.trim();
        if (newTemplate) {
          await saveTemplate(newTemplate);
          showNotification("Template saved successfully!");
          closePanel();
        } else {
          showNotification("Template cannot be empty.", true);
        }
      });

    // Close on outside click
    panel.addEventListener("click", (e) => {
      if (e.target === panel) {
        closePanel();
      }
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
  };

  // Create and inject FAB button
  const createFAB = () => {
    // Remove existing FAB if any
    const existingFAB = document.getElementById("udemy-transcript-fab");
    if (existingFAB) {
      existingFAB.remove();
    }

    const fabContainer = document.createElement("div");
    fabContainer.id = "udemy-transcript-fab-container";
    fabContainer.className = "udemy-transcript-fab-container";

    const fab = document.createElement("button");
    fab.id = "udemy-transcript-fab";
    fab.className = "udemy-transcript-fab";
    fab.setAttribute("aria-label", "Copy transcript");
    fab.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
      </svg>
    `;
    fab.addEventListener("click", handleFABClick);

    const settingsBtn = document.createElement("button");
    settingsBtn.id = "udemy-transcript-settings-btn";
    settingsBtn.className = "udemy-transcript-settings-btn";
    settingsBtn.setAttribute("aria-label", "Settings");
    settingsBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.31-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.09-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.31.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
      </svg>
    `;
    settingsBtn.addEventListener("click", toggleSettingsPanel);

    fabContainer.appendChild(fab);
    fabContainer.appendChild(settingsBtn);
    document.body.appendChild(fabContainer);
  };

  // Initialize when page loads
  const init = () => {
    // Create FAB button
    createFAB();

    // Setup initial listener
    setupTranscriptTabListener();

    // Use MutationObserver to handle dynamic content
    const observer = new MutationObserver(() => {
      setupTranscriptTabListener();
    });

    // Observe changes to the document body
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also check periodically for the tab button (in case observer misses it)
    const _checkInterval = setInterval(() => {
      const tab = findTranscriptTab();
      if (tab) {
        setupTranscriptTabListener();
        // Clear interval once we found it and set up listener
        // But keep checking in case page structure changes
      }
    }, 1000);
  };

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
