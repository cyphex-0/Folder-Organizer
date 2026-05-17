const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs').promises;

class FolderMonitor {
  constructor(store, notifyUI) {
    this.store = store;
    this.notifyUI = notifyUI;
    this.watcher = null;
    this.isMonitoring = false;
    this.processingFiles = new Set();
    this.knownDirectories = new Set();
    this.queue = [];
    this.queuedFiles = new Set();
    this.ignoredPaths = new Set();
    this.isProcessingQueue = false;
  }

  async start() {
    if (this.isMonitoring) return true;
    
    const sources = this.store.get('sources');
    if (!sources || sources.length === 0) {
      this.logActivity('System', 'Cannot start monitoring: No source folders defined.');
      return false;
    }

    this.isMonitoring = true;
    this.store.set('isMonitoring', true);
    this.notifyUI();

    this.watcher = chokidar.watch(sources, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: false,
      depth: 0,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.watcher.on('add', (filePath) => {
      this.enqueueFile(filePath);
    });

    this.logActivity('System', 'Started monitoring source folders.');
    return true;
  }

  enqueueFile(filePath) {
    if (!this.queuedFiles.has(filePath) && !this.processingFiles.has(filePath)) {
      this.queuedFiles.add(filePath);
      this.queue.push(filePath);
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      // Process in batches of 5
      const batch = this.queue.splice(0, 5);
      batch.forEach(p => this.queuedFiles.delete(p));
      await Promise.allSettled(batch.map(filePath => this.processFile(filePath)));
    }

    this.isProcessingQueue = false;
  }

  async stop() {
    if (!this.isMonitoring) return;
    
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    
    this.isMonitoring = false;
    this.store.set('isMonitoring', false);
    this.notifyUI();
    this.logActivity('System', 'Stopped monitoring source folders.');
  }

  async waitForFileUnlock(filePath, maxRetries = 120, delayMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const fh = await fs.open(filePath, 'r+');
        await fh.close();
        return true;
      } catch (err) {
        if (err.code === 'EBUSY' || err.code === 'EPERM') {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else if (err.code === 'ENOENT') {
          return false;
        } else {
          throw err;
        }
      }
    }
    throw new Error(`File remained locked after ${maxRetries * delayMs}ms`);
  }

  async safeMove(source, dest) {
    try {
      await fs.rename(source, dest);
    } catch (err) {
      if (err.code === 'EXDEV') {
        const partPath = dest + '.part';
        try {
          await fs.copyFile(source, partPath);
          await fs.rename(partPath, dest);
          await fs.unlink(source);
        } catch (copyErr) {
          try { await fs.unlink(partPath); } catch (e) {}
          throw copyErr;
        }
      } else {
        throw err;
      }
    }
  }

  async processFile(filePath) {
    if (this.ignoredPaths.has(filePath)) return;
    if (this.processingFiles.has(filePath)) return;
    this.processingFiles.add(filePath);

    try {
      const isFree = await this.waitForFileUnlock(filePath);
      if (!isFree) {
        this.processingFiles.delete(filePath);
        return;
      }

      const parsedPath = path.parse(filePath);
      const ext = parsedPath.ext.toLowerCase();
      
      const currentRules = this.store.get('rules');
      if (this._cachedRulesRef !== currentRules) {
        this._cachedRulesRef = currentRules;
        this._normalizedRules = (currentRules || []).map(r => {
          let ruleExt = r.extension.toLowerCase();
          if (ruleExt[0] !== '.') ruleExt = '.' + ruleExt;
          return { ext: ruleExt, dest: r.destination };
        });
      }
      
      const defaultDest = this.store.get('defaultDest');
      
      let targetFolder = null;

      for (const rule of this._normalizedRules) {
        if (rule.ext === ext) {
          targetFolder = rule.dest;
          break;
        }
      }

      if (!targetFolder && defaultDest) {
        targetFolder = defaultDest;
      }

      if (targetFolder) {
        const absSourceDir = path.dirname(path.resolve(filePath));
        const absTargetDir = path.resolve(targetFolder);

        if (absSourceDir !== absTargetDir) {
          const destPath = path.join(targetFolder, parsedPath.base);

          let finalDestPath = destPath;
          let counter = 1;
          while (true) {
            try {
              const fd = await fs.open(finalDestPath, 'wx');
              await fd.close();
              break;
            } catch(e) {
              if (e.code === 'EEXIST') {
                finalDestPath = path.join(targetFolder, `${parsedPath.name}_copy(${counter})${parsedPath.ext}`);
                counter++;
              } else {
                break;
              }
            }
          }

          if (!this.knownDirectories.has(targetFolder)) {
            await fs.mkdir(targetFolder, { recursive: true });
            this.knownDirectories.add(targetFolder);
          }

          try {
            await this.safeMove(filePath, finalDestPath);
          } catch (e) {
            if (e.code === 'ENOENT') {
              await fs.mkdir(targetFolder, { recursive: true });
              this.knownDirectories.add(targetFolder);
              await this.safeMove(filePath, finalDestPath);
            } else {
              throw e;
            }
          }
          this.logActivity('File Moved', `Moved ${parsedPath.base} to ${targetFolder}`, { from: filePath, to: finalDestPath });
        } else {
          // File is already in target folder (infinite loop prevention)
        }
      } else {
        this.logActivity('Ignored', `No rule or default destination for ${parsedPath.base}`);
      }
    } catch (err) {
      console.error('Error processing file:', err);
      this.logActivity('Error', `Failed to move file: ${err.message}`);
    } finally {
      this.processingFiles.delete(filePath);
    }
  }

  async undoLastMove() {
    let logs = this.store.get('logs') || [];
    
    let lastMoveIndex = -1;
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].moveData) {
        lastMoveIndex = i;
        break;
      }
    }

    if (lastMoveIndex === -1) {
      this.logActivity('System', 'No moves to undo.');
      return;
    }

    const lastMoveLog = logs[lastMoveIndex];
    logs.splice(lastMoveIndex, 1);
    this.store.set('logs', logs);

    try {
      await fs.access(lastMoveLog.moveData.to);
    } catch (e) {
      this.logActivity('Error', `Cannot undo: File no longer exists at ${path.basename(lastMoveLog.moveData.to)}`);
      return;
    }

    try {
      await fs.mkdir(path.dirname(lastMoveLog.moveData.from), { recursive: true });
      this.ignoredPaths.add(lastMoveLog.moveData.from);
      setTimeout(() => this.ignoredPaths.delete(lastMoveLog.moveData.from), 5000);
      await this.safeMove(lastMoveLog.moveData.to, lastMoveLog.moveData.from);
      this.logActivity('Undo', `Reverted move of ${path.basename(lastMoveLog.moveData.to)}`);
    } catch (err) {
      console.error('Undo failed:', err);
      this.logActivity('Error', `Failed to undo move: ${err.message}`);
    }
  }

  async undoSpecificMove(logId) {
    let logs = this.store.get('logs') || [];
    const logIndex = logs.findIndex(l => l.id === logId);
    
    if (logIndex === -1 || !logs[logIndex].moveData) {
      this.logActivity('Error', 'Move data not found for targeted undo.');
      return;
    }

    const logEntry = logs[logIndex];
    logs.splice(logIndex, 1);
    this.store.set('logs', logs);

    try {
      await fs.access(logEntry.moveData.to);
    } catch (e) {
      this.logActivity('Error', `Cannot undo: File no longer exists at ${path.basename(logEntry.moveData.to)}`);
      return;
    }

    try {
      await fs.mkdir(path.dirname(logEntry.moveData.from), { recursive: true });
      this.ignoredPaths.add(logEntry.moveData.from);
      setTimeout(() => this.ignoredPaths.delete(logEntry.moveData.from), 5000);
      await this.safeMove(logEntry.moveData.to, logEntry.moveData.from);
      this.logActivity('Undo', `Reverted specific move of ${path.basename(logEntry.moveData.to)}`);
    } catch (err) {
      console.error('Specific undo failed:', err);
      this.logActivity('Error', `Failed to undo specific move: ${err.message}`);
    }
  }

  async moveToAnother(logId, newDestFolder) {
    let logs = this.store.get('logs') || [];
    const logIndex = logs.findIndex(l => l.id === logId);
    
    if (logIndex === -1 || !logs[logIndex].moveData) {
      this.logActivity('Error', 'Move data not found for targeted move.');
      return;
    }

    const logEntry = logs[logIndex];
    const currentPath = logEntry.moveData.to;
    const parsedPath = path.parse(currentPath);
    
    const absCurrentDir = path.dirname(path.resolve(currentPath));
    const absTargetDir = path.resolve(newDestFolder);
    
    if (absCurrentDir === absTargetDir) {
      return;
    }

    let finalDestPath = path.join(newDestFolder, parsedPath.base);
    let counter = 1;
    while (true) {
      try {
        await fs.access(finalDestPath);
        finalDestPath = path.join(newDestFolder, `${parsedPath.name}_copy(${counter})${parsedPath.ext}`);
        counter++;
      } catch(e) {
        break;
      }
    }

    try {
      if (!this.knownDirectories.has(newDestFolder)) {
        await fs.mkdir(newDestFolder, { recursive: true });
        this.knownDirectories.add(newDestFolder);
      }

      try {
        await this.safeMove(currentPath, finalDestPath);
      } catch (e) {
        if (e.code === 'ENOENT') {
          await fs.mkdir(newDestFolder, { recursive: true });
          this.knownDirectories.add(newDestFolder);
          await this.safeMove(currentPath, finalDestPath);
        } else {
          throw e;
        }
      }
      
      logEntry.moveData.to = finalDestPath;
      this.store.set('logs', logs);

      this.logActivity('File Moved', `Moved ${parsedPath.base} to ${newDestFolder}`, { from: currentPath, to: finalDestPath });
    } catch (err) {
      console.error('Move to another failed:', err);
      this.logActivity('Error', `Failed to move file to another destination: ${err.message}`);
    }
  }

  async deleteThisFile(logId) {
    let logs = this.store.get('logs') || [];
    const logIndex = logs.findIndex(l => l.id === logId);
    
    if (logIndex === -1 || !logs[logIndex].moveData) {
      this.logActivity('Error', 'Move data not found for deletion.');
      return;
    }

    const logEntry = logs[logIndex];
    const currentPath = logEntry.moveData.to;

    try {
      await fs.unlink(currentPath);
      
      logs.splice(logIndex, 1);
      this.store.set('logs', logs);

      this.logActivity('Deleted', `Deleted file ${path.basename(currentPath)}`);
    } catch (err) {
      console.error('Delete failed:', err);
      if (err.code === 'ENOENT') {
         logs.splice(logIndex, 1);
         this.store.set('logs', logs);
         this.logActivity('Error', `File already missing: ${path.basename(currentPath)}`);
      } else {
         this.logActivity('Error', `Failed to delete file: ${err.message}`);
      }
    }
  }

  logActivity(action, details, moveData = null) {
    const logs = this.store.get('logs') || [];
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    logs.push({ id, action, details, moveData, timestamp: Date.now() });

    if (logs.length > 100) logs.shift();
    
    this.store.set('logs', logs);
    this.notifyUI();
  }
}

module.exports = FolderMonitor;
