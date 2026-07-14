import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function testEmbedding(modelName) {
  try {
    console.log(`\n--- Testing Embedding with model: ${modelName} ---`);
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.embedContent({
      model: modelName,
      contents: 'Hello world',
    });
    const values = response.embedding ? response.embedding.values : (response.embeddings && response.embeddings[0] ? response.embeddings[0].values : null);
    if (values) {
      console.log('Success! Embedding length:', values.length);
    } else {
      console.log('Failed! Response structure:', JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.error(`Error with ${modelName}:`, error.message || error);
  }
}

async function main() {
  await testEmbedding('text-embedding-004');
  await testEmbedding('gemini-embedding-001');
}

main();
