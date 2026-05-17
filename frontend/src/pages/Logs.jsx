import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { RotateCcw } from 'lucide-react';
import { ContextMenu } from '../components/ContextMenu';

export const Logs = memo(function Logs({ logs }) {
  const [contextMenu, setContextMenu] = useState(null);
  
  // Only display logs related to file movements
  const movementLogs = useMemo(() => logs.filter(log => log.moveData), [logs]);
  const reversedLogs = useMemo(() => movementLogs.slice().reverse(), [movementLogs]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const undoLastMove = useCallback(() => {
    window.api?.undoMove();
  }, []);

  const handleContextMenu = useCallback((e, log) => {
    if (!log.moveData) return;
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      logId: log.id
    });
  }, []);

  const undoSpecificMove = useCallback((logId) => {
    window.api?.undoSpecificMove(logId);
    setContextMenu(null);
  }, []);

  const moveToAnother = useCallback((logId) => {
    window.api?.moveToAnother(logId);
    setContextMenu(null);
  }, []);

  const deleteThisFile = useCallback((logId) => {
    window.api?.deleteThisFile(logId);
    setContextMenu(null);
  }, []);

  return (
    <div>
      <h1 className="section-title">Activity & Logs</h1>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Recent Activity</h2>
          <button className="btn btn-outline" onClick={undoLastMove}>
            <RotateCcw size={16} /> Undo Last Move
          </button>
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {reversedLogs.length === 0 ? (
            <p>No activity recorded yet.</p>
          ) : (
            reversedLogs.map((log, idx) => (
              <div 
                key={log.id || idx} 
                className="log-item"
                onContextMenu={(e) => handleContextMenu(e, log)}
                style={{ cursor: log.moveData ? 'context-menu' : 'default' }}
              >
                <div className="log-time">{new Date(log.timestamp).toLocaleString()}</div>
                <strong>{log.action}</strong>
                {log.details && <div className="text-truncate" title={log.details} style={{ fontSize: '13px', marginTop: '4px' }}>{log.details}</div>}
              </div>
            ))
          )}
        </div>
      </div>
      
      <ContextMenu 
        x={contextMenu?.x} 
        y={contextMenu?.y} 
        items={
          contextMenu ? [
            { label: 'Undo this move', onClick: () => undoSpecificMove(contextMenu.logId) },
            { label: 'Move to another destination', onClick: () => moveToAnother(contextMenu.logId) },
            { label: 'Delete this file', onClick: () => deleteThisFile(contextMenu.logId) }
          ] : null
        }
      />
    </div>
  );
});
