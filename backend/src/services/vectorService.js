import { db } from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexHost = process.env.PINECONE_INDEX_HOST; // E.g., https://index-name-id.svc.gcp-starter.pinecone.io

// Helper to construct Pinecone API URLs
function getPineconeUrl(endpoint) {
  if (!pineconeIndexHost) return '';
  let host = pineconeIndexHost.trim();
  if (host && !host.startsWith('http')) {
    host = `https://${host}`;
  }
  return `${host}${endpoint}`;
}

// Cosine Similarity between two vectors
export function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 1. Search Similar Knowledge Base Articles
export async function searchSimilarArticles(queryEmbedding, limit = 3) {
  if (pineconeApiKey && pineconeIndexHost) {
    try {
      console.log('Querying Pinecone index for articles...');
      const response = await fetch(getPineconeUrl('/query'), {
        method: 'POST',
        headers: {
          'Api-Key': pineconeApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector: queryEmbedding,
          topK: limit,
          includeMetadata: true,
          filter: { type: 'article' }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.matches.map(match => ({
          _id: match.id,
          title: match.metadata.title,
          content: match.metadata.content,
          category: match.metadata.category,
          score: match.score
        }));
      } else {
        console.error('Pinecone article query failed, code:', response.status);
      }
    } catch (error) {
      console.error('Pinecone article search exception, using local search fallback:', error);
    }
  }

  // Local Cosine Similarity Search Fallback
  console.log('Performing local semantic search for articles...');
  const articles = await db.articles.find();
  
  const scored = articles
    .map(article => {
      const score = calculateCosineSimilarity(queryEmbedding, article.embedding || []);
      return { ...article, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

// 2. Search Similar Resolved Tickets
export async function searchSimilarClosedTickets(queryEmbedding, currentTicketId, limit = 1) {
  if (pineconeApiKey && pineconeIndexHost) {
    try {
      console.log('Querying Pinecone index for similar resolved tickets...');
      const response = await fetch(getPineconeUrl('/query'), {
        method: 'POST',
        headers: {
          'Api-Key': pineconeApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector: queryEmbedding,
          topK: limit + 1, // Get extra in case current ticket is returned
          includeMetadata: true,
          filter: { type: 'ticket', status: 'Resolved' }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const matches = result.matches
          .filter(match => match.id !== currentTicketId)
          .map(match => ({
            _id: match.id,
            title: match.metadata.title,
            description: match.metadata.description,
            resolvedNotes: match.metadata.resolvedNotes,
            score: match.score
          }));
        return matches.slice(0, limit);
      }
    } catch (error) {
      console.error('Pinecone ticket search exception, using local search fallback:', error);
    }
  }

  // Local Cosine Similarity Search Fallback
  console.log('Performing local semantic search for resolved tickets...');
  // Find all tickets that are resolved and have an embedding
  const resolvedTickets = await db.tickets.find({ status: 'Resolved' });
  
  const scored = resolvedTickets
    .filter(t => t._id !== currentTicketId && t.embedding && t.embedding.length > 0)
    .map(ticket => {
      const score = calculateCosineSimilarity(queryEmbedding, ticket.embedding || []);
      return {
        _id: ticket._id,
        title: ticket.title,
        description: ticket.description,
        resolvedNotes: ticket.resolvedNotes || 'No notes left by agent.',
        score
      };
    })
    // Filter out very poor matches to avoid displaying irrelevant issues
    .filter(t => t.score > 0.3)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

// 3. Upsert Article or Ticket Vector to Pinecone
export async function upsertVector(id, vector, metadata) {
  if (!pineconeApiKey || !pineconeIndexHost) {
    return false;
  }

  try {
    const response = await fetch(getPineconeUrl('/vectors/upsert'), {
      method: 'POST',
      headers: {
        'Api-Key': pineconeApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: [
          {
            id,
            values: vector,
            metadata
          }
        ]
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Pinecone upsert error:', error);
    return false;
  }
}

// 4. Delete Vector from Pinecone
export async function deleteVector(id) {
  if (!pineconeApiKey || !pineconeIndexHost) {
    return false;
  }

  try {
    const response = await fetch(getPineconeUrl('/vectors/delete'), {
      method: 'POST',
      headers: {
        'Api-Key': pineconeApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: [id]
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Pinecone delete error:', error);
    return false;
  }
}
