import { db } from '../db.js';
import { triageTicket, getEmbedding, generateDraftResponse, generateHandoffSummary, detectLanguage, translateText, checkAutoClose, triageLocalMock } from '../services/geminiService.js';
import { searchSimilarArticles, searchSimilarClosedTickets, upsertVector } from '../services/vectorService.js';

export const submitTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    // 1. Detect language of customer issue
    const language = await detectLanguage(description);
    let englishTitle = title;
    let englishDescription = description;

    // 2. Translate to English if incoming text is multilingual
    if (language.toLowerCase() !== 'english') {
      console.log(`Multilingual support: Ingesting ticket in language ${language}. Translating...`);
      englishTitle = await translateText(title, 'English');
      englishDescription = await translateText(description, 'English');
    }

    // 3. Triage & embed using the English translation
    const triage = await triageTicket(englishDescription);
    const embedding = await getEmbedding(`${englishTitle} ${englishDescription}`);
    const suggestAutoClose = await checkAutoClose(englishDescription);

    // 4. Generate local sentiment triage
    const localTriage = triageLocalMock(description);
    const sentiment = localTriage.sentiment;

    const newTicket = await db.tickets.create({
      title,
      description,
      status: 'Open',
      sentiment: sentiment || 'Neutral',
      priority: triage.priority || 'Medium',
      category: triage.category || 'Technical',
      embedding,
      language,
      englishTitle,
      englishDescription,
      suggestAutoClose,
      messages: [
        {
          sender: 'customer',
          text: description,
        }
      ]
    });

    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to submit ticket.' });
  }
};

export const listTickets = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await db.tickets.find(filter);
    res.json(tickets);
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ error: 'Failed to retrieve tickets.' });
  }
};

export const getTicket = async (req, res) => {
  try {
    const ticket = await db.tickets.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }
    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to retrieve ticket.' });
  }
};

export const addMessage = async (req, res) => {
  try {
    const { sender, text } = req.body;
    if (!sender || !text) {
      return res.status(400).json({ error: 'Sender and text are required.' });
    }

    const ticket = await db.tickets.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const updatedMessages = [...ticket.messages, { sender, text, createdAt: new Date() }];

    let newStatus = ticket.status;
    if (sender === 'agent' && ticket.status === 'Open') {
      newStatus = 'In Progress';
    }

    const summary = await generateHandoffSummary(updatedMessages);

    await db.tickets.findByIdAndUpdate(
      req.params.id,
      {
        status: newStatus,
        summary,
        $push: { messages: { sender, text } }
      }
    );

    const finalTicket = await db.tickets.findById(req.params.id);
    res.json(finalTicket);
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to add message.' });
  }
};

export const getSuggestions = async (req, res) => {
  try {
    const ticket = await db.tickets.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    let embedding = ticket.embedding;
    if (!embedding || embedding.length === 0) {
      const searchTarget = (ticket.englishTitle && ticket.englishDescription)
        ? `${ticket.englishTitle} ${ticket.englishDescription}`
        : `${ticket.title} ${ticket.description}`;
      embedding = await getEmbedding(searchTarget);
      await db.tickets.findByIdAndUpdate(req.params.id, { embedding });
    }

    // 1. Search semantic matches
    const articles = await searchSimilarArticles(embedding, 3);
    const similarTickets = await searchSimilarClosedTickets(embedding, ticket._id, 1);
    const similarTicket = similarTickets.length > 0 ? similarTickets[0] : null;
    
    // 2. Draft response based on English translation
    const queryDesc = ticket.englishDescription || ticket.description;
    let draftReply = await generateDraftResponse(queryDesc, articles);
    const summary = await generateHandoffSummary(ticket.messages);

    // 3. Multilingual Support: Translate response back to original customer language
    if (ticket.language && ticket.language.toLowerCase() !== 'english') {
      console.log(`Multilingual support: Translating draft response back to ${ticket.language}...`);
      draftReply = await translateText(draftReply, ticket.language);
    }

    await db.tickets.findByIdAndUpdate(req.params.id, { draftReply, summary });

    res.json({ articles, similarTicket, draftReply, summary });
  } catch (error) {
    console.error('Suggestions generator error:', error);
    res.status(500).json({ error: 'Failed to compute suggestions.' });
  }
};

export const resolveTicket = async (req, res) => {
  try {
    const { resolvedNotes } = req.body;
    
    const ticket = await db.tickets.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    let embedding = ticket.embedding;
    if (!embedding || embedding.length === 0) {
      embedding = await getEmbedding(`${ticket.title} ${ticket.description}`);
    }

    await db.tickets.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Resolved',
        resolvedNotes: resolvedNotes || 'Closed by agent.',
        embedding
      }
    );

    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_HOST) {
      await upsertVector(ticket._id.toString(), embedding, {
        type: 'ticket',
        status: 'Resolved',
        title: ticket.title,
        description: ticket.description,
        resolvedNotes: resolvedNotes || 'Closed by agent.'
      });
    }

    const finalTicket = await db.tickets.findById(req.params.id);
    res.json(finalTicket);
  } catch (error) {
    console.error('Resolve ticket error:', error);
    res.status(500).json({ error: 'Failed to resolve ticket.' });
  }
};
