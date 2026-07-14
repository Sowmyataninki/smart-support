import express from 'express';
import { getAllArticles, createArticle, updateArticle, deleteArticle } from '../controllers/knowledgeBaseController.js';

const router = express.Router();

router.get('/', getAllArticles);
router.post('/', createArticle);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);

export default router;
