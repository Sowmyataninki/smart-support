import React, { useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';

const Communication = () => {
  const [emailType, setEmailType] = useState('Interview Invitation');
  const [customNotes, setCustomNotes] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);

  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  const handleGenerateEmail = () => {
    setLoadingEmail(true);
    // TODO: Connect to backend API
    // axios.post('/api/communication/email', { candidateId, emailType, customNotes })
    setTimeout(() => {
      setEmailSubject('Invitation to Interview - HireSmart');
      setEmailBody(`Dear Jane Doe,\n\nWe were incredibly impressed by your background in React and Node.js. Your work on the AI integration project really stood out to our team.\n\nWe would love to invite you for an interview to discuss how your skills align with our Senior React Developer role.\n\nPlease let us know your availability for next week.\n\nBest regards,\nRecruiting Team`);
      setLoadingEmail(false);
    }, 2000);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const newHistory = [...chatHistory, { type: 'user', text: chatQuery }];
    setChatHistory(newHistory);
    setChatQuery('');
    setLoadingChat(true);

    // TODO: Connect to backend API
    setTimeout(() => {
      setChatHistory([...newHistory, { 
        type: 'ai', 
        text: 'Based on the resume, the candidate has hands-on experience with Docker from their time at TechCorp where they containerized microservices, though it is not listed as a primary skill.'
      }]);
      setLoadingChat(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 dark:bg-gray-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recruiter Copilot</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Draft personalized emails and chat directly with Candidate <span className="font-semibold text-indigo-600 dark:text-indigo-400">Jane Doe's</span> resume.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Email Generator Card */}
        <div className="flex flex-col rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center space-x-3 mb-6">
            <Mail className="h-6 w-6 text-indigo-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Email Generator</h2>
          </div>

          <div className="space-y-4 flex-grow">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Type</label>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 border"
              >
                <option>Interview Invitation</option>
                <option>Shortlist</option>
                <option>Offer</option>
                <option>Rejection</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Custom Notes (Optional)</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="E.g. mention the salary expectations match"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 border"
              />
            </div>
            
            <button
              onClick={handleGenerateEmail}
              disabled={loadingEmail}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingEmail ? 'Drafting...' : 'Generate Email'}
            </button>

            {emailSubject && (
              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</label>
                  <input 
                    type="text" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 border font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Body</label>
                  <textarea
                    rows={8}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-2 px-3 border"
                  />
                </div>
                <button className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                  Send Email
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Resume Chat Card */}
        <div className="flex flex-col h-[600px] rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center space-x-3 mb-6">
            <MessageSquare className="h-6 w-6 text-indigo-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chat with Resume</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 rounded-md bg-gray-50 dark:bg-gray-900 border dark:border-gray-700">
            {chatHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm italic text-center">
                Ask a question about the candidate's resume...<br/>e.g., "Does this candidate have leadership experience?"
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    msg.type === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {loadingChat && (
              <div className="flex justify-start">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2 text-sm text-gray-500 animate-pulse">
                  Analyzing resume...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="mt-auto relative flex items-center">
            <input
              type="text"
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Ask anything..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white py-3 pl-4 pr-12 border"
            />
            <button
              type="submit"
              disabled={!chatQuery.trim() || loadingChat}
              className="absolute right-2 p-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Communication;
