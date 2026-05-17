const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { app } = require('electron');

class Store {
  constructor(opts) {
    const userDataPath = app.getPath('userData');
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = parseDataFile(this.path, opts.defaults);
    this.saveTimeout = null;
  }
  
  get(key) {
    return this.data[key];
  }
  
  set(key, val) {
    this.data[key] = val;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        const tmpPath = this.path + '.tmp';
        fs.writeFileSync(tmpPath, JSON.stringify(this.data));
        fs.renameSync(tmpPath, this.path);
      } catch (err) {
        console.error('Failed to save store:', err);
      }
      this.saveTimeout = null;
    }, 100);
  }

  getAll() {
    return this.data;
  }

  flush() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    try {
      const tmpPath = this.path + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(this.data));
      fs.renameSync(tmpPath, this.path);
    } catch (err) {
      console.error('Failed to flush store:', err);
    }
  }
}

function parseDataFile(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(error) {
    return defaults;
  }
}

module.exports = Store;
