import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const useMongo = !!process.env.MONGODB_URI;

// --- Local File Database Implementation ---
const DATA_DIR = path.resolve('data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ tickets: [], articles: [] }, null, 2)
  );
}

function readLocalDb() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('Error reading local DB file, resetting:', e);
    return { tickets: [], articles: [] };
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing local DB file:', e);
  }
}

// Helper to generate unique string ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// --- Mongoose Setup (If MONGODB_URI is provided) ---
let TicketModel;
let ArticleModel;
let UserModel;

if (useMongo) {
  console.log('Connecting to MongoDB Atlas...');
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB Atlas.'))
    .catch((err) => {
      console.error('MongoDB connection error, falling back to local database:', err);
      // We will set useMongo to false internally if connection fails
    });

  const TicketSchema = new mongoose.Schema(
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
      priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
      sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative', 'Angry'], default: 'Neutral' },
      category: { type: String, enum: ['Billing', 'Technical', 'Feature Request'], default: 'Technical' },
      messages: [
        {
          sender: { type: String, enum: ['customer', 'agent', 'ai'], required: true },
          text: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      summary: { type: String, default: '' },
      draftReply: { type: String, default: '' },
      embedding: { type: [Number], default: [] },
      resolvedNotes: { type: String, default: '' },
      language: { type: String, default: 'English' },
      englishTitle: { type: String, default: '' },
      englishDescription: { type: String, default: '' },
      suggestAutoClose: { type: Boolean, default: false },
      assignee: { type: String, default: '' },
    },
    { timestamps: true }
  );

  const ArticleSchema = new mongoose.Schema(
    {
      title: { type: String, required: true },
      content: { type: String, required: true },
      category: { type: String, enum: ['Billing', 'Technical', 'Feature Request'], required: true },
      embedding: { type: [Number], default: [] },
    },
    { timestamps: true }
  );

  TicketModel = mongoose.model('Ticket', TicketSchema);
  ArticleModel = mongoose.model('Article', ArticleSchema);

  const UserSchema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
    },
    { timestamps: true }
  );

  UserModel = mongoose.model('User', UserSchema);
} else {
  console.log('No MONGODB_URI provided. Running in LOCAL database mode (data/db.json).');
}

// --- Unified Repository API ---
export const db = {
  tickets: {
    find: async (filter = {}) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return TicketModel.find(filter).sort({ updatedAt: -1 });
      }
      const data = readLocalDb();
      let results = data.tickets;
      
      // Basic filtering support
      if (filter.status) {
        results = results.filter(t => t.status === filter.status);
      }
      if (filter.priority) {
        results = results.filter(t => t.priority === filter.priority);
      }
      if (filter.category) {
        results = results.filter(t => t.category === filter.category);
      }
      
      return results.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    },

    findById: async (id) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return TicketModel.findById(id);
      }
      const data = readLocalDb();
      const ticket = data.tickets.find((t) => t._id === id);
      return ticket || null;
    },

    create: async (ticketData) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        const ticket = new TicketModel(ticketData);
        return ticket.save();
      }
      const data = readLocalDb();
      const newTicket = {
        _id: generateId(),
        status: 'Open',
        priority: 'Medium',
        sentiment: 'Neutral',
        category: 'Technical',
        messages: [],
        summary: '',
        draftReply: '',
        embedding: [],
        resolvedNotes: '',
        language: 'English',
        englishTitle: '',
        englishDescription: '',
        suggestAutoClose: false,
        assignee: '',
        ...ticketData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // If messages has no items, add initial description as customer message
      if (newTicket.messages.length === 0) {
        newTicket.messages.push({
          sender: 'customer',
          text: newTicket.description,
          createdAt: new Date().toISOString(),
        });
      }

      data.tickets.push(newTicket);
      writeLocalDb(data);
      return newTicket;
    },

    findByIdAndUpdate: async (id, update, options = {}) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return TicketModel.findByIdAndUpdate(id, update, { new: true, ...options });
      }
      const data = readLocalDb();
      const index = data.tickets.findIndex((t) => t._id === id);
      if (index === -1) return null;

      const updated = {
        ...data.tickets[index],
        ...update,
        updatedAt: new Date().toISOString(),
      };

      // Handle special field update syntax if any (like MongoDB's $push)
      if (update.$push) {
        for (const [key, value] of Object.entries(update.$push)) {
          if (Array.isArray(updated[key])) {
            // value can be an object or a single item
            if (value.sender) {
              updated[key].push({
                ...value,
                createdAt: value.createdAt || new Date().toISOString(),
              });
            } else {
              updated[key].push(value);
            }
          }
        }
        delete updated.$push;
      }

      data.tickets[index] = updated;
      writeLocalDb(data);
      return updated;
    },
  },

  articles: {
    find: async (filter = {}) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return ArticleModel.find(filter);
      }
      const data = readLocalDb();
      let results = data.articles;
      if (filter.category) {
        results = results.filter(a => a.category === filter.category);
      }
      return results;
    },

    create: async (articleData) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        const article = new ArticleModel(articleData);
        return article.save();
      }
      const data = readLocalDb();
      const newArticle = {
        _id: generateId(),
        embedding: [],
        ...articleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.articles.push(newArticle);
      writeLocalDb(data);
      return newArticle;
    },

    insertMany: async (articlesList) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return ArticleModel.insertMany(articlesList);
      }
      const data = readLocalDb();
      const saved = [];
      for (const item of articlesList) {
        const newArticle = {
          _id: generateId(),
          embedding: [],
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        data.articles.push(newArticle);
        saved.push(newArticle);
      }
      writeLocalDb(data);
      return saved;
    },

    countDocuments: async () => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return ArticleModel.countDocuments();
      }
      const data = readLocalDb();
      return data.articles.length;
    },

    findById: async (id) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return ArticleModel.findById(id);
      }
      const data = readLocalDb();
      return data.articles.find((a) => a._id === id) || null;
    },

    findByIdAndUpdate: async (id, update) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return ArticleModel.findByIdAndUpdate(id, update, { new: true });
      }
      const data = readLocalDb();
      const index = data.articles.findIndex((a) => a._id === id);
      if (index === -1) return null;
      const updated = {
        ...data.articles[index],
        ...update,
        updatedAt: new Date().toISOString()
      };
      data.articles[index] = updated;
      writeLocalDb(data);
      return updated;
    },

    findByIdAndDelete: async (id) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return ArticleModel.findByIdAndDelete(id);
      }
      const data = readLocalDb();
      const index = data.articles.findIndex((a) => a._id === id);
      if (index === -1) return null;
      const deleted = data.articles.splice(index, 1)[0];
      writeLocalDb(data);
      return deleted;
    }
  },

  users: {
    find: async (filter = {}) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return UserModel.find(filter);
      }
      const data = readLocalDb();
      let results = data.users || [];
      if (filter.email) {
        results = results.filter(u => u.email === filter.email);
      }
      return results;
    },

    findOne: async (filter = {}) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        return UserModel.findOne(filter);
      }
      const data = readLocalDb();
      const users = data.users || [];
      if (filter.email) {
        const found = users.find(u => u.email === filter.email);
        return found || null;
      }
      return null;
    },

    create: async (userData) => {
      if (useMongo && mongoose.connection.readyState === 1) {
        const user = new UserModel(userData);
        return user.save();
      }
      const data = readLocalDb();
      if (!data.users) {
        data.users = [];
      }
      const newUser = {
        _id: generateId(),
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.users.push(newUser);
      writeLocalDb(data);
      return newUser;
    },
  },
};
