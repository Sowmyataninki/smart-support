import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    // TODO: Fetch jobs from API
    // Mock data for now
    setJobs([
      { _id: '1', title: 'Frontend Developer', department: 'Engineering', location: 'Remote', status: 'Open' },
      { _id: '2', title: 'Backend Developer', department: 'Engineering', location: 'New York', status: 'Open' },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Descriptions</h1>
        <Link
          to="/jobs/create"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create Job
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <div key={job._id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{job.title}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {job.department} • {job.location}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                {job.status}
              </span>
              <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Jobs;
