const express = require("express");
const { getEmbedding, cosineSimilarity } = require("./embedding.js");
const { crawlSite } = require("./index.js")

const app = express();
const PORT = 8000;

const cache = new Map();
const memoryStore = {}; // { url: [ { content, embedding } ] }
const dataWithEmbeddings = [];

app.get("/extract", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing ?url parameter" });

    if (cache.has(url)) {
        // if (cache.get(url).scanType === scanType) {
            return res.json({ fromCache: true, ...cache.get(url) })
        // }
    }
    try {
        const scanType = req.query.scanType || "brief"
        const data = await crawlSite(url, scanType);
        cache.set(url, { data, scanType });

        let dataContent = data?.map((_) => _.content).flat()
        for (const section of dataContent) {
          const text = `${section.sectionTitle} ${section.sectionSummary}`;
          const embedding = await getEmbedding(text);
          if (embedding) {
            dataWithEmbeddings.push({ ...section, embedding });
          }
        }
        memoryStore[url] = dataWithEmbeddings;

        res.json({ fromCache: false, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to extract content" });
    }
});
  
    app.get('/search', async (req, res) => {
    const query = req.query.query;
    if (!query) return res.status(400).json({ error: 'Query is missing' });
  
    const queryEmbedding = await getEmbedding(query); // user query embedding
  
    const scoredResults = dataWithEmbeddings.map((item) => {
      const similarity = cosineSimilarity(queryEmbedding, item.embedding);
      return { ...item, similarity };
    });
  
    const topMatches = scoredResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5); // return top 5 matches
  
    res.json(topMatches);
  });



app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
