import { db } from '../db.js';
import { getEmbedding } from '../services/geminiService.js';
import { upsertVector, deleteVector } from '../services/vectorService.js';

export const getAllArticles = async (req, res) => {
  try {
    const articles = await db.articles.find();
    res.json(articles);
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Failed to retrieve articles.' });
  }
};

export const createArticle = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required.' });
    }

    const embedding = await getEmbedding(`${title} ${content}`);
    const newArticle = await db.articles.create({
      title,
      content,
      category,
      embedding
    });

    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_HOST) {
      await upsertVector(newArticle._id.toString(), embedding, {
        type: 'article',
        articleId: newArticle._id.toString(),
        title,
        content,
        category
      });
    }

    res.status(201).json(newArticle);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to add article.' });
  }
};

export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required.' });
    }

    const embedding = await getEmbedding(`${title} ${content}`);
    const updatedArticle = await db.articles.findByIdAndUpdate(id, {
      title,
      content,
      category,
      embedding
    });

    if (!updatedArticle) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_HOST) {
      await upsertVector(id, embedding, {
        type: 'article',
        articleId: id,
        title,
        content,
        category
      });
    }

    res.json(updatedArticle);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article.' });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedArticle = await db.articles.findByIdAndDelete(id);

    if (!deletedArticle) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_HOST) {
      await deleteVector(id);
    }

    res.json({ message: 'Article deleted successfully.', deletedArticle });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Failed to delete article.' });
  }
};
