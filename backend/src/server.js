import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { db } from './db.js';
import { hashPassword, verifyPassword } from './utils/auth.js';
import { triageTicket, getEmbedding, generateDraftResponse, generateHandoffSummary } from './services/geminiService.js';
import { searchSimilarArticles, searchSimilarClosedTickets, upsertVector } from './services/vectorService.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// --- Mock Knowledge Base Articles Data ---
const SEED_ARTICLES = [
  {
    title: 'Shipping Policy & Transit Times',
    category: 'Technical',
    content: 'We process all orders within 1-2 business days. Standard shipping takes 3-5 business days, while expedited shipping takes 1-2 business days. Shipping rates are calculated at checkout based on location and weight. You will receive a tracking number via email as soon as the carrier scans your package.'
  },
  {
    title: 'Refund Policy & Processing Times',
    category: 'Billing',
    content: 'Our standard refund policy permits refunds within 14 days of purchase for monthly plans, and 30 days for annual plans. Once approved, refunds are processed immediately. However, financial institutions can take 5 to 10 business days to return the funds to your original payment method. We cannot speed up this process.'
  },
  {
    title: 'Double Charge Issue & Duplicate Transactions',
    category: 'Billing',
    content: 'If you notice a duplicate charge on your billing statement: 1. It may be a temporary authorization hold placed by your card issuer. This hold typically drops off in 3-5 business days. 2. If both charges clear (settle), please provide your invoice number and transaction IDs to support. We will issue a refund for the duplicate charge immediately.'
  },
  {
    title: 'Payment Failure Troubleshooting',
    category: 'Billing',
    content: 'If your payment fails during checkout or renewal: 1. Verify card numbers, expiration dates, and security codes. 2. Ensure your card has not expired and has sufficient funds. 3. Check with your issuing bank if they are blocking international or SaaS transactions. 4. Try using a different card or digital wallet (PayPal, Apple Pay).'
  },
  {
    title: 'How to Reset Your Account Password',
    category: 'Technical',
    content: 'To reset your password: 1. Click on "Forgot Password" on the login screen. 2. Enter your registered email address. 3. Check your inbox for a reset link. 4. Click the link and enter a new password (must contain at least 8 characters, one number, and one special symbol). Check spam if you do not receive the email.'
  },
  {
    title: 'Account Locked or Suspended Troubleshooting',
    category: 'Technical',
    content: 'If your account is locked due to multiple failed login attempts, it will automatically unlock after 30 minutes. If your account is suspended due to billing failures or policy violations, please check your registered email address for a detailed notification or contact support to verify identity and billing standing.'
  },
  {
    title: 'Subscription Cancellation Procedures',
    category: 'Billing',
    content: 'To cancel your subscription plan: 1. Log in to your SmartSupport account. 2. Navigate to Settings > Billing. 3. Click "Cancel Subscription". 4. Confirm the cancellation. You will retain access to your plan until the end of the current billing cycle, after which your account will revert to the free plan.'
  },
  {
    title: 'Delivery Delay and Delayed Shipments',
    category: 'Technical',
    content: 'If your order delivery is delayed beyond the estimated delivery date: 1. Check your tracking number link for any carrier delay notifications (weather, customs). 2. Contact the shipping carrier directly with your tracking code. 3. If there is no update for more than 3 business days, please open a support ticket to initiate a claim.'
  },
  {
    title: 'Order Tracking & Carrier Tracking Links',
    category: 'Technical',
    content: 'To track your order status: 1. Log in and head to Order History. 2. Click on the order number you want to track. 3. Click the "Track Order" button to view transit checkpoints. If no tracking information is available yet, your order is likely still in the fulfillment warehouse and will ship soon.'
  },
  {
    title: 'How to Contact Support and Open Tickets',
    category: 'Feature Request',
    content: 'You can contact our support team in three ways: 1. Submit a support ticket through our Customer Portal. 2. Use our Live Chat widget at the bottom right corner of the dashboard (available 9 AM to 5 PM EST). 3. Email us directly at support@smartsupport.com. We aim to respond to all inquiries within 24 hours.'
  }
];

// Seed function to pre-populate KB Articles
async function seedArticlesIfEmpty() {
  try {
    const count = await db.articles.countDocuments();
    if (count === 0) {
      console.log('Knowledge Base is empty. Seeding 12 mock articles with embeddings...');
      
      const articlesWithEmbeddings = [];
      for (const art of SEED_ARTICLES) {
        // Embed article content for vector search
        const embedding = await getEmbedding(`${art.title} ${art.content}`);
        articlesWithEmbeddings.push({
          ...art,
          embedding
        });
      }

      await db.articles.insertMany(articlesWithEmbeddings);
      console.log('Seeded database articles successfully!');

      // Proactively upsert to Pinecone if configured
      if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_HOST) {
        console.log('Pinecone configured. Indexing seeded articles...');
        const savedArticles = await db.articles.find();
        for (const item of savedArticles) {
          await upsertVector(item._id.toString(), item.embedding, {
            type: 'article',
            title: item.title,
            content: item.content,
            category: item.category
          });
        }
        console.log('Articles indexed in Pinecone successfully.');
      }
    } else {
      console.log(`Database already has ${count} articles. Skipping seed.`);
    }
  } catch (error) {
    console.error('Failed to seed articles:', error);
  }
}

// Call seed on start
seedArticlesIfEmpty();

// --- Express API Routes ---
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import knowledgeBaseRoutes from './routes/knowledgeBaseRoutes.js';
import resolvedTicketRoutes from './routes/resolvedTicketRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/articles', knowledgeBaseRoutes);
app.use('/api/resolved', resolvedTicketRoutes);
app.use('/api/analytics', analyticsRoutes);

// Start Express Server
app.listen(PORT, () => {
  console.log(`SmartSupport backend running on port http://localhost:${PORT}`);
});
