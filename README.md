# Udemy Transcript Copier

A Chrome extension that automatically extracts and copies transcript text from Udemy video lectures with customizable templates.

## Features

- **Floating Action Button (FAB)**: Click the purple FAB button to automatically open the transcript sidebar and copy the transcript
- **Template System**: Customize the format of copied text using templates with `{{ transcript }}` placeholder
- **Extension Popup**: Click the extension icon to edit your template in a convenient popup
- **Settings Panel**: Access settings directly from the page with a gear icon button
- **Smart Detection**: Automatically detects if transcript sidebar is already open to avoid unnecessary clicks
- **Auto-copy on Tab Click**: Automatically copies transcript when you click the Transcript tab
- **Dynamic Class Handling**: Works with Udemy's dynamic class names that change on reload
- **Success/Error Notifications**: Visual feedback for all operations

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the folder containing the extension files
6. The extension is now installed and active

## Usage

### Method 1: Using the Floating Action Button (FAB)

1. Navigate to any Udemy course lecture page (e.g., `*.udemy.com/course/*/learn/lecture/*`)
2. Click the purple circular FAB button in the bottom-right corner
3. The extension will:
   - Open the transcript sidebar (if not already open)
   - Wait for the transcript to load
   - Extract and format the transcript using your template
   - Copy it to your clipboard
4. A notification will appear confirming the copy operation
5. Paste the transcript anywhere using Ctrl+V (Cmd+V on Mac)

### Method 2: Clicking the Transcript Tab

1. Navigate to any Udemy course lecture page
2. Click on the "Transcript" tab button
3. The extension will automatically extract and copy the transcript text to your clipboard
4. A notification will appear confirming the copy operation

### Editing Your Template

#### Via Extension Popup (Recommended)

1. Click the extension icon in your browser toolbar
2. Edit the template in the textarea
3. Use `{{ transcript }}` as a placeholder for the actual transcript text
4. Click "Save" to save your template
5. Click "Reset to Default" to restore the default template

#### Via Settings Panel on Page

1. Click the gray gear icon button below the FAB
2. Edit the template in the modal dialog
3. Click "Save" to save your changes

### Default Template

The default template includes:

```
Analyze this video and provide insights.

Transcript: {{ transcript }}

Please provide:
1. Executive Summary
2. Key Points & Takeaways
3. Notable Quotes
4. Actionable Insights

Format as clear, structured content.
Result in Vietnamese and English.
```

You can customize this to any format you prefer. The `{{ transcript }}` placeholder will be replaced with the actual transcript text when copying.

## How It Works

- **FAB Button**: When clicked, finds and clicks the transcript toggle button (`data-purpose="transcript-toggle"`) to open the sidebar
- **Smart Detection**: Checks if the transcript sidebar is already open using `aria-expanded` attribute and DOM visibility
- **Template System**: Uses `chrome.storage.local` to sync templates between popup and content script
- **Transcript Extraction**:
  - Finds the transcript panel using stable selectors (data attributes and partial class matching)
  - Extracts text from transcript cue containers using flexible selectors
  - Handles dynamic class names that change on reload
- **Formatting**: Replaces `{{ transcript }}` placeholder with actual transcript text
- **Copy**: Uses the Clipboard API to copy formatted text to clipboard

## Permissions

- `activeTab`: Required to access the current Udemy tab
- `clipboardWrite`: Required to copy text to clipboard
- `storage`: Required to save and sync template settings between popup and content script

## Troubleshooting

- **Transcript not found**:
  - Make sure the transcript panel is fully loaded
  - Try clicking the FAB button again
  - Ensure you're on a lecture page with transcripts available
- **Copy failed**:
  - Check that clipboard permissions are granted
  - Try refreshing the page
- **Template not saving**:
  - Check browser console for errors
  - Try saving again via the extension popup
- **FAB button not appearing**:
  - Refresh the page
  - Make sure you're on a Udemy course page
  - Check that the extension is enabled in `chrome://extensions/`

## Files

- `manifest.json`: Extension configuration and permissions
- `content.js`: Main script that handles FAB, transcript extraction, and template formatting
- `popup.html`: Extension popup UI for template editing
- `popup.js`: Popup script for template management
- `styles.css`: Styling for notifications, FAB, settings panel, and hover effects
- `README.md`: This file

## Notes

- Templates are saved in `chrome.storage.local` and sync between the popup and content script
- The extension handles dynamic page structures where button IDs and class names change on reload
- Transcript extraction includes retry logic for asynchronous content loading
- The FAB button appears on all Udemy pages but only functions on lecture pages with transcripts
- Hover over the Transcript tab to see a purple highlight indicating the extension is active
