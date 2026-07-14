import mongoose from 'mongoose';

const KnowledgeBaseArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, enum: ['Billing', 'Technical', 'Feature Request'], required: true },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('KnowledgeBaseArticle', KnowledgeBaseArticleSchema);
