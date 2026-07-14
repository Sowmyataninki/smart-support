import { Plus, CheckCircle, Mic, MicOff } from 'lucide-react';
import { useState } from 'react';

export default function TicketForm({
  ticketSubmitSuccess,
  handleCreateTicket,
  newTicketTitle,
  setNewTicketTitle,
  setTicketSubmitSuccess,
  newTicketDesc,
  setNewTicketDesc,
  isSubmittingTicket
}) {
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

  return (
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
  );
}
