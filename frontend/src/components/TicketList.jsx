import { RefreshCw, Search, Flame, Frown, Smile, Meh } from 'lucide-react';

export default function TicketList({
  tickets,
  isLoadingTickets,
  fetchTickets,
  filterSearch,
  setFilterSearch,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filterCategory,
  setFilterCategory,
  activeTicketId,
  setActiveTicketId,
  setIsResolving
}) {
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

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxHeight: 'calc(100vh - 180px)', overflow: 'hidden' }}>
      <div className="flex-row-between">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '700' }}>Active Tickets</h3>
        <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={fetchTickets} disabled={isLoadingTickets}>
          <RefreshCw size={14} className={isLoadingTickets ? 'spin' : ''} />
        </button>
      </div>

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
  );
}
