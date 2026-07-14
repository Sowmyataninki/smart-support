import { Sparkles, MessageSquare, CheckCircle, FolderSync, BookOpen, Copy, Send, Flame, Frown, Smile, Meh, Globe } from 'lucide-react';

export default function TicketDetails({
  activeTicket,
  isLoadingSuggestions,
  suggestions,
  isResolving,
  setIsResolving,
  resolvedNotes,
  setResolvedNotes,
  handleResolveTicket,
  isSubmittingResolve,
  replyText,
  setReplyText,
  handleSendMessage,
  isSendingReply
}) {
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

  if (!activeTicket) {
    return (
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: 'var(--text-muted)' }}>
        <MessageSquare size={48} style={{ marginBottom: '1rem', color: 'var(--border-color-glow)' }} />
        <h3>No Ticket Selected</h3>
        <p style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>Please select an active ticket from the sidebar to begin triage and RAG resolution.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
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

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Conversation Thread
            </h4>
            <div className="chat-thread">
              {activeTicket.messages?.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`chat-bubble ${
                    msg.sender === 'customer' 
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
  );
}
