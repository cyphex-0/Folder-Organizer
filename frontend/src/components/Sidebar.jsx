import React, { memo } from 'react';
import { Activity, Folder, ListTree, ShieldCheck } from 'lucide-react';

export const Sidebar = memo(function Sidebar({ activeTab, setActiveTab, isOpen, isMobile, closeSidebar }) {
  const handleNav = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      closeSidebar();
    }
  };

  const sidebarClass = `sidebar ${!isOpen ? 'closed' : ''} ${isMobile ? 'mobile' : ''}`;

  return (
    <div className={sidebarClass}>
      <div 
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} 
        onClick={() => handleNav('dashboard')}
        title={!isOpen && !isMobile ? "Dashboard" : undefined}
      >
        <Activity size={18} style={{ flexShrink: 0 }} /> <span>Dashboard</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'folders' ? 'active' : ''}`} 
        onClick={() => handleNav('folders')}
        title={!isOpen && !isMobile ? "Folders" : undefined}
      >
        <Folder size={18} style={{ flexShrink: 0 }} /> <span>Folders</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`} 
        onClick={() => handleNav('rules')}
        title={!isOpen && !isMobile ? "Rules" : undefined}
      >
        <ListTree size={18} style={{ flexShrink: 0 }} /> <span>Rules</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} 
        onClick={() => handleNav('logs')}
        title={!isOpen && !isMobile ? "Activity & Logs" : undefined}
      >
        <ShieldCheck size={18} style={{ flexShrink: 0 }} /> <span>Activity & Logs</span>
      </div>
    </div>
  );
});
