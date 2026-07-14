import express from 'express';
import { submitTicket, listTickets, getTicket, addMessage, getSuggestions, resolveTicket } from '../controllers/ticketController.js';

const router = express.Router();

router.post('/', submitTicket);
router.get('/', listTickets);
router.get('/:id', getTicket);
router.put('/:id/message', addMessage);
router.get('/:id/suggestions', getSuggestions);
router.put('/:id/resolve', resolveTicket);

export default router;
