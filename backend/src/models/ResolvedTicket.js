import mongoose from 'mongoose';

const ResolvedTicketSchema = new mongoose.Schema(
  {
    originalTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    title: { type: String, required: true },
    issueSummary: { type: String, required: true },
    resolutionNotes: { type: String, required: true },
    category: { type: String, enum: ['Billing', 'Technical', 'Feature Request'], required: true },
    embedding: { type: [Number], default: [] }, // For semantic search of previous solutions
  },
  { timestamps: true }
);

export default mongoose.model('ResolvedTicket', ResolvedTicketSchema);
