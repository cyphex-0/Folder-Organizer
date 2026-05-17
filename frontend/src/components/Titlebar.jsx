import React, { memo } from 'react';
import { Menu } from 'lucide-react';

export const Titlebar = memo(function Titlebar({ toggleSidebar }) {
  const handleMinimize = () => window.api?.minimize();
  const handleMaximize = () => window.api?.maximize();
  const handleClose = () => window.api?.close();

  return (
    <div className="titlebar">
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {toggleSidebar && (
          <button 
            className="titlebar-btn" 
            onClick={toggleSidebar}
            style={{ WebkitAppRegion: 'no-drag', color: 'var(--text-secondary)' }}
            title="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>
        )}
        <div className="titlebar-title" style={{ paddingLeft: toggleSidebar ? '8px' : '12px' }}>Folder Organizer</div>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={handleMinimize}>—</button>
        <button className="titlebar-btn" onClick={handleMaximize}>◻</button>
        <button className="titlebar-btn close" onClick={handleClose}>✕</button>
      </div>
    </div>
  );
});
