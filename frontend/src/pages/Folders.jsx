import React, { memo, useCallback } from 'react';
import { FolderPlus, Trash2 } from 'lucide-react';

export const Folders = memo(function Folders({ sources }) {
  const addSource = useCallback(async () => {
    const path = await window.api?.selectDirectory();
    if (path) window.api?.addSource(path);
  }, []);

  const removeSource = useCallback(async (path) => {
    const confirm = await window.api?.confirmDelete(`Are you sure you want to remove the source folder:\n${path}?`);
    if (confirm) window.api?.removeSource(path);
  }, []);

  return (
    <div>
      <h1 className="section-title">Source Folders</h1>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Folders to Monitor</h2>
          <button className="btn btn-primary" onClick={addSource}>
            <FolderPlus size={16} /> Add Folder
          </button>
        </div>
        
        {sources.length === 0 ? (
          <p>No source folders added. The app has nowhere to look for files.</p>
        ) : (
          sources.map((source) => (
            <div key={source} className="list-item">
              <span className="text-truncate" title={source} style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1, marginRight: '16px' }}>{source}</span>
              <button className="btn btn-outline btn-icon" onClick={() => removeSource(source)} style={{ flexShrink: 0 }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
