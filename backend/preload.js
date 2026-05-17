const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {

  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  getState: () => ipcRenderer.invoke('get-state'),
  onStateChange: (callback) => {
    const handler = (event, state) => callback(state);
    ipcRenderer.on('state-change', handler);
    return () => ipcRenderer.removeListener('state-change', handler);
  },

  toggleMonitoring: () => ipcRenderer.invoke('toggle-monitoring'),
  toggleStartMinimized: () => ipcRenderer.invoke('toggle-start-minimized'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  addSource: (path) => ipcRenderer.invoke('add-source', path),
  removeSource: (path) => ipcRenderer.invoke('remove-source', path),
  setDefaultDest: (path) => ipcRenderer.invoke('set-default-dest', path),
  addRule: (rule) => ipcRenderer.invoke('add-rule', rule),
  addRulesBatch: (rules) => ipcRenderer.invoke('add-rules-batch', rules),
  removeRule: (extension) => ipcRenderer.invoke('remove-rule', extension),

  addCustomPreset: (preset) => ipcRenderer.invoke('add-custom-preset', preset),
  removeCustomPreset: (presetName) => ipcRenderer.invoke('remove-custom-preset', presetName),
  confirmDelete: (message) => ipcRenderer.invoke('confirm-delete', message),

  undoMove: () => ipcRenderer.invoke('undo-move'),
  undoSpecificMove: (logId) => ipcRenderer.invoke('undo-specific-move', logId),
  moveToAnother: (logId) => ipcRenderer.invoke('move-to-another', logId),
  deleteThisFile: (logId) => ipcRenderer.invoke('delete-this-file', logId)
});
