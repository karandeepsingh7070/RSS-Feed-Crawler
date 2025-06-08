
let embedder = null;


async function initEmbeddingModel() {
  if (!embedder) {
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
}

function cosineSimilarity(vec1, vec2) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vec1.length; i++) {
    dot += vec1[i] * vec2[i];
    normA += vec1[i] ** 2;
    normB += vec2[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}


async function getEmbedding(text) {
  await initEmbeddingModel();

  const output = await embedder(text, {
    pooling: 'mean',
    normalize: true
  });

  return output.data; // embedding vector
}



// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// async function getEmbedding(text) {
//     try {
//       const response = await openai.embeddings.create({
//         model: 'text-embedding-3-small',
//         input: text,
//       });
  
//       return response.data[0].embedding;
//     } catch (err) {
//       console.error('Embedding error:', err.message);
//       return null;
//     }
//   }

  module.exports = { getEmbedding, cosineSimilarity };