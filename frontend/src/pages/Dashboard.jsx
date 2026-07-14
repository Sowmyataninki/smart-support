import React, { useState, useEffect } from 'react';
import { Users, Briefcase, FileCheck, Activity } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalUsers: 0
  });
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from /api/analytics/stats
    setTimeout(() => {
      setStats({
        totalCandidates: 124,
        totalJobs: 12,
        activeJobs: 8,
        totalUsers: 4
      });
      setRecentCandidates([
        { _id: '1', name: 'Jane Doe', skills: ['React', 'Node.js'], experience: [{ role: 'Senior Dev' }] },
        { _id: '2', name: 'John Smith', skills: ['Python', 'Django'], experience: [{ role: 'Backend Eng' }] },
        { _id: '3', name: 'Alice Johnson', skills: ['UI/UX', 'Figma'], experience: [{ role: 'Designer' }] },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const statCards = [
    { name: 'Total Candidates', value: stats.totalCandidates, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900' },
    { name: 'Open Jobs', value: stats.activeJobs, icon: Briefcase, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900' },
    { name: 'Total Jobs', value: stats.totalJobs, icon: FileCheck, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900' },
    { name: 'System Users', value: stats.totalUsers, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Welcome back to HireSmart. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div key={i} className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 dark:bg-gray-800">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {loading ? '...' : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Candidates */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Recently Added Candidates</h3>
          </div>
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentCandidates.map((candidate) => (
              <li key={candidate._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{candidate.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.skills.slice(0, 3).join(', ')}</p>
                </div>
                <div>
                   <button className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">View</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
