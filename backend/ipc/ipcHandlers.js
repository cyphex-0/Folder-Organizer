const { ipcMain, dialog } = require('electron');

function setupIpcHandlers(mainWindow, store, monitor) {
  
  let notifyTimeout;
  const notifyUI = () => {
    if (notifyTimeout) clearTimeout(notifyTimeout);
    notifyTimeout = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('state-change', store.getAll());
      }
    }, 100);
  };

  monitor.notifyUI = notifyUI;

  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('get-state', () => {
    return store.getAll();
  });

  ipcMain.handle('toggle-monitoring', async () => {
    const currentState = store.get('isMonitoring');
    if (currentState) {
      await monitor.stop();
    } else {
      const started = await monitor.start();
      if (!started) {
        const { dialog } = require('electron');
        dialog.showErrorBox('Cannot Start Monitoring', 'Please add at least one source folder before starting the monitor.');
      }
    }
    return store.get('isMonitoring');
  });

  ipcMain.handle('toggle-start-minimized', () => {
    const currentState = store.get('startMinimized');
    store.set('startMinimized', !currentState);
    
    const { app } = require('electron');
    const autoStart = store.get('autoStart');
    app.setLoginItemSettings({
      openAtLogin: autoStart,
      path: app.getPath('exe'),
      args: !currentState ? ['--hidden'] : []
    });
    
    notifyUI();
    return store.get('startMinimized');
  });

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('add-source', (event, path) => {
    const sources = [...(store.get('sources') || [])];
    if (!sources.includes(path)) {
      sources.push(path);
      store.set('sources', sources);
      monitor.logActivity('Settings', `Added source folder: ${path}`);

      if (store.get('isMonitoring')) {
        monitor.stop().then(() => monitor.start());
      }
    }
  });

  ipcMain.handle('remove-source', (event, path) => {
    let sources = store.get('sources') || [];
    sources = sources.filter(s => s !== path);
    store.set('sources', sources);
    monitor.logActivity('Settings', `Removed source folder: ${path}`);
    
    if (store.get('isMonitoring')) {
      monitor.stop().then(() => monitor.start());
    }
  });

  ipcMain.handle('set-default-dest', (event, path) => {
    store.set('defaultDest', path);
    monitor.logActivity('Settings', `Set default destination: ${path}`);
  });

  ipcMain.handle('add-rule', (event, rule) => {
    let sanitizedExt = rule.extension.trim().replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    if (!sanitizedExt.startsWith('.')) sanitizedExt = '.' + sanitizedExt;
    if (sanitizedExt === '.') return;

    const rules = [...(store.get('rules') || [])];
    const existingIdx = rules.findIndex(r => r.extension.toLowerCase() === sanitizedExt);
    if (existingIdx >= 0) {
      rules[existingIdx] = { extension: sanitizedExt, destination: rule.destination };
    } else {
      rules.push({ extension: sanitizedExt, destination: rule.destination });
    }
    store.set('rules', rules);
    monitor.logActivity('Rule Added', `Mapped ${sanitizedExt} to ${rule.destination}`);
  });

  ipcMain.handle('add-rules-batch', (event, newRules) => {
    const rules = [...(store.get('rules') || [])];
    let addedCount = 0;
    
    newRules.forEach(rule => {
      let sanitizedExt = rule.extension.trim().replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
      if (!sanitizedExt.startsWith('.')) sanitizedExt = '.' + sanitizedExt;
      if (sanitizedExt === '.') return;
      
      const existingIdx = rules.findIndex(r => r.extension.toLowerCase() === sanitizedExt);
      if (existingIdx >= 0) {
        rules[existingIdx] = { extension: sanitizedExt, destination: rule.destination };
      } else {
        rules.push({ extension: sanitizedExt, destination: rule.destination });
      }
      addedCount++;
    });
    
    if (addedCount > 0) {
      store.set('rules', rules);
      monitor.logActivity('Rules Added', `Added ${addedCount} rules in batch`);
    }
  });

  ipcMain.handle('remove-rule', (event, extension) => {
    let rules = store.get('rules') || [];
    rules = rules.filter(r => r.extension.toLowerCase() !== extension.toLowerCase());
    store.set('rules', rules);
    monitor.logActivity('Rule Removed', `Removed rule for ${extension}`);
  });

  ipcMain.handle('add-custom-preset', (event, preset) => {
    let sanitizedName = preset.name.trim().replace(/[^\w\s-]/gi, '');
    if (!sanitizedName) return;

    let sanitizedExtensions = preset.extensions.map(ext => {
      let clean = ext.trim().replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
      return clean.startsWith('.') ? clean : '.' + clean;
    }).filter(e => e !== '.');

    if (sanitizedExtensions.length === 0) return;

    const sanitizedPreset = { name: sanitizedName, extensions: sanitizedExtensions };
    const presets = [...(store.get('customPresets') || [])];
    const existingIdx = presets.findIndex(p => p.name.toLowerCase() === sanitizedName.toLowerCase());
    if (existingIdx >= 0) {
      presets[existingIdx] = sanitizedPreset;
    } else {
      presets.push(sanitizedPreset);
    }
    store.set('customPresets', presets);
    notifyUI();
  });

  ipcMain.handle('remove-custom-preset', (event, presetName) => {
    let presets = store.get('customPresets') || [];
    presets = presets.filter(p => p.name !== presetName);
    store.set('customPresets', presets);
    notifyUI();
  });

  ipcMain.handle('confirm-delete', async (event, message) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      title: 'Confirm Deletion',
      message: message,
      cancelId: 1
    });
    return result.response === 0; // true if 'Yes' clicked
  });

  ipcMain.handle('undo-move', async () => {
    await monitor.undoLastMove();
  });

  ipcMain.handle('undo-specific-move', async (event, logId) => {
    await monitor.undoSpecificMove(logId);
  });

  ipcMain.handle('move-to-another', async (event, logId) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Destination Folder'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      await monitor.moveToAnother(logId, result.filePaths[0]);
    }
  });

  ipcMain.handle('delete-this-file', async (event, logId) => {
    const logs = store.get('logs') || [];
    const logEntry = logs.find(l => l.id === logId);
    if (!logEntry || !logEntry.moveData) return;

    const path = require('path');
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Yes', 'No'],
      defaultId: 1,
      title: 'Confirm Deletion',
      message: `Are you sure you want to permanently delete ${path.basename(logEntry.moveData.to)}?`,
      cancelId: 1
    });

    if (result.response === 0) {
      await monitor.deleteThisFile(logId);
    }
  });
}

module.exports = setupIpcHandlers;
