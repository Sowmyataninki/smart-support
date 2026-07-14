import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative', 'Angry'], default: 'Neutral' },
    category: { type: String, enum: ['Billing', 'Technical', 'Feature Request'], default: 'Technical' },
    messages: [
      {
        sender: { type: String, enum: ['customer', 'agent', 'ai'], required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    summary: { type: String, default: '' },
    draftReply: { type: String, default: '' },
    embedding: { type: [Number], default: [] },
    resolvedNotes: { type: String, default: '' },
    language: { type: String, default: 'English' },
    englishTitle: { type: String, default: '' },
    englishDescription: { type: String, default: '' },
    suggestAutoClose: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', TicketSchema);
