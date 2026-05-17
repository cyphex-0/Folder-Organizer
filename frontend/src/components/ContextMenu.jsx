import React from 'react';

export function ContextMenu({ x, y, items }) {
  if (x === undefined || y === undefined || !items) return null;

  return (
    <div 
      className="context-menu" 
      style={{ top: y, left: x }}
    >
      {items.map((item, idx) => (
        <div 
          key={idx}
          className="context-menu-item" 
          onClick={item.onClick}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
