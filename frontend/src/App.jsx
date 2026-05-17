import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Titlebar } from './components/Titlebar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Folders } from './pages/Folders';
import { Rules } from './pages/Rules';
import { Logs } from './pages/Logs';
import { useAppState } from './hooks/useAppState';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const appState = useAppState();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 800);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 800);
  const isMobileRef = useRef(isMobile);

  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth < 800;
        if (mobile !== isMobileRef.current) {
          setIsMobile(mobile);
          setIsSidebarOpen(!mobile);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  return (
    <>
      <Titlebar toggleSidebar={toggleSidebar} />
      <div className="app-container" style={{ position: 'relative' }}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          closeSidebar={() => isMobile && setIsSidebarOpen(false)}
        />
        
        {isMobile && isSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
        )}

        <div className="main-content">
          {activeTab === 'dashboard' && (
            <Dashboard 
              isMonitoring={appState.isMonitoring} 
              rules={appState.rules} 
              defaultDest={appState.defaultDest} 
              sources={appState.sources}
              startMinimized={appState.startMinimized}
            />
          )}

          {activeTab === 'folders' && (
            <Folders sources={appState.sources} />
          )}

          {activeTab === 'rules' && (
            <Rules 
              rules={appState.rules} 
              defaultDest={appState.defaultDest} 
              customPresets={appState.customPresets} 
            />
          )}

          {activeTab === 'logs' && (
            <Logs logs={appState.logs} />
          )}
        </div>
      </div>
    </>
  );
}

export default App;
