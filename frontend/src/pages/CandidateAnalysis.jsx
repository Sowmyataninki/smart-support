import React, { useState } from 'react';
import { Target, List, CheckCircle, XCircle } from 'lucide-react';

const CandidateAnalysis = () => {
  const [loadingFit, setLoadingFit] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [fitData, setFitData] = useState(null);
  const [questions, setQuestions] = useState(null);

  const handleAnalyzeFit = () => {
    setLoadingFit(true);
    // TODO: Connect to backend API
    // axios.post('/api/analysis/fit', { candidateId, jobId })
    setTimeout(() => {
      setFitData({
        fitScore: 88,
        pros: ['Strong React experience', 'Previous AI project integration'],
        cons: ['Lacks deep Pinecone specific experience', 'No senior leadership roles'],
        missingSkills: ['Pinecone', 'Docker'],
        strengths: ['Frontend Architecture', 'REST APIs', 'Node.js'],
        weaknesses: ['DevOps', 'Vector Databases'],
        hiringRecommendation: 'Strong Hire. The candidate possesses the core skills required and can easily pick up Pinecone on the job given their AI project background.'
      });
      setLoadingFit(false);
    }, 2000);
  };

  const handleGenerateQuestions = () => {
    setLoadingQuestions(true);
    // TODO: Connect to backend API
    setTimeout(() => {
      setQuestions([
        "Can you walk me through the architecture of the AI integration project you mentioned in your resume?",
        "I noticed you built a REST API in Node.js. How did you handle rate limiting and authentication?",
        "Describe a time you had to learn a new technology quickly. How would you approach learning Pinecone?",
        "What strategies do you use for state management in large React applications?",
        "Tell me about a time you disagreed with a technical decision made by your team."
      ]);
      setLoadingQuestions(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 dark:bg-gray-900">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Candidate Fit Analysis</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Compare Candidate: <span className="font-semibold text-indigo-600 dark:text-indigo-400">Jane Doe</span> against Job: <span className="font-semibold text-indigo-600 dark:text-indigo-400">Senior React Developer</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Fit Analysis Card */}
        <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Target className="h-6 w-6 text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">RAG Fit Analysis</h2>
            </div>
            <button
              onClick={handleAnalyzeFit}
              disabled={loadingFit}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingFit ? 'Analyzing...' : 'Generate Analysis'}
            </button>
          </div>

          {fitData && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                <span className="text-gray-700 font-medium dark:text-gray-300">Overall Fit Score</span>
                <span className={`text-2xl font-bold ${fitData.fitScore > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {fitData.fitScore}/100
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="flex items-center text-sm font-medium text-green-700 dark:text-green-400 mb-2">
                    <CheckCircle className="w-4 h-4 mr-1" /> Pros
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {fitData.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="flex items-center text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                    <XCircle className="w-4 h-4 mr-1" /> Cons
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {fitData.cons.map((con, i) => <li key={i}>{con}</li>)}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Hiring Recommendation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-indigo-50 p-3 rounded-md border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
                  "{fitData.hiringRecommendation}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Interview Questions Card */}
        <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <List className="h-6 w-6 text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Interview Guide</h2>
            </div>
            <button
              onClick={handleGenerateQuestions}
              disabled={loadingQuestions}
              className="rounded-md border border-indigo-600 bg-transparent px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-gray-700"
            >
              {loadingQuestions ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>

          {questions && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Tailored questions based on the candidate's resume projects and job requirements.</p>
              {questions.map((q, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                  <p className="text-sm text-gray-800 font-medium dark:text-gray-200">
                    <span className="text-indigo-600 dark:text-indigo-400 mr-2">Q{i + 1}.</span> {q}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateAnalysis;
