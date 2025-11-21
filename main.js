// main.js
const { app, BrowserWindow, screen, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow = null;
let settingsWindow = null;

// Path to HenryAppBar.exe
const appBarExecutable = path.join(__dirname, "HenryAppBar.exe");

// Current bar settings
let currentSettings = {
  position: "top", // "top" | "bottom" | "left" | "right"
  barSize: 80,     // height (top/bottom) or width (left/right)
};

function getWindowHandleString() {
  if (!mainWindow) return null;
  const buf = mainWindow.getNativeWindowHandle();
  if (!buf) return null;

  // On 64-bit Windows, it's an 8-byte pointer
  try {
    if (buf.length === 8) {
      const value = buf.readBigUInt64LE(0);
      return value.toString(10);
    }
    // Fallback 32-bit
    const value32 = buf.readUInt32LE(0);
    return String(value32);
  } catch (e) {
    console.error("Failed to read HWND from buffer:", e);
    return null;
  }
}

/**
 * Ask HenryAppBar.exe to register/update the main window as an AppBar
 * and move the window into the reserved strip.
 */
function applyAppBar() {
  if (!mainWindow) return;

  if (process.platform !== "win32") {
    // Non-Windows: just stick it at the top
    positionWindowFallback();
    return;
  }

  const hwndStr = getWindowHandleString();
  if (!hwndStr) {
    positionWindowFallback();
    return;
  }

  const args = [
    "set",
    currentSettings.position,
    String(currentSettings.barSize),
    hwndStr,
  ];

  const child = spawn(appBarExecutable, args);

  let stdout = "";
  child.stdout.on("data", (data) => {
    stdout += data.toString();
  });

  child.on("close", () => {
    const trimmed = stdout.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length === 4) {
      const [x, y, w, h] = parts.map((n) => parseInt(n, 10));
      if (
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Number.isFinite(w) &&
        Number.isFinite(h)
      ) {
        mainWindow.setBounds({ x, y, width: w, height: h });
        return;
      }
    }
    // If anything went wrong, fall back
    positionWindowFallback();
  });

  child.on("error", (err) => {
    console.error("HenryAppBar.exe error:", err);
    positionWindowFallback();
  });
}

function removeAppBar() {
  if (process.platform !== "win32") return;
  const hwndStr = getWindowHandleString();
  if (!hwndStr) return;
  const child = spawn(appBarExecutable, ["remove", hwndStr]);
  child.on("error", () => {});
}

/**
 * Fallback positioning if AppBar helper isn't available.
 */
function positionWindowFallback() {
  if (!mainWindow) return;
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.bounds;
  const pos = currentSettings.position;
  const size = currentSettings.barSize;

  let bounds;
  if (pos === "top") {
    bounds = { x, y, width, height: size };
  } else if (pos === "bottom") {
    bounds = { x, y: y + height - size, width, height: size };
  } else if (pos === "left") {
    bounds = { x, y, width: size, height };
  } else if (pos === "right") {
    bounds = { x: x + width - size, y, width: size, height };
  } else {
    bounds = { x, y, width, height: size };
  }
  mainWindow.setBounds(bounds);
}

/**
 * Create Henry’s main ticker window.
 */
function createMainWindow() {
  const display = screen.getPrimaryDisplay();
  const { x, y, width } = display.bounds;

  const iconPath = path.join(__dirname, "assets", "henry-the-highland.png");

  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height: currentSettings.barSize,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    icon: iconPath,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.once("ready-to-show", () => {
    applyAppBar();
  });
}

/**
 * Settings popup window.
 */
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: true,
    minimizable: true,
    maximizable: true,
    title: "Henry's Ticker Settings",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile("settings.html");

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

/**
 * App lifecycle
 */
app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("before-quit", () => {
  removeAppBar();
});

/**
 * IPC wiring
 */

// Open settings window from renderer
ipcMain.on("open-settings", () => createSettingsWindow());

// React to settings saved from settings.html
ipcMain.on("save-settings", (event, settings) => {
  // Live update for renderer side
  if (mainWindow) {
    mainWindow.webContents.send("settings-updated", settings);
  }

  // Update our stored edge / size
  if (settings) {
    if (settings.position) {
      currentSettings.position = settings.position;
    }
    if (settings.barSize != null) {
      const parsed = parseInt(settings.barSize, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed < 2000) {
        currentSettings.barSize = parsed;
      }
    }
  }

  applyAppBar();
});
