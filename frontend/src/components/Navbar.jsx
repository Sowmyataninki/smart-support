import { Shield, User, BookOpen, BarChart3, Sun, Moon } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, openTicketsCount, theme, setTheme, user, setAuthView, setUser }) {
  return (
    <header className="header">
      <div className="logo-section">
        <div className="logo-icon">SS</div>
        <div>
          <h1 className="logo-text">SmartSupport</h1>
        </div>
      </div>
      
      <nav className="nav-links">
        <button 
          className={`nav-item ${currentView === 'agent' ? 'active' : ''}`}
          onClick={() => setCurrentView('agent')}
        >
          <Shield size={18} />
          Agent Dashboard
          {openTicketsCount > 0 && <span className="nav-badge">{openTicketsCount}</span>}
        </button>
        
        <button 
          className={`nav-item ${currentView === 'customer' ? 'active' : ''}`}
          onClick={() => setCurrentView('customer')}
        >
          <User size={18} />
          Customer Portal
        </button>
        
        <button 
          className={`nav-item ${currentView === 'kb' ? 'active' : ''}`}
          onClick={() => setCurrentView('kb')}
        >
          <BookOpen size={18} />
          Knowledge Base
        </button>
        
        <button 
          className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`}
          onClick={() => setCurrentView('analytics')}
        >
          <BarChart3 size={18} />
          Analytics Hub
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="btn btn-secondary"
          style={{ 
            padding: '0', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            border: '1px solid var(--border-color)',
            background: 'var(--btn-secondary-bg)',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'all 0.2s',
            marginRight: '0.5rem'
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</span>
        </div>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={() => {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            setAuthView('login');
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
