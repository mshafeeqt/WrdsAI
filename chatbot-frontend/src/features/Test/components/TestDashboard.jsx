import React from 'react';
import '../styles/testStyles.css';

const TestDashboard = ({ title, subtitle, items, onSelectItem, isSmall = false }) => {
  return (
    <div className="test-dashboard" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      maxHeight: 'calc(100vh - 160px)', // Account for header/footer
      overflow: 'hidden'
    }}>
      <header style={{ marginBottom: isSmall ? '1.5rem' : '3rem', flexShrink: 0 }}>
        <h1 style={{ fontSize: isSmall ? '1.8rem' : '2.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {title}
        </h1>
        <p style={{ color: 'var(--test-text-muted)', fontSize: '1.1rem' }}>
          {subtitle}
        </p>
      </header>

      <div className="subject-grid-wrapper" style={{ 
        flex: 1, 
        overflowY: 'auto',
        paddingRight: '0.5rem', // Space for scrollbar
        paddingBottom: '2rem',
        paddingTop: '12px' // Allow space for translateY(-8px) hover effect
      }}>
        <div className="subject-grid" style={{ 
          gridTemplateColumns: isSmall ? 'repeat(auto-fill, minmax(180px, 1fr))' : undefined,
          gap: isSmall ? '0.8rem' : undefined,
          marginTop: 0,
          paddingTop: '4px'
        }}>
          {items.map((item) => (
            <div 
              key={item.id} 
              className="test-glass-card subject-card"
              style={{ 
                padding: isSmall ? '1rem 0.8rem' : undefined,
                minHeight: isSmall ? '80px' : '120px'
              }}
              onClick={() => onSelectItem(item)}
            >
              {item.icon && <span className="subject-icon">{item.icon}</span>}
              <h3 style={{ 
                fontSize: isSmall ? '0.95rem' : (item.icon ? '1.4rem' : '2.5rem'), 
                fontWeight: 600, 
                margin: 0,
                lineHeight: 1.2
              }}>
                {item.name}
              </h3>
              {item.description && (
                <p style={{ color: 'var(--test-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;
