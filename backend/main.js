const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

const Store = require('./core/store');
const FolderMonitor = require('./core/monitor');
const setupIpcHandlers = require('./ipc/ipcHandlers');

let mainWindow = null;
let tray = null;
let store = null;
let monitor = null;
let isQuitting = false;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    store = new Store({
      configName: 'user-preferences',
      defaults: {
        sources: [],
        rules: [],
        defaultDest: '',
        isMonitoring: false,
        logs: [],
        moveHistory: [],
        autoStart: true,
        startMinimized: false,
        customPresets: [],
        presetsMigrated: false
      }
    });

    if (!store.get('presetsMigrated')) {
      const current = store.get('customPresets') || [];
      const defaults = [
        { name: 'Images', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'] },
        { name: 'Videos', extensions: ['.mp4', '.mkv', '.avi', '.mov', '.wmv'] },
        { name: 'Documents', extensions: ['.pdf', '.txt', '.rtf', '.csv'] },
        { name: 'Office', extensions: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'] },
        { name: 'Audio', extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg'] },
        { name: 'Archives', extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'] }
      ];
      const merged = [...defaults];
      current.forEach(cp => {
        if (!merged.find(m => m.name.toLowerCase() === cp.name.toLowerCase())) {
          merged.push(cp);
        }
      });
      store.set('customPresets', merged);
      store.set('presetsMigrated', true);
    }

    const autoStart = store.get('autoStart');
    const startMinimized = store.get('startMinimized');
    app.setLoginItemSettings({
      openAtLogin: autoStart,
      path: app.getPath('exe'),
      args: startMinimized ? ['--hidden'] : []
    });

    monitor = new FolderMonitor(store, () => {});

    createWindow();
    createTray();

    setupIpcHandlers(mainWindow, store, monitor);

    if (store.get('isMonitoring')) {
      monitor.start();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    show: false,
    icon: path.join(__dirname, '../frontend/assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const url = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(url);

  mainWindow.on('ready-to-show', () => {
    const isHidden = app.commandLine.hasSwitch('hidden') || 
                     (app.getLoginItemSettings && app.getLoginItemSettings().wasOpenedAsHidden);
    if (!isHidden) {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const { nativeImage } = require('electron');
  const iconPath = path.join(__dirname, '../frontend/assets/icon.png');
  
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {

    icon = nativeImage.createEmpty();
  }
  
  tray = new Tray(icon);
  tray.setToolTip('Folder Organizer');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App', click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Quit', click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  if (monitor) {
    monitor.stop();
  }
  if (store) {
    store.flush();
  }
});

app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
