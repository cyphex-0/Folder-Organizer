import React, { useState, memo, useEffect, useCallback } from 'react';
import { FilePlus, Trash2, FolderPlus } from 'lucide-react';
import { ContextMenu } from '../components/ContextMenu';

export const Rules = memo(function Rules({ rules, defaultDest, customPresets }) {
  const [newExt, setNewExt] = useState('');
  const [presetName, setPresetName] = useState('');
  const [presetExts, setPresetExts] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [editingPresetOriginalName, setEditingPresetOriginalName] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  const selectDefaultDest = async () => {
    const path = await window.api?.selectDirectory();
    if (path) window.api?.setDefaultDest(path);
  };

  const addRule = async (extension) => {
    if (!extension.trim()) return;
    const dest = await window.api?.selectDirectory();
    if (dest) window.api?.addRule({ extension: extension.trim(), destination: dest });
  };

  const removeRule = async (extension) => {
    const confirm = await window.api?.confirmDelete(`Are you sure you want to remove the rule for ${extension}?`);
    if (confirm) window.api?.removeRule(extension);
  };

  const applyCustomPreset = async (preset) => {
    const dest = await window.api?.selectDirectory();
    if (dest) {
      const rulesToAdd = preset.extensions.map(ext => ({ extension: ext, destination: dest }));
      window.api?.addRulesBatch(rulesToAdd);
    }
  };

  const addCustomPresetToBackend = async () => {
    const name = presetName.trim();
    const exts = presetExts.trim();
    if (name && exts) {
      const extArray = exts.split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0)
        .map(e => e.startsWith('.') ? e : '.' + e);
        
      if (extArray.length > 0) {
        if (editingPresetOriginalName && editingPresetOriginalName.toLowerCase() !== name.toLowerCase()) {
          await window.api?.removeCustomPreset(editingPresetOriginalName);
        }
        await window.api?.addCustomPreset({ name, extensions: extArray });
        setPresetName('');
        setPresetExts('');
        setEditingPresetOriginalName(null);
      }
    }
  };

  const removeCustomPreset = async (name) => {
    const confirm = await window.api?.confirmDelete(`Are you sure you want to delete the custom preset "${name}"?`);
    if (confirm) window.api?.removeCustomPreset(name);
  };

  const handlePresetContextMenu = useCallback((e, preset) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      preset
    });
  }, []);

  const modifyPreset = useCallback((preset) => {
    setPresetName(preset.name);
    setPresetExts(preset.extensions.join(', '));
    setEditingPresetOriginalName(preset.name);
    setContextMenu(null);
  }, []);

  const removeDefaultDest = async () => {
    const confirm = await window.api?.confirmDelete("Are you sure you want to clear the default fallback destination?");
    if (confirm) window.api?.setDefaultDest('');
  };

  return (
    <div>
      <h1 className="section-title">Rules & Destinations</h1>
      
      <div className="card">
        <h2 className="card-title">Default Fallback</h2>
        <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Where should files go if they don't match any rules below?
        </p>
        <div className="input-group">
          <input 
            type="text" 
            readOnly 
            value={defaultDest} 
            className="input-field" 
            placeholder="No default destination set"
          />
          <button className="btn btn-outline" onClick={selectDefaultDest}>
            <FolderPlus size={16} /> Browse
          </button>
          {defaultDest && (
            <button className="btn btn-outline btn-icon" onClick={removeDefaultDest}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Add Rule</h2>
        <div className="input-group">
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. .pdf"
            value={newExt}
            onChange={(e) => setNewExt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addRule(newExt);
                setNewExt('');
              }
            }}
          />
          <button className="btn btn-primary" onClick={() => {
            addRule(newExt);
            setNewExt('');
          }}>
            <FilePlus size={16} /> Select Destination
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Add Multiple (Presets)</h2>
        <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          Quickly route common file types to a folder. Right-click to modify or delete.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {customPresets.map((preset) => (
            <button 
              key={preset.name}
              className="btn btn-outline" 
              onClick={() => applyCustomPreset(preset)}
              onContextMenu={(e) => handlePresetContextMenu(e, preset)}
            >
              {preset.name}
            </button>
          ))}
        </div>
        
        <h3 className="card-title" style={{ fontSize: '14px', marginTop: '16px' }}>
          {editingPresetOriginalName ? 'Modify Preset' : 'Create Custom Preset'}
        </h3>
        <div className="input-group">
          <input 
            type="text" 
            className="input-field" 
            placeholder="Preset Name" 
            style={{ maxWidth: '120px' }} 
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
          <input 
            type="text" 
            className="input-field" 
            placeholder="e.g. .js, .jsx, .ts" 
            value={presetExts}
            onChange={(e) => setPresetExts(e.target.value)}
          />
          <button className="btn btn-primary" onClick={addCustomPresetToBackend}>
            <FilePlus size={16} /> Save
          </button>
          {editingPresetOriginalName && (
            <button className="btn btn-outline" onClick={() => {
              setPresetName('');
              setPresetExts('');
              setEditingPresetOriginalName(null);
            }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Active Rules</h2>
        {rules.length === 0 ? (
          <p>No rules set.</p>
        ) : (
          rules.map((rule) => (
            <div key={rule.extension} className="list-item">
              <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
                <strong>{rule.extension}</strong>
                <div className="text-truncate" title={rule.destination} style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Routes to: {rule.destination}
                </div>
              </div>
              <button className="btn btn-outline btn-icon" onClick={() => removeRule(rule.extension)} style={{ flexShrink: 0 }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
      
      <ContextMenu 
        x={contextMenu?.x} 
        y={contextMenu?.y} 
        items={
          contextMenu ? [
            { label: 'Modify Preset', onClick: () => modifyPreset(contextMenu.preset) },
            { label: 'Delete Preset', onClick: () => {
                removeCustomPreset(contextMenu.preset.name);
                setContextMenu(null);
              }
            }
          ] : null
        }
      />
    </div>
  );
});
