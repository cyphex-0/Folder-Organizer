import React, { memo, useCallback } from 'react';
import { Play, Square } from 'lucide-react';

export const Dashboard = memo(function Dashboard({ isMonitoring, rules, defaultDest, sources = [], startMinimized }) {
  const toggleMonitoring = useCallback(() => {
    window.api?.toggleMonitoring();
  }, []);

  const toggleStartMinimized = useCallback(() => {
    window.api?.toggleStartMinimized();
  }, []);

  return (
    <div>
      <h1 className="section-title">Dashboard</h1>
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">Monitoring Status</h2>
            <div className={`status-badge ${isMonitoring ? 'status-on' : 'status-off'}`}>
              <div className="status-dot"></div>
              {isMonitoring ? 'ON' : 'OFF'}
            </div>
          </div>
          <button 
            className={`btn ${isMonitoring ? 'btn-danger' : 'btn-primary'}`}
            onClick={toggleMonitoring}
          >
            {isMonitoring ? <><Square size={16}/> Pause Monitoring</> : <><Play size={16}/> Start Monitoring</>}
          </button>
        </div>
        
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="startMinimized" 
            checked={startMinimized} 
            onChange={toggleStartMinimized} 
            style={{ cursor: 'pointer' }}
          />
          <label htmlFor="startMinimized" style={{ fontSize: '14px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Start Minimized in System Tray (When PC boots)
          </label>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Watched Source Folders</h2>
        <div className="table-layout">
          {sources.length === 0 && <p className="text-secondary">No source folders watched.</p>}
          {sources.map((source) => (
            <div key={source} className="list-item" style={{ marginBottom: 0 }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{source}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Destination Summary</h2>
        <div className="table-layout">
          {rules.length === 0 && <p className="text-secondary">No rules defined.</p>}
          {rules.map((rule) => (
            <div key={rule.extension} className="list-item" style={{ marginBottom: 0 }}>
              <strong>{rule.extension}</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rule.destination}</span>
            </div>
          ))}
          {defaultDest && (
            <div className="list-item" style={{ marginBottom: 0, borderStyle: 'dashed' }}>
              <strong>All others</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{defaultDest}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
