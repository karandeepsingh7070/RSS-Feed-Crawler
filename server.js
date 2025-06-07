const express = require("express");
const { crawlSite } = require("./index.js")

const app = express();
const PORT = 8000;

const cache = new Map();


app.get("/extract", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing ?url parameter" });

    if (cache.has(url)) {
        if (cache.get(url).scanType === scanType) {
            return res.json({ fromCache: true, ...cache.get(url).data })
        }
    }

    try {
        const scanType = req.query.scanType || "brief"
        const data = await crawlSite(url, scanType);
        cache.set(url, { data, scanType });
        res.json({ fromCache: false, ...data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to extract content" });
    }
});



app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
