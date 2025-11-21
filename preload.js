// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // From ticker window: open settings
  openSettings: () => ipcRenderer.send("open-settings"),

  // From settings window: save settings (and notify ticker)
  saveSettings: (settings) => ipcRenderer.send("save-settings", settings),

  // In ticker window: listen for updates from settings
  onSettingsUpdated: (callback) => {
    ipcRenderer.on("settings-updated", (_event, settings) => callback(settings));
  },
});
