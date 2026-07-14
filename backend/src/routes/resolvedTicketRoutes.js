import express from 'express';
import { getResolvedTickets, searchSimilar } from '../controllers/resolvedTicketController.js';

const router = express.Router();

router.get('/', getResolvedTickets);
router.post('/search', searchSimilar);

export default router;
