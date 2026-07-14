import { db } from '../db.js';

export const getAnalytics = async (req, res) => {
  try {
    const tickets = await db.tickets.find();
    
    const total = tickets.length;
    
    const statusCounts = { Open: 0, 'In Progress': 0, Resolved: 0 };
    const priorityCounts = { High: 0, Medium: 0, Low: 0 };
    const sentimentCounts = { Positive: 0, Neutral: 0, Negative: 0, Angry: 0 };
    const categoryCounts = { Billing: 0, Technical: 0, 'Feature Request': 0 };

    tickets.forEach(ticket => {
      if (statusCounts[ticket.status] !== undefined) statusCounts[ticket.status]++;
      if (priorityCounts[ticket.priority] !== undefined) priorityCounts[ticket.priority]++;
      if (sentimentCounts[ticket.sentiment] !== undefined) sentimentCounts[ticket.sentiment]++;
      if (categoryCounts[ticket.category] !== undefined) categoryCounts[ticket.category]++;
    });

    res.json({
      totalTickets: total,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      bySentiment: sentimentCounts,
      byCategory: categoryCounts,
    });
  } catch (error) {
    console.error('Analytics load error:', error);
    res.status(500).json({ error: 'Failed to aggregate analytics.' });
  }
};
