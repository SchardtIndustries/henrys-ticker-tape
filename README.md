# Henry's Ticker

Henry's Ticker is a lightweight, Windows-native ticker bar that attaches seamlessly to the top of the desktop as a true Windows AppBar. Built with Electron + a custom Win32 helper, Henry provides a persistent, always-visible strip for quick information display without interfering with normal window workflows.

## 🚀 Features

- **Real Windows AppBar** — Henry registers itself as an actual system AppBar, so maximized windows automatically resize between Henry and the taskbar.
- **Electron-Powered UI** — All visuals are built with HTML, CSS, and JavaScript.
- **Standalone Executable** — Built using electron-builder. Includes both an installer and a portable exe.
- **Custom Icon Support** — Fully branded taskbar/start-menu icon via `build/icon.ico`.
- **Settings Window** — Easily adjust bar size and position.
- **No Native Node Dependencies** — Uses a lightweight C++ app for interacting with the Windows AppBar API.

## 🛠 Technology Stack

- **Electron 39**
- **Node.js 18**
- **C++ Win32 (AppBar integration)**
- **electron-builder**
- **MinGW64** for compiling helper executable

## 📁 Project Structure

```bash
ticker-tape-todo/
│
├── main.js                # Electron main process
├── preload.js             # Preload script
├── index.html             # Main UI layout
├── settings.html          # Settings panel
├── HenryAppBar.cpp        # Win32 helper for AppBar registration
├── HenryAppBar.exe        # Compiled AppBar helper
├── build/
│   └── icon.ico           # Application icon
├── dist/
│   ├── win-unpacked/      # Unpacked export
│   ├── Henry's Ticker Setup x.y.z.exe
│   └── Henry's Ticker x.y.z.exe
└── package.json
```

## 🔧 Building Henry

### 1. Install dependencies

```bash
npm install
```

### 2. Compile the Windows AppBar helper (MinGW64)

```bash
g++ -municode HenryAppBar.cpp -o HenryAppBar.exe -lole32 -lshell32 -lgdi32
```

### 3. Package Henry (Node 18 required)

```bash
nvm use 18.20.5
npm run dist
```

This creates:

- Installer → `dist/Henry's Ticker Setup 1.0.0.exe`  
- Portable EXE → `dist/Henry's Ticker 1.0.0.exe`  
- Unpacked → `dist/win-unpacked/`

## 📥 Installation Options

### **Installer**

Run:

```bash
Henry's Ticker Setup 1.0.0.exe
```

Adds Henry to Start menu + creates proper shortcuts.

### **Portable**

Run:

```bash
Henry's Ticker 1.0.0.exe
```

No install needed.

## 🧪 Running in Development

```bash
npm start
```

This launches Henry directly via Electron.

## 📝 License

MIT License © 2025 Matt Schardt
