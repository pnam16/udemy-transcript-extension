// UdePrompt - Content Script
// Detects clicks on Transcript tab and automatically copies transcript to clipboard

(() => {
  const UI_THEME_STORAGE_KEY = "udeprompt-ui-theme";
  let cachedPageUiTheme = "system";

  let isProcessing = false;
  const defaultTemplate =
    globalThis.UDEMY_TRANSCRIPT_DEFAULT_TEMPLATE ||
    "Transcript: {{ transcript }}";

  const getTemplate = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        const result = await chrome.storage.local.get([
          "udemy-transcript-template",
        ]);
        const stored = result["udemy-transcript-template"];
        if (stored) {
          return stored;
        }
      }
    } catch {
      // ignore
    }
    return defaultTemplate;
  };

  let notificationEl = null;
  let notificationHideTimer = null;

  const applyInjectedUiThemeAttributes = () => {
    const rootDoc =
      typeof getRootDocument === "function" ? getRootDocument() : document;
    const fabHost = rootDoc.getElementById("udemy-transcript-fab-container");
    if (fabHost) {
      if (cachedPageUiTheme === "system") {
        fabHost.removeAttribute("data-utc-theme");
      } else {
        fabHost.setAttribute("data-utc-theme", cachedPageUiTheme);
      }
    }
    if (notificationEl?.isConnected) {
      if (cachedPageUiTheme === "system") {
        notificationEl.removeAttribute("data-utc-theme");
      } else {
        notificationEl.setAttribute("data-utc-theme", cachedPageUiTheme);
      }
    }
  };

  const loadPageUiThemeFromStorage = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage?.sync) {
        const result = await chrome.storage.sync.get([UI_THEME_STORAGE_KEY]);
        const value = result[UI_THEME_STORAGE_KEY];
        if (value === "light" || value === "dark" || value === "system") {
          return value;
        }
      }
    } catch {
      // ignore
    }
    return "system";
  };

  const showNotification = (message, isError = false) => {
    const rootDoc =
      typeof getRootDocument === "function" ? getRootDocument() : document;
    if (notificationHideTimer) {
      clearTimeout(notificationHideTimer);
    }
    if (!notificationEl || notificationEl.ownerDocument !== rootDoc) {
      notificationEl = rootDoc.createElement("div");
      notificationEl.id = "udemy-transcript-notification";
      notificationEl.className = "udemy-transcript-notification";
      notificationEl.setAttribute("aria-atomic", "true");
      rootDoc.body.appendChild(notificationEl);
      applyInjectedUiThemeAttributes();
    }
    notificationEl.setAttribute("role", isError ? "alert" : "status");
    notificationEl.setAttribute("aria-live", isError ? "assertive" : "polite");
    notificationEl.className = `udemy-transcript-notification ${isError ? "error" : "success"}`;
    notificationEl.textContent = message;
    notificationEl.classList.add("show");

    notificationHideTimer = setTimeout(() => {
      notificationEl.classList.remove("show");
      notificationHideTimer = null;
    }, 3000);
  };

  const TRANSCRIPT_PANEL_SELECTORS = [
    '[data-purpose="transcript-panel"]',
    '[class*="transcript-panel"]',
    '[class*="sidebar--transcript"]',
    '[class*="transcript--transcript-panel"]',
  ];

  const getTranscriptPanel = () => {
    for (const sel of TRANSCRIPT_PANEL_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) {
        return el;
      }
    }
    return null;
  };

  const extractTranscript = () => {
    const transcriptPanel = getTranscriptPanel();
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
    } catch {
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
  const handleTranscriptTabClick = () => {
    // Small delay to ensure transcript panel starts loading
    setTimeout(() => {
      copyTranscript();
    }, 100);
  };

  // Root document (main frame) — video and notification live here; sidebar may be in iframe
  const getRootDocument = () =>
    window !== window.top ? window.top.document : document;

  // Find the main lecture video (in main frame; sidebar can be in iframe)
  const getLectureVideo = () => {
    const doc = getRootDocument();
    const video = doc.querySelector("video");
    return video || null;
  };

  // Seek video to end and trigger 'ended' so Udemy marks lecture complete
  const seekVideoToEnd = () => {
    const video = getLectureVideo();
    const duration = video?.duration;
    if (!video) {
      showNotification("No video found on this page.", true);
      return false;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      showNotification(
        "Video not loaded yet. Wait a moment and try again.",
        true,
      );
      return false;
    }
    video.currentTime = duration - 0.1;
    video.onseeked = () => {
      video.currentTime = duration;
      video.onseeked = () => {
        video.onseeked = null;
        video.dispatchEvent(new Event("ended", {bubbles: true}));
      };
    };
    return true;
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

      const transcriptPanel = getTranscriptPanel();
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

  // Create and inject FAB buttons (only in main frame so one set of FABs)
  const createFAB = () => {
    if (window !== window.top) {
      return;
    }
    const rootDoc = getRootDocument();
    const existingContainer = rootDoc.getElementById(
      "udemy-transcript-fab-container",
    );
    if (existingContainer) {
      existingContainer.remove();
    }

    const fabContainer = rootDoc.createElement("div");
    fabContainer.id = "udemy-transcript-fab-container";
    fabContainer.className = "udemy-transcript-fab-container";
    fabContainer.setAttribute("role", "region");
    fabContainer.setAttribute("aria-label", "UdePrompt");

    const seekFab = rootDoc.createElement("button");
    seekFab.type = "button";
    seekFab.id = "udemy-transcript-seek-fab";
    seekFab.className = "udemy-transcript-seek-fab";
    seekFab.setAttribute("aria-label", "Seek lecture video to end");
    seekFab.title = "Seek lecture video to end";
    seekFab.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M4 18V6l8.5 6L4 18zm9 0V6l8.5 6L13 18z" fill="currentColor"/>
      </svg>
    `;
    seekFab.addEventListener("click", () => {
      seekVideoToEnd();
    });

    const fab = rootDoc.createElement("button");
    fab.type = "button";
    fab.id = "udemy-transcript-fab";
    fab.className = "udemy-transcript-fab";
    fab.setAttribute(
      "aria-label",
      "Open transcript panel if needed and copy lecture transcript",
    );
    fab.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
      </svg>
    `;
    fab.addEventListener("click", handleFABClick);

    fabContainer.appendChild(seekFab);
    fabContainer.appendChild(fab);
    rootDoc.body.appendChild(fabContainer);
  };

  const init = () => {
    createFAB();

    void (async () => {
      cachedPageUiTheme = await loadPageUiThemeFromStorage();
      applyInjectedUiThemeAttributes();
    })();

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "sync" || !changes[UI_THEME_STORAGE_KEY]) {
          return;
        }
        const next = changes[UI_THEME_STORAGE_KEY].newValue;
        cachedPageUiTheme =
          next === "light" || next === "dark" || next === "system"
            ? next
            : "system";
        applyInjectedUiThemeAttributes();
      });
    }

    setupTranscriptTabListener();

    let observerDebounceTimer = null;
    const debouncedSetup = () => {
      if (observerDebounceTimer) {
        clearTimeout(observerDebounceTimer);
      }
      observerDebounceTimer = setTimeout(() => {
        observerDebounceTimer = null;
        setupTranscriptTabListener();
      }, 200);
    };

    const observer = new MutationObserver(debouncedSetup);
    observer.observe(document.body, {childList: true, subtree: true});

    let tabFoundCount = 0;
    let checksLeft = 30;
    const checkInterval = setInterval(() => {
      const tab = findTranscriptTab();
      if (tab) {
        setupTranscriptTabListener();
        tabFoundCount++;
        if (tabFoundCount >= 2) {
          clearInterval(checkInterval);
        }
      }
      checksLeft--;
      if (checksLeft <= 0) {
        clearInterval(checkInterval);
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
