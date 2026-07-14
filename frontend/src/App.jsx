import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Send,
  BookOpen,
  BarChart3,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
  FileText,
  Plus,
  Smile,
  Meh,
  Frown,
  Flame,
  Copy,
  FolderSync,
  Sun,
  Moon,
  Mic,
  MicOff,
  Globe,
  Trash2
} from 'lucide-react';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function App() {
  // User Authentication State
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [authView, setAuthView] = useState('login');

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Navigation State: 'agent' | 'customer' | 'kb' | 'analytics'
  const [currentView, setCurrentView] = useState('agent');

  // Data States
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [kbArticles, setKbArticles] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Loading & Error States
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [apiError, setApiError] = useState(null);

  // AI Suggestions Cache State
  const [suggestions, setSuggestions] = useState(null);

  // Interactive Composer / Form States
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSubmitSuccess, setTicketSubmitSuccess] = useState(false);

  const [newArticleTitle, setNewArticleTitle] = useState('');
  const [newArticleCategory, setNewArticleCategory] = useState('Technical');
  const [newArticleContent, setNewArticleContent] = useState('');
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);
  const [articleSubmitSuccess, setArticleSubmitSuccess] = useState(false);

  const [resolvedNotes, setResolvedNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);

  const [isListening, setIsListening] = useState(false);

  const toggleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice-to-Text transcription is not supported in this browser. Please try Google Chrome or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNewTicketDesc(prev => prev ? `${prev} ${transcript}` : transcript);
      setTicketSubmitSuccess(false);
    };

    recognition.start();
  };

  // Filter States
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // 1. Fetch tickets from backend
  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    setApiError(null);
    try {
      const response = await fetch(`${API_BASE}/tickets`);
      if (!response.ok) throw new Error('Could not retrieve tickets.');
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
      setApiError('Backend connection error. Make sure your local Express server is running on port 5000.');
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  // 2. Fetch Knowledge Base articles
  const fetchArticles = useCallback(async () => {
    setIsLoadingArticles(true);
    try {
      const response = await fetch(`${API_BASE}/articles`);
      if (!response.ok) throw new Error('Could not retrieve KB articles.');
      const data = await response.json();
      setKbArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingArticles(false);
    }
  }, []);

  // 3. Fetch analytics metrics
  const fetchAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await fetch(`${API_BASE}/analytics`);
      if (!response.ok) throw new Error('Could not retrieve analytics data.');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTickets();
    fetchArticles();
    fetchAnalytics();
  }, [fetchTickets, fetchArticles, fetchAnalytics]);

  // Periodic polling for fresh tickets (e.g. every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets();
      if (currentView === 'analytics') {
        fetchAnalytics();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchTickets, fetchAnalytics, currentView]);

  // Load ticket details and suggestions when activeTicketId changes
  useEffect(() => {
    if (!activeTicketId) {
      setActiveTicket(null);
      setSuggestions(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/tickets/${activeTicketId}`);
        if (!res.ok) throw new Error('Failed to fetch ticket details.');
        const details = await res.json();
        setActiveTicket(details);

        // Auto fetch AI suggestions if active in Agent view
        if (currentView === 'agent') {
          setIsLoadingSuggestions(true);
          try {
            const sugRes = await fetch(`${API_BASE}/tickets/${activeTicketId}/suggestions`);
            if (sugRes.ok) {
              const sugData = await sugRes.json();
              setSuggestions(sugData);
              // Prepopulate summary if ticket does not have it yet
              if (details && !details.summary && sugData.summary) {
                setActiveTicket(prev => prev ? { ...prev, summary: sugData.summary } : null);
              }
            }
          } catch (sugErr) {
            console.error('Suggestions error:', sugErr);
          } finally {
            setIsLoadingSuggestions(false);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchDetails();
  }, [activeTicketId, currentView]);

  // Submit new ticket (Customer portal)
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketTitle || !newTicketDesc) return;
    setIsSubmittingTicket(true);
    setTicketSubmitSuccess(false);
    try {
      const response = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTicketTitle, description: newTicketDesc })
      });
      if (response.ok) {
        const ticket = await response.json();
        setNewTicketTitle('');
        setNewTicketDesc('');
        setTicketSubmitSuccess(true);
        // Refresh ticket list
        await fetchTickets();
        // Set this new ticket as active to see its progress
        setActiveTicketId(ticket._id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Send message in ticket thread
  const handleSendMessage = async (sender) => {
    if (!replyText.trim() || !activeTicketId) return;
    setIsSendingReply(true);
    try {
      const response = await fetch(`${API_BASE}/tickets/${activeTicketId}/message`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, text: replyText })
      });
      if (response.ok) {
        const updatedTicket = await response.json();
        setActiveTicket(updatedTicket);
        setReplyText('');
        // Refresh full ticket lists
        fetchTickets();

        // Re-fetch RAG suggestions since message history changed
        if (currentView === 'agent') {
          setIsLoadingSuggestions(true);
          const sugRes = await fetch(`${API_BASE}/tickets/${activeTicketId}/suggestions`);
          if (sugRes.ok) {
            const sugData = await sugRes.json();
            setSuggestions(sugData);
          }
          setIsLoadingSuggestions(false);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Resolve Ticket
  const handleResolveTicket = async () => {
    if (!activeTicketId) return;
    setIsSubmittingResolve(true);
    try {
      const response = await fetch(`${API_BASE}/tickets/${activeTicketId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedNotes })
      });
      if (response.ok) {
        const updatedTicket = await response.json();
        setActiveTicket(updatedTicket);
        setResolvedNotes('');
        setIsResolving(false);
        // Refresh list
        fetchTickets();
        fetchAnalytics();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  // Add KB Article
  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newArticleTitle || !newArticleContent || !newArticleCategory) return;
    setIsSubmittingArticle(true);
    setArticleSubmitSuccess(false);
    try {
      const response = await fetch(`${API_BASE}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newArticleTitle,
          content: newArticleContent,
          category: newArticleCategory
        })
      });
      if (response.ok) {
        setNewArticleTitle('');
        setNewArticleContent('');
        setArticleSubmitSuccess(true);
        // Refresh articles list
        fetchArticles();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  // Delete KB Article
  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ article?')) return;
    try {
      const response = await fetch(`${API_BASE}/articles/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchArticles();
      } else {
        alert('Failed to delete article.');
      }
    } catch (error) {
      console.error(error);
      alert('Error occurred while deleting article.');
    }
  };

  // Filtered tickets selector
  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(filterSearch.toLowerCase()) ||
        ticket.description.toLowerCase().includes(filterSearch.toLowerCase());

      const matchesStatus = filterStatus ? ticket.status === filterStatus : true;
      const matchesPriority = filterPriority ? ticket.priority === filterPriority : true;
      const matchesCategory = filterCategory ? ticket.category === filterCategory : true;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  };

  // Help badge styling classes mapper
  const getPriorityBadgeClass = (priority) => {
    if (priority === 'High') return 'tag-priority-high';
    if (priority === 'Medium') return 'tag-priority-medium';
    return 'tag-priority-low';
  };

  const getSentimentBadgeClass = (sentiment) => {
    if (sentiment === 'Angry') return 'tag-sentiment-angry';
    if (sentiment === 'Negative') return 'tag-sentiment-negative';
    if (sentiment === 'Positive') return 'tag-sentiment-positive';
    return 'tag-sentiment-neutral';
  };

  const getCategoryBadgeClass = (category) => {
    if (category === 'Billing') return 'tag-category-billing';
    if (category === 'Technical') return 'tag-category-technical';
    return 'tag-category-feature';
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Open') return 'status-badge status-open';
    if (status === 'In Progress') return 'status-badge status-inprogress';
    return 'status-badge status-resolved';
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'Angry': return <Flame className="w-4 h-4 text-white inline" />;
      case 'Negative': return <Frown className="w-4 h-4 text-white inline" />;
      case 'Positive': return <Smile className="w-4 h-4 text-white inline" />;
      default: return <Meh className="w-4 h-4 text-white inline" />;
    }
  };

  const openTicketsCount = tickets.filter(t => t.status === 'Open').length;

  if (!user) {
    if (authView === 'register') {
      return (
        <Register
          onRegisterSuccess={(userData) => setUser(userData)}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onLoginSuccess={(userData) => setUser(userData)}
        onSwitchToRegister={() => setAuthView('register')}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Universal Premium Navigation Header */}
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
            onClick={() => { setCurrentView('agent'); setActiveTicketId(null); }}
          >
            <Shield size={18} />
            Agent Dashboard
            {openTicketsCount > 0 && <span className="nav-badge">{openTicketsCount}</span>}
          </button>

          <button
            className={`nav-item ${currentView === 'customer' ? 'active' : ''}`}
            onClick={() => { setCurrentView('customer'); setActiveTicketId(null); }}
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
            onClick={() => { setCurrentView('analytics'); fetchAnalytics(); }}
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

      {/* Main Responsive Body */}
      <main className="main-content">

        {/* API Error Notification */}
        {apiError && (
          <div className="glass-card" style={{ borderColor: 'var(--accent-rose)', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <AlertCircle size={32} className="text-rose-500" style={{ color: 'var(--accent-rose)' }} />
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.2rem' }}>Connection Alert</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{apiError}</p>
            </div>
            <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => { fetchTickets(); fetchArticles(); }}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* 1. AGENT DASHBOARD VIEW */}
        {currentView === 'agent' && (
          <div className="dashboard-layout">

            {/* Sidebar Ticket List Panel */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: 'calc(100vh - 180px)', overflow: 'hidden' }}>
              <div className="flex-row-between">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '700' }}>Active Tickets</h3>
                <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={fetchTickets} disabled={isLoadingTickets}>
                  <RefreshCw size={14} className={isLoadingTickets ? 'spin' : ''} />
                </button>
              </div>

              {/* Filters Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', fontSize: '0.85rem', paddingRight: '0.8rem' }}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                  <select
                    className="form-select"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">Status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <select
                    className="form-select"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                  >
                    <option value="">Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <select
                    className="form-select"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">Category</option>
                    <option value="Billing">Billing</option>
                    <option value="Technical">Technical</option>
                    <option value="Feature Request">Feature</option>
                  </select>
                </div>
              </div>

              {/* Tickets Map List */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '4px' }}>
                {isLoadingTickets && tickets.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <div className="spinner"></div>
                  </div>
                ) : getFilteredTickets().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No tickets found matching filters.
                  </div>
                ) : (
                  getFilteredTickets().map((t) => (
                    <div
                      key={t._id}
                      className={`glass-card ${activeTicketId === t._id ? 'active-ticket-card' : ''}`}
                      style={{
                        padding: '0.9rem',
                        cursor: 'pointer',
                        borderRadius: '10px',
                        borderLeft: activeTicketId === t._id ? '4px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                        background: activeTicketId === t._id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)'
                      }}
                      onClick={() => {
                        setActiveTicketId(t._id);
                        setIsResolving(false);
                      }}
                    >
                      <div className="flex-row-between" style={{ marginBottom: '0.4rem' }}>
                        <span className={getStatusBadgeClass(t.status)} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                          {t.status}
                        </span>
                        <span className={`tag ${getPriorityBadgeClass(t.priority)}`} style={{ fontSize: '0.65rem', padding: '1px 4px' }}>
                          {t.priority}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.title}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                        {t.description}
                      </p>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className={`tag ${getCategoryBadgeClass(t.category)}`} style={{ fontSize: '0.65rem', padding: '1px 4px' }}>
                          {t.category}
                        </span>
                        <span className={`tag ${getSentimentBadgeClass(t.sentiment)}`} style={{ fontSize: '0.65rem', padding: '1px 4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {getSentimentIcon(t.sentiment)}
                          {t.sentiment}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Interactive Solver Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
              {activeTicket ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

                  {/* Left Column: Thread & Handoff Summary */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                      {/* Solver Ticket Header */}
                      <div className="flex-row-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                            <span className={getStatusBadgeClass(activeTicket.status)}>{activeTicket.status}</span>
                            <span className={`tag ${getPriorityBadgeClass(activeTicket.priority)}`}>{activeTicket.priority} Priority</span>
                            <span className={`tag ${getCategoryBadgeClass(activeTicket.category)}`}>{activeTicket.category}</span>
                            <span className={`tag ${getSentimentBadgeClass(activeTicket.sentiment)}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {getSentimentIcon(activeTicket.sentiment)}
                              {activeTicket.sentiment} Customer
                            </span>
                            {activeTicket.language && activeTicket.language.toLowerCase() !== 'english' && (
                              <span className="tag" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Globe size={12} /> {activeTicket.language}
                              </span>
                            )}
                          </div>
                          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '700' }}>{activeTicket.title}</h2>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket ID: {activeTicket._id}</span>
                        </div>

                        {activeTicket.status !== 'Resolved' && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                            onClick={() => setIsResolving(!isResolving)}
                          >
                            <CheckCircle size={16} /> Resolve Ticket
                          </button>
                        )}
                      </div>

                      {/* Modal or Box for Ticket Resolution Details */}
                      {isResolving && (
                        <div className="solver-suggestion-box" style={{ borderColor: 'var(--accent-mint)', background: 'rgba(16, 185, 129, 0.02)' }}>
                          <h4 style={{ color: '#34D399' }}><CheckCircle size={16} /> Close & Index Ticket</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                            Document your resolution notes. This will generate an embedding so other agents can search it semantically if similar issues occur.
                          </p>
                          <div className="form-group">
                            <textarea
                              placeholder="Describe how this issue was resolved..."
                              className="form-textarea"
                              style={{ minHeight: '80px' }}
                              value={resolvedNotes}
                              onChange={(e) => setResolvedNotes(e.target.value)}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn-success"
                              onClick={handleResolveTicket}
                              disabled={isSubmittingResolve || !resolvedNotes.trim()}
                            >
                              {isSubmittingResolve ? 'Saving...' : 'Submit Resolution'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setIsResolving(false)}>Cancel</button>
                          </div>
                        </div>
                      )}

                      {/* Handoff / Shift Summary Notes */}
                      {activeTicket.summary && (
                        <div className="solver-suggestion-box" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            <Sparkles size={14} className="text-indigo-400" style={{ color: 'var(--accent-indigo)' }} />
                            AI Handoff & Shift Notes
                          </h4>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                            {activeTicket.summary}
                          </div>
                        </div>
                      )}

                      {/* Auto-Close Suggestion Banner */}
                      {activeTicket.suggestAutoClose && activeTicket.status !== 'Resolved' && (
                        <div className="solver-suggestion-box" style={{ borderColor: 'var(--accent-mint)', background: 'rgba(16, 185, 129, 0.04)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                          <h4 style={{ color: 'var(--accent-mint)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                            <CheckCircle size={16} /> AI Suggestion: Auto-Close Recommended
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            This ticket appears to be a thank you or feedback message without any active issues. You can resolve it immediately.
                          </p>
                          <div>
                            <button
                              className="btn btn-success"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', height: 'auto' }}
                              onClick={() => {
                                setResolvedNotes('AI Auto-Closed (Appreciation/Thank you note).');
                                setIsResolving(true);
                              }}
                            >
                              Apply Auto-Close
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Thread Messages */}
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                          Conversation Thread
                        </h4>
                        <div className="chat-thread">
                          {activeTicket.messages?.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`chat-bubble ${msg.sender === 'customer'
                                ? 'bubble-customer'
                                : msg.sender === 'agent'
                                  ? 'bubble-agent'
                                  : 'bubble-ai'
                                }`}
                            >
                              <div style={{ fontSize: '0.75rem', fontWeight: '700', opacity: 0.8, marginBottom: '0.2rem' }}>
                                {msg.sender.toUpperCase()}
                              </div>
                              <div style={{ whiteSpace: 'pre-line' }}>
                                {msg.text}
                                {msg.sender === 'customer' && idx === 0 && activeTicket.englishDescription && activeTicket.language?.toLowerCase() !== 'english' && (
                                  <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px dashed rgba(255,255,255,0.12)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <em style={{ fontSize: '0.75rem', display: 'block', color: 'var(--accent-cyan)', marginBottom: '0.2rem', fontWeight: '600' }}>English Translation:</em>
                                    {activeTicket.englishDescription}
                                  </div>
                                )}
                              </div>
                              <div className="bubble-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Reply Textarea Composer */}
                        {activeTicket.status !== 'Resolved' ? (
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <textarea
                              placeholder="Write a reply or apply the AI drafted response..."
                              className="form-textarea"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Press Send to reply to user. Status will set to In Progress.
                              </span>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 1.25rem' }}
                                onClick={() => handleSendMessage('agent')}
                                disabled={isSendingReply || !replyText.trim()}
                              >
                                <Send size={14} /> {isSendingReply ? 'Sending...' : 'Send Reply'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="solver-suggestion-box" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                            <h4 style={{ color: '#34D399', fontSize: '0.95rem' }}><CheckCircle size={14} /> Resolved</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              This ticket was marked as resolved. Notes left: <strong>{activeTicket.resolvedNotes || 'No notes left.'}</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: AI Suggestion Solver (RAG & Semantic) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                      <div className="flex-row-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Sparkles className="text-purple-400" size={18} style={{ color: 'var(--accent-purple)' }} />
                          AI Solver Suite
                        </h3>
                        {isLoadingSuggestions && <div className="spinner" style={{ width: '16px', height: '16px' }}></div>}
                      </div>

                      {isLoadingSuggestions ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                          Retrieving Knowledge Base & Drafting response...
                        </div>
                      ) : suggestions ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                          {/* 1. AI DRAFT REPLY */}
                          {suggestions.draftReply && (
                            <div className="solver-suggestion-box" style={{ background: 'rgba(139, 92, 246, 0.03)', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
                              <div className="flex-row-between" style={{ marginBottom: '0.5rem' }}>
                                <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-purple)' }}>
                                  <Sparkles size={14} /> Drafted Response
                                </h4>
                                {activeTicket.status !== 'Resolved' && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', display: 'flex', gap: '2px', alignItems: 'center' }}
                                    onClick={() => {
                                      setReplyText(suggestions.draftReply);
                                    }}
                                  >
                                    <Copy size={12} /> Apply Draft
                                  </button>
                                )}
                              </div>
                              <div style={{
                                background: 'var(--chat-thread-bg)',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                whiteSpace: 'pre-line',
                                maxHeight: '180px',
                                overflowY: 'auto'
                              }}>
                                {suggestions.draftReply}
                              </div>
                            </div>
                          )}

                          {/* 2. SEMANTIC KNOWLEDGE BASE ARTICLES */}
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <BookOpen size={14} /> Relevant Knowledge Base ({suggestions.articles?.length || 0})
                            </h4>
                            {suggestions.articles && suggestions.articles.length > 0 ? (
                              suggestions.articles.map((art, idx) => (
                                <div key={art._id || idx} className="kb-match-card">
                                  <div className="flex-row-between">
                                    <div className="title">{art.title}</div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: '700' }}>
                                      {art.score !== undefined ? `${Math.round(art.score * 100)}% Match` : 'Linked'}
                                    </span>
                                  </div>
                                  <div className="snippet" style={{ marginBottom: '0.4rem' }}>{art.content}</div>
                                  {activeTicket.status !== 'Resolved' && (
                                    <button
                                      className="btn btn-secondary"
                                      style={{ fontSize: '0.7rem', padding: '1px 6px', height: 'auto' }}
                                      onClick={() => {
                                        setReplyText(prev => prev + `\n\nRefer to standard guide: "${art.title}"\n${art.content.substring(0, 100)}...`);
                                      }}
                                    >
                                      Reference in Draft
                                    </button>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No semantically matching articles found.</p>
                            )}
                          </div>

                          {/* 3. SIMILAR ISSUE DETECTION */}
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <FolderSync size={14} /> Historical Resolved Precedent
                            </h4>
                            {suggestions.similarTicket ? (
                              <div className="kb-match-card" style={{ borderColor: 'var(--accent-mint)', background: 'rgba(16, 185, 129, 0.01)' }}>
                                <div className="flex-row-between">
                                  <div className="title" style={{ color: 'var(--accent-mint)' }}>
                                    Resolved: {suggestions.similarTicket.title}
                                  </div>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-mint)', fontWeight: '700' }}>
                                    {suggestions.similarTicket.score !== undefined ? `${Math.round(suggestions.similarTicket.score * 100)}% Match` : 'Similar'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                  <strong>Description:</strong> {suggestions.similarTicket.description}
                                </div>
                                <div style={{
                                  fontSize: '0.8rem',
                                  color: 'var(--text-primary)',
                                  background: 'rgba(0,0,0,0.3)',
                                  padding: '0.5rem',
                                  borderRadius: '6px',
                                  borderLeft: '2px solid var(--accent-mint)'
                                }}>
                                  <strong>Past Solution:</strong> {suggestions.similarTicket.resolvedNotes}
                                </div>
                                {activeTicket.status !== 'Resolved' && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.7rem', padding: '1px 6px', marginTop: '0.5rem' }}
                                    onClick={() => {
                                      setReplyText(prev => prev + `\n\n[Previous Resolution Reference]:\n${suggestions.similarTicket.resolvedNotes}`);
                                    }}
                                  >
                                    Copy Solution Notes
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No similar resolved issues detected in past tickets.</p>
                            )}
                          </div>

                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                          No solver context generated. Try reloading suggestions.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={48} style={{ marginBottom: '1rem', color: 'var(--border-color-glow)' }} />
                  <h3>No Ticket Selected</h3>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>Please select an active ticket from the sidebar to begin triage and RAG resolution.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* 2. CUSTOMER PORTAL VIEW */}
        {currentView === 'customer' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

            {/* Split Screen: Submit form on Left, History on Right */}
            <div className="grid-cols-2">

              {/* Form Submission */}
              <div className="glass-card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '700', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus className="text-indigo-400" size={20} style={{ color: 'var(--accent-indigo)' }} />
                  Submit Support Ticket
                </h3>

                {ticketSubmitSuccess && (
                  <div className="solver-suggestion-box" style={{ borderColor: 'var(--accent-mint)', background: 'rgba(16, 185, 129, 0.05)', marginBottom: '1.2rem' }}>
                    <h4 style={{ color: 'var(--accent-mint)' }}><CheckCircle size={14} /> Ticket Submitted Successfully!</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Our AI engine has triaged and prioritized your ticket. Support agents are reviewing it now.
                    </p>
                  </div>
                )}

                <form onSubmit={handleCreateTicket}>
                  <div className="form-group">
                    <label className="form-label">Issue Summary / Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Charged twice for subscription plan"
                      className="form-input"
                      value={newTicketTitle}
                      onChange={(e) => { setNewTicketTitle(e.target.value); setTicketSubmitSuccess(false); }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ position: 'relative' }}>
                    <label className="form-label">Detailed Description</label>
                    <textarea
                      placeholder="Describe what went wrong in detail so our semantic search can recommend immediate articles..."
                      className="form-textarea"
                      value={newTicketDesc}
                      onChange={(e) => { setNewTicketDesc(e.target.value); setTicketSubmitSuccess(false); }}
                      required
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={toggleListen}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        bottom: '12px',
                        background: isListening ? 'var(--accent-indigo)' : 'transparent',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isListening ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                        boxShadow: isListening ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                      }}
                      title={isListening ? "Listening..." : "Click to speak"}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={isSubmittingTicket || !newTicketTitle.trim() || !newTicketDesc.trim()}
                  >
                    {isSubmittingTicket ? (
                      <>
                        <div className="spinner" style={{ width: '14px', height: '14px' }}></div> Analyzing & Triaging...
                      </>
                    ) : 'Submit to SmartSupport'}
                  </button>
                </form>
              </div>

              {/* Submitted Tickets Tracker */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: '550px', overflowY: 'auto' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare className="text-purple-400" size={20} style={{ color: 'var(--accent-purple)' }} />
                  Your Support History
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tickets.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                      You have not submitted any support tickets yet.
                    </p>
                  ) : (
                    tickets.map((t) => (
                      <div
                        key={t._id}
                        className={`glass-card ${activeTicketId === t._id ? 'active-ticket-card' : ''}`}
                        style={{
                          padding: '1rem',
                          cursor: 'pointer',
                          borderRadius: '10px',
                          border: activeTicketId === t._id ? '1px solid var(--accent-indigo)' : '1px solid var(--border-color)',
                          background: activeTicketId === t._id ? 'rgba(99, 102, 241, 0.04)' : 'var(--bg-card)'
                        }}
                        onClick={() => setActiveTicketId(t._id)}
                      >
                        <div className="flex-row-between" style={{ marginBottom: '0.4rem' }}>
                          <span className={getStatusBadgeClass(t.status)}>{t.status}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.3rem' }}>{t.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Chat Thread Panel for Customer to review response and message back */}
            {activeTicket && (
              <div className="glass-card">
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <span className={getStatusBadgeClass(activeTicket.status)} style={{ marginBottom: '0.5rem' }}>{activeTicket.status}</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '700' }}>
                    Thread: {activeTicket.title}
                  </h3>
                </div>

                <div className="chat-thread" style={{ maxHeight: '250px' }}>
                  {activeTicket.messages?.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`chat-bubble ${msg.sender === 'customer'
                        ? 'bubble-customer'
                        : msg.sender === 'agent'
                          ? 'bubble-agent'
                          : 'bubble-ai'
                        }`}
                      style={{
                        alignSelf: msg.sender === 'customer' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', opacity: 0.8, marginBottom: '0.2rem' }}>
                        {msg.sender === 'customer' ? 'YOU' : msg.sender.toUpperCase()}
                      </div>
                      <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                      <div className="bubble-time">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>

                {activeTicket.status !== 'Resolved' ? (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <textarea
                      placeholder="Type a message to send to the support team..."
                      className="form-textarea"
                      style={{ minHeight: '60px' }}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.8rem' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleSendMessage('customer')}
                        disabled={isSendingReply || !replyText.trim()}
                      >
                        <Send size={14} /> Send Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="solver-suggestion-box" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)', margin: 0 }}>
                    <h4 style={{ color: 'var(--accent-mint)', fontSize: '0.95rem' }}><CheckCircle size={14} /> Closed</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      This ticket is resolved. Thanks for using SmartSupport!
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* 3. KNOWLEDGE BASE MANAGER */}
        {currentView === 'kb' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Split layout: Add Article and Articles Directory */}
            <div className="grid-cols-2">

              {/* Creator Form */}
              <div className="glass-card" style={{ height: 'fit-content' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '700', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus className="text-cyan-400" size={20} style={{ color: 'var(--accent-cyan)' }} />
                  Publish FAQ / KB Article
                </h3>

                {articleSubmitSuccess && (
                  <div className="solver-suggestion-box" style={{ borderColor: 'var(--accent-mint)', background: 'rgba(16, 185, 129, 0.05)', marginBottom: '1.2rem' }}>
                    <h4 style={{ color: 'var(--accent-mint)' }}><CheckCircle size={14} /> Article Ingested Successfully!</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      The article has been stored and embedded into Pinecone/Local DB. It is immediately available for semantic search.
                    </p>
                  </div>
                )}

                <form onSubmit={handleCreateArticle}>
                  <div className="form-group">
                    <label className="form-label">Article Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Clearing Browser Cache and Cookies"
                      className="form-input"
                      value={newArticleTitle}
                      onChange={(e) => { setNewArticleTitle(e.target.value); setArticleSubmitSuccess(false); }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={newArticleCategory}
                      onChange={(e) => { setNewArticleCategory(e.target.value); setArticleSubmitSuccess(false); }}
                    >
                      <option value="Billing">Billing</option>
                      <option value="Technical">Technical</option>
                      <option value="Feature Request">Feature Request</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Article Content</label>
                    <textarea
                      placeholder="Describe steps, FAQs or policies. Make sure to use descriptive keywords to help semantic RAG retrieve it correctly."
                      className="form-textarea"
                      style={{ minHeight: '150px' }}
                      value={newArticleContent}
                      onChange={(e) => { setNewArticleContent(e.target.value); setArticleSubmitSuccess(false); }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)', boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)' }}
                    disabled={isSubmittingArticle || !newArticleTitle.trim() || !newArticleContent.trim()}
                  >
                    {isSubmittingArticle ? 'Ingesting Vector...' : 'Ingest to Vector DB'}
                  </button>
                </form>
              </div>

              {/* Directory Browser */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: '700' }}>
                  Knowledge Directory
                </h3>

                <div style={{ overflowY: 'auto', maxHeight: '550px', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '4px' }}>
                  {isLoadingArticles ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <div className="spinner"></div>
                    </div>
                  ) : kbArticles.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
                      No articles in Knowledge Base. Check back later or create one.
                    </p>
                  ) : (
                    kbArticles.map((art) => (
                      <div key={art._id} className="glass-card" style={{ padding: '1rem', borderRadius: '10px', position: 'relative' }}>
                        <div className="flex-row-between" style={{ marginBottom: '0.5rem' }}>
                          <span className={`tag ${getCategoryBadgeClass(art.category)}`}>
                            {art.category}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Embedded (768d)
                            </span>
                            <button
                              onClick={() => handleDeleteArticle(art._id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(239, 68, 68, 0.75)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '2px',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = '#EF4444'}
                              onMouseOut={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.75)'}
                              title="Delete Article"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>{art.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{art.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 4. ANALYTICS HUB VIEW */}
        {currentView === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Overview Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-card" style={{ textAlign: 'center', borderLeft: '4px solid var(--accent-indigo)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Total Ingested Tickets</span>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: '800', marginTop: '0.4rem', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {analytics ? analytics.totalTickets : tickets.length}
                </h2>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', borderLeft: '4px solid var(--accent-cyan)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Open Workload</span>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: '800', marginTop: '0.4rem', color: 'var(--color-error)' }}>
                  {analytics ? analytics.byStatus.Open : tickets.filter(t => t.status === 'Open').length}
                </h2>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', borderLeft: '4px solid var(--accent-purple)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>In Progress Workload</span>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: '800', marginTop: '0.4rem', color: 'var(--color-warning)' }}>
                  {analytics ? analytics.byStatus['In Progress'] : tickets.filter(t => t.status === 'In Progress').length}
                </h2>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', borderLeft: '4px solid var(--accent-mint)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Resolved Workload</span>
                <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: '800', marginTop: '0.4rem', color: 'var(--color-success)' }}>
                  {analytics ? analytics.byStatus.Resolved : tickets.filter(t => t.status === 'Resolved').length}
                </h2>
              </div>
            </div>

            {/* Split layout charts */}
            <div className="grid-cols-2">

              {/* Customer Sentiment Breakdown */}
              <div className="glass-card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.2rem' }}>
                  Customer Sentiment Health
                </h3>

                {isLoadingAnalytics ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <div className="spinner"></div>
                  </div>
                ) : analytics ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {Object.entries(analytics.bySentiment).map(([sentiment, count]) => {
                      const percentage = analytics.totalTickets > 0 ? Math.round((count / analytics.totalTickets) * 100) : 0;
                      let colorClass = 'var(--gradient-neutral)';
                      if (sentiment === 'Positive') colorClass = 'var(--gradient-positive)';
                      if (sentiment === 'Negative') colorClass = 'var(--gradient-negative)';
                      if (sentiment === 'Angry') colorClass = 'var(--gradient-angry)';

                      return (
                        <div key={sentiment}>
                          <div className="flex-row-between" style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                            <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {getSentimentIcon(sentiment)}
                              {sentiment}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{count} ({percentage}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'var(--progress-track)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: colorClass, borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No data loaded.</p>
                )}
              </div>

              {/* Priority & Category Breakdown */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.2rem' }}>
                    Workload Priority Profile
                  </h3>
                  {analytics && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Object.entries(analytics.byPriority).map(([prio, count]) => {
                        const pct = analytics.totalTickets > 0 ? Math.round((count / analytics.totalTickets) * 100) : 0;
                        let colorClass = 'var(--gradient-low)';
                        if (prio === 'High') colorClass = 'var(--gradient-high)';
                        if (prio === 'Medium') colorClass = 'var(--gradient-medium)';

                        return (
                          <div key={prio}>
                            <div className="flex-row-between" style={{ fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                              <span style={{ fontWeight: '500' }}>{prio}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'var(--progress-track)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: colorClass, borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
                    Categorical Classification
                  </h3>
                  {analytics && (
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                      {Object.entries(analytics.byCategory).map(([cat, count]) => (
                        <div key={cat} className="glass-card" style={{ padding: '0.8rem', flex: '1 1 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                          <span className={`tag ${getCategoryBadgeClass(cat)}`} style={{ fontSize: '0.75rem' }}>{cat}</span>
                          <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: '700', color: 'var(--text-primary)' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;
