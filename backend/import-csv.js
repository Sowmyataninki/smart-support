import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config();

// MONGODB_URI connection
const uri = process.env.MONGODB_URI;

let csvFilePath = path.resolve('data/customer_support_tickets_200k.csv');
if (!fs.existsSync(csvFilePath)) {
  csvFilePath = path.resolve('../customer_support_tickets_200k.csv');
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`Error: CSV file not found. Checked 'data/customer_support_tickets_200k.csv' and '../customer_support_tickets_200k.csv'`);
  process.exit(1);
}

// Parse Command-line arguments
const args = process.argv.slice(2);
let limit = 1000;
let clearCollection = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit') {
    const val = parseInt(args[i + 1], 10);
    if (!isNaN(val)) {
      limit = val;
      i++;
    }
  } else if (args[i] === '--all') {
    limit = Infinity;
  } else if (args[i] === '--clear') {
    clearCollection = true;
  }
}

console.log(`Starting CSV import process...`);
console.log(`Configured Limit: ${limit === Infinity ? 'ALL' : limit} tickets`);
console.log(`Clear Collection: ${clearCollection}`);

// Ticket Schema matching db.js
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
    assignee: { type: String, default: '' }
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', TicketSchema);

// Mappings for Schema Compatibility
function mapCategory(csvCategory) {
  const cat = csvCategory ? csvCategory.trim() : '';
  if (['Account Suspension', 'Subscription Cancellation', 'Payment Problem', 'Refund Request'].includes(cat)) {
    return 'Billing';
  }
  if (['Performance Issue', 'Security Concern', 'Login Issue', 'Bug Report', 'Data Sync Issue'].includes(cat)) {
    return 'Technical';
  }
  if (cat === 'Feature Request') {
    return 'Feature Request';
  }
  return 'Technical'; // Fallback
}

function mapPriority(csvPriority) {
  const prio = csvPriority ? csvPriority.trim() : '';
  if (prio === 'Urgent' || prio === 'High') {
    return 'High';
  }
  if (prio === 'Medium') {
    return 'Medium';
  }
  if (prio === 'Low') {
    return 'Low';
  }
  return 'Medium'; // Fallback
}

function mapStatus(csvStatus) {
  const stat = csvStatus ? csvStatus.trim() : '';
  if (stat === 'Closed' || stat === 'Resolved') {
    return 'Resolved';
  }
  if (stat === 'In Progress' || stat === 'Pending Customer') {
    return 'In Progress';
  }
  if (stat === 'Open') {
    return 'Open';
  }
  return 'Open'; // Fallback
}

// Local File Database Helpers
const DATA_DIR = path.resolve('data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function readLocalDb() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { tickets: [], articles: [] };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('Error reading local DB file, resetting:', e);
    return { tickets: [], articles: [] };
  }
}

function writeLocalDb(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing local DB file:', e);
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function run() {
  let useMongo = !!uri;
  if (useMongo) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(uri);
      console.log('Successfully connected to MongoDB Atlas.');
    } catch (err) {
      console.warn('MongoDB Atlas connection failed:', err);
      console.warn('Falling back to local JSON database.');
      useMongo = false;
    }
  } else {
    console.log('No MONGODB_URI found. Running in LOCAL database mode.');
  }

  if (clearCollection) {
    if (useMongo) {
      console.log('Clearing existing tickets from MongoDB...');
      const deleteResult = await Ticket.deleteMany({});
      console.log(`Deleted ${deleteResult.deletedCount} tickets.`);
    } else {
      console.log('Clearing existing tickets from local db.json...');
      const localData = readLocalDb();
      localData.tickets = [];
      writeLocalDb(localData);
    }
  }

  const BATCH_SIZE = 500;
  let batch = [];
  let count = 0;
  let insertedCount = 0;

  const stream = fs.createReadStream(csvFilePath).pipe(csv());
  console.log('Reading and parsing CSV...');

  for await (const row of stream) {
    if (count >= limit) {
      break;
    }

    // Construct a meaningful title
    const title = `${row.category} Ticket #${row.ticket_id} (${row.product})`;
    const status = mapStatus(row.status);
    const priority = mapPriority(row.priority);
    const category = mapCategory(row.category);
    const description = row.issue_description || 'No description provided.';
    
    const createdDate = row.ticket_created_date ? new Date(row.ticket_created_date) : new Date();
    const resolvedDate = row.ticket_resolved_date ? new Date(row.ticket_resolved_date) : createdDate;

    // Construct conversation messages
    const messages = [
      {
        sender: 'customer',
        text: description,
        createdAt: createdDate,
      }
    ];

    // Add resolution message if closed/resolved
    if (status === 'Resolved') {
      messages.push({
        sender: 'agent',
        text: row.resolution_notes || 'Ticket resolved by support.',
        createdAt: resolvedDate,
      });
    }

    // Construct a professional automated summary
    const summary = `Customer ${row.customer_name} (${row.customer_email}) reported a ${row.category} issue on ${row.product} using ${row.operating_system}/${row.browser}. Channel: ${row.channel}.`;

    const assigneesList = ['Lakshmiyasya Sinisetti', 'Naresh Raja', 'Tummapati Tejaswi', ''];
    const assignee = assigneesList[Math.floor(Math.random() * assigneesList.length)];

    const ticketDoc = {
      title,
      description,
      status,
      priority,
      sentiment: 'Neutral',
      category,
      messages,
      summary,
      draftReply: '',
      embedding: [],
      resolvedNotes: status === 'Resolved' ? (row.resolution_notes || 'Ticket resolved.') : '',
      createdAt: createdDate,
      updatedAt: resolvedDate,
      language: 'English',
      englishTitle: title,
      englishDescription: description,
      suggestAutoClose: false,
      assignee
    };

    if (!useMongo) {
      ticketDoc._id = generateId();
      // Format dates as strings for local JSON file consistency
      ticketDoc.messages = ticketDoc.messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() }));
      ticketDoc.createdAt = ticketDoc.createdAt.toISOString();
      ticketDoc.updatedAt = ticketDoc.updatedAt.toISOString();
    }

    batch.push(ticketDoc);
    count++;

    if (batch.length >= BATCH_SIZE) {
      if (useMongo) {
        await Ticket.insertMany(batch);
      } else {
        const localData = readLocalDb();
        localData.tickets.push(...batch);
        writeLocalDb(localData);
      }
      insertedCount += batch.length;
      console.log(`Imported ${insertedCount} tickets...`);
      batch = [];
    }
  }

  // Insert remaining batch
  if (batch.length > 0) {
    if (useMongo) {
      await Ticket.insertMany(batch);
    } else {
      const localData = readLocalDb();
      localData.tickets.push(...batch);
      writeLocalDb(localData);
    }
    insertedCount += batch.length;
    console.log(`Imported ${insertedCount} tickets...`);
  }

  console.log(`\nImport complete! Successfully imported ${insertedCount} tickets.`);
  if (useMongo) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
  process.exit(0);
}

run();
