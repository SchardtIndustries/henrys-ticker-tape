const { app, BrowserWindow, screen } = require("electron");
const path = require("path");

function createWindow() {
  // Get info about the primary display
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width } = primaryDisplay.bounds; 
  // `bounds` = full monitor area

  const win = new BrowserWindow({
    x,                // left edge of that monitor
    y,                // top edge of that monitor
    width,            // full width of that monitor
    height: 80,       // ticker strip height – tweak as you like
    frame: false,     // no window chrome
    alwaysOnTop: true,
    resizable: false,
    transparent: false, // set true later if you want see-through
    skipTaskbar: false, // set true if you don't want a taskbar button
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");

  // For debugging:
  // win.webContents.openDevTools({ mode: "detach" });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
