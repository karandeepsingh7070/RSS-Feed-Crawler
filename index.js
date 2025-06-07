const puppeteer = require('puppeteer');
const { URL } = require('url');

async function extractRSSAndContent(page, url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Step 1: Look for RSS feeds
    const rssLinks = await page.$$eval('link[rel="alternate"]', links =>
        links
            .filter(link => /rss|xml/.test(link.type))
            .map(link => link.href)
    );

    // Step 2: If no RSS, extract content
    const title = await page.title();
    // const body = await page.$eval('body', el => el.innerText); // limit for now
    let entries = [];

    // Step 2: Try extracting from <article> tags
    entries = await page.$$eval('article', articles => {
      return articles.map(article => {
        const sectionTitle = article.querySelector('h1, h2')?.innerText || "Section";
        const summary =
          article.querySelector('p')?.innerText ||
          article.innerText.slice(0, 500);
  
        return {
          sectionTitle,
          sectionSummary: summary
        };
      });
    });
  
    // Step 3: Fallback if no <article> found
    if (entries.length === 0) {
      entries = await page.$$eval('h1, h2, h3 p, a', elements => {
        const chunks = [];
        for (let i = 0; i < elements.length; i += 2) {
          chunks.push({
            sectionTitle: elements[i]?.innerText || 'Section',
            sectionSummary: elements[i + 1]?.innerText || ''
          });
        }
        return chunks;
      });
    }
  
    // Add page title to all entries
    entries = entries.map(entry => ({ pageTitle: title, ...entry }));

    return {
        url,
        title,
        rssLinks,
        content: entries
    };
}

async function getInternalLinks(page, baseUrl) {
    const base = new URL(baseUrl);

    const links = await page.$$eval('a[href]', (anchors, baseOrigin) => {
        return anchors
            .map(a => {
                try {
                    const url = new URL(a.getAttribute('href'), baseOrigin);
                    return url.href;
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean)
            .filter(link => link.startsWith(baseOrigin))
            .filter(link => !link.includes('#'));
    }, base.origin);

    return [...new Set(links)].slice(0, 2); // Limit to 10 pages max
}

async function crawlSite(startUrl) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const visited = new Set();
    const results = [];

    const toVisit = [startUrl];
    // convert into Queue
    while (toVisit.length > 0) {
        const current = toVisit.shift();
        if (visited.has(current)) continue;

        visited.add(current);

        try {
            const result = await extractRSSAndContent(page, current);
            results.push(result);

            const internalLinks = await getInternalLinks(page, startUrl);
            internalLinks.forEach(link => {
                if (!visited.has(link)) toVisit.push(link);
            });
        } catch (err) {
            console.warn(`Failed to scrape ${current}`, err.message);
        }
    }

    await browser.close();
    return results;
}

(async () => {
    const data = await crawlSite('https://www.nytimes.com/');
    console.log(JSON.stringify(data, null, 2));
})();