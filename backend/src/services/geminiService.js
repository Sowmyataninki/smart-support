import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  console.log('Gemini API key detected. Initializing GoogleGenerativeAI client.');
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('WARNING: GEMINI_API_KEY is not set. The application will use high-fidelity local mock models for AI features.');
}

// Helper: Deterministic mock embedding generator based on text hash
function generateMockEmbedding(text) {
  const size = 768; // standard vector size for Gemini embeddings
  const vector = new Array(size).fill(0);
  
  // Clean text and split to generate somewhat content-dependent vector values
  const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i);
    // Hash-like spread across vector dimensions
    const index1 = (i * 7) % size;
    const index2 = (i * 13) % size;
    vector[index1] += charCode * 0.1;
    vector[index2] += charCode * 0.05;
  }

  // Add category specific keywords to group articles semantically even in mock mode
  if (text.match(/charge|billing|invoice|refund|payment|price/i)) {
    vector[10] += 5.0;
    vector[20] += 5.0;
  }
  if (text.match(/error|bug|crash|fail|slow|not working|blank|black|display/i)) {
    vector[50] += 5.0;
    vector[60] += 5.0;
  }
  if (text.match(/feature|request|suggest|idea|improve|upgrade|custom/i)) {
    vector[100] += 5.0;
    vector[110] += 5.0;
  }

  // Normalize the vector
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(v => (norm === 0 ? 0 : v / norm));
}

// Helper: Local basic classifier fallback
export function triageLocalMock(text) {
  const content = text.toLowerCase();
  
  let category = 'Technical';
  if (content.match(/charge|refund|bill|invoice|payment|price|fee/i)) {
    category = 'Billing';
  } else if (content.match(/feature|suggest|request|idea|improve|want/i)) {
    category = 'Feature Request';
  }

  let sentiment = 'Neutral';
  if (content.match(/angry|terrible|worst|hate|disappointed|frustrated|scam|refund now/i)) {
    sentiment = 'Angry';
  } else if (content.match(/bad|fail|poor|error|issue|problem|broken/i)) {
    sentiment = 'Negative';
  } else if (content.match(/thank|good|great|awesome|love|perfect|fixed/i)) {
    sentiment = 'Positive';
  }

  let priority = 'Medium';
  if (sentiment === 'Angry' || content.match(/urgent|asap|critical|broken|crash|leak|charge twice/i)) {
    priority = 'High';
  } else if (category === 'Feature Request') {
    priority = 'Low';
  }

  return { sentiment, priority, category };
}

// 1. Ticket Triage & Classification
export async function triageTicket(text) {
  if (!genAI) {
    const mock = triageLocalMock(text);
    return { priority: mock.priority, category: mock.category };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert customer service AI. Analyze the following customer support ticket text and return a valid JSON object.
      Do not wrap the JSON in markdown blocks or return any additional text. Return strictly valid JSON in the following format only:
      
      {
        "priority": "High" | "Medium" | "Low",
        "category": "Billing" | "Technical" | "Feature Request"
      }
      
      Ticket Text: "${text.replace(/"/g, '\\"')}"
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = result.response.text().trim();
    const parsed = JSON.parse(responseText);
    return {
      priority: parsed.priority || 'Medium',
      category: parsed.category || 'Technical'
    };
  } catch (error) {
    console.error('Gemini triage error, falling back to mock classifier:', error);
    const mock = triageLocalMock(text);
    return { priority: mock.priority, category: mock.category };
  }
}

// 2. Vector Embedding Generation
export async function getEmbedding(text) {
  if (!genAI) {
    return generateMockEmbedding(text);
  }

  try {
    // text-embedding-004 is the recommended embedding model
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    if (result.embedding && result.embedding.values) {
      return result.embedding.values;
    }
    return generateMockEmbedding(text);
  } catch (error) {
    console.error('Gemini embedding error, falling back to mock embedding:', error);
    return generateMockEmbedding(text);
  }
}

// 3. RAG Reply Generator
export async function generateDraftResponse(complaint, kbArticles) {
  const articlesContext = kbArticles.length > 0 
    ? kbArticles.map((art, idx) => `[KB Article #${idx + 1} - ${art.title}]:\n${art.content}`).join('\n\n')
    : 'No relevant Knowledge Base articles found.';

  if (!genAI) {
    if (kbArticles.length === 0) {
      return `Hi there,\n\nThank you for reaching out to us. We appreciate you taking the time to report this. Currently, our retrieved knowledge base articles are insufficient to resolve this issue automatically, and additional manual review is required by our team.\n\nBest regards,\nSmartSupport Customer Care`;
    }
    const kbReference = `Referring to: "${kbArticles[0].title}".`;
    return `Hi there,\n\nThank you for reaching out to us. We appreciate you taking the time to report this. \n\n[Local AI Draft Fallback]: Regarding your inquiry, our records suggest standard procedures apply. ${kbReference}\n\nWe have escalated this issue under the appropriate category. Please let us know if you need anything else.\n\nBest regards,\nSmartSupport Customer Care`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an elite customer support representative.
      Your task is to draft a polite and professional customer support response to the customer's complaint using ONLY the retrieved Knowledge Base (KB) context.
      
      Customer Complaint:
      "${complaint}"
      
      Retrieved Context:
      ${articlesContext}
      
      Instructions:
      - Draft a professional and polite customer support response using ONLY the retrieved context.
      - If the retrieved context is insufficient to answer the complaint, politely state that additional manual review is required. Do not make up facts or assumptions.
      - Address the customer politely (e.g. "Hi there," or "Dear Customer,").
      - Sign off as "SmartSupport Customer Care".
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini reply draft error, returning fallback response:', error);
    return `Hi there,\n\nThank you for contacting customer support. We are looking into your request regarding "${complaint.substring(0, 40)}...". Currently, additional manual review is required.\n\nBest regards,\nSmartSupport Customer Care`;
  }
}

// 4. Thread Summarizer & Handoff Notes
export async function generateHandoffSummary(messages) {
  if (messages.length === 0) return 'No conversation history.';

  // Format messages into a chat log
  const chatLog = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');

  if (!genAI) {
    const lastUserMsg = messages.filter(m => m.sender === 'customer').pop();
    const messageCount = messages.length;
    return `[Local Summary Fallback] Ticket has ${messageCount} message(s). The last issue reported was: "${lastUserMsg ? lastUserMsg.text : 'none'}". Waiting for support team triage.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are a support lead summarizing tickets for handoff between shifts.
      Read this conversation log and generate a concise summary (max 3 bullet points, under 80 words total).
      Focus on:
      1. What the customer's primary problem is.
      2. What actions have already been taken.
      3. What the next pending step is.
      
      Conversation Log:
      ${chatLog}
      
      Summary Output:
      `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini summarization error, returning fallback:', error);
    const lastMsg = messages[messages.length - 1];
    return `Summarization error. Last state: ticket has ${messages.length} message(s). Last message: "${lastMsg.text.substring(0, 50)}..." by ${lastMsg.sender}.`;
  }
}

// 5. Language Detection
export async function detectLanguage(text) {
  if (!text || text.trim().length === 0) return 'English';
  if (!genAI) {
    const cleaned = text.toLowerCase().trim();
    if (cleaned.match(/\b(hola|gracias|favor|cobro|cuenta|contraseña|problema|ayuda)\b/i)) return 'Spanish';
    if (cleaned.match(/\b(bonjour|merci|compte|mot de passe|facture|aide|problème)\b/i)) return 'French';
    if (cleaned.match(/\b(hallo|danke|konto|passwort|rechnung|hilfe|problem)\b/i)) return 'German';
    return 'English';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are a language detection tool. Detect the primary language of the following customer support text.
      Return ONLY the language name as a single word (e.g., "English", "Spanish", "French", "German", "Portuguese", etc.).
      Do not include markdown tags, formatting, notes, or extra characters.
      
      Text: "${text.replace(/"/g, '\\"')}"
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Language detection error, defaulting to English:', error);
    return 'English';
  }
}

// 6. Language Translation
export async function translateText(text, targetLanguage) {
  if (!text || !targetLanguage || targetLanguage.toLowerCase() === 'english' && !text.match(/[^\x00-\x7F]/)) {
    return text; // Skip if empty, or target is English and text is basic ASCII
  }
  if (!genAI) {
    // Simple local prefix translation mock
    return `[Mock ${targetLanguage} Translation of]: ${text}`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert real-time customer support translator.
      Translate the following customer support message/ticket details into ${targetLanguage}.
      Ensure that key terminology remains correct, professional, and clear.
      Return ONLY the translated text. Do not add any conversational wrappers, explanation notes, or quotes.
      
      Text to translate:
      "${text.replace(/"/g, '\\"')}"
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error(`Translation to ${targetLanguage} failed:`, error);
    return text;
  }
}

// 7. Auto-Close Detection
export async function checkAutoClose(text) {
  if (!text || text.trim().length === 0) return false;
  if (!genAI) {
    const cleaned = text.toLowerCase().trim();
    // Check if it's just appreciation/thank you
    return cleaned.match(/^(thank you|thanks|gracias|merci|appreciate it|awesome job|great support|no issues|thank you very much|everything is fine|solved|resolved|closed)\.?$/i) !== null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      Analyze the customer support text. Determine if this text is solely expressing appreciation, saying "thank you", or providing a general positive feedback note, without introducing any active issues, requests, or questions that require a reply.
      Return strictly "true" if it is just a positive sign-off or thanks that can be closed, or "false" if there is an active problem or question requiring manual response.
      Return ONLY the word "true" or "false". Do not add punctuation or extra text.
      
      Text: "${text.replace(/"/g, '\\"')}"
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().trim().toLowerCase() === 'true';
  } catch (error) {
    console.error('Auto-close detection failed:', error);
    return false;
  }
}
