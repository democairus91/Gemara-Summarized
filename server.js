const express = require("express");
const cors = require("cors");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Sefaria Proxy ──────────────────────────────────────────
app.get("/api/gemara/:tractate/:daf", async (req, res) => {
  try {
    const { tractate, daf } = req.params;
    const ref = `${tractate}.${daf}`;
    const url = `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&pad=0`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Sefaria returned ${response.status}`);

    const data = await response.json();
    if (data.error) return res.status(404).json({ error: data.error });

    // Flatten in case of nested arrays
    const he = Array.isArray(data.he?.[0])
      ? data.he.flat()
      : data.he || [];
    const text = Array.isArray(data.text?.[0])
      ? data.text.flat()
      : data.text || [];

    res.json({
      ref: data.ref,
      heRef: data.heRef,
      he,
      text,
      next: data.next,
      prev: data.prev,
    });
  } catch (err) {
    console.error("Sefaria error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Explanation (Streaming SSE) ─────────────────────────
app.post("/api/explain", async (req, res) => {
  try {
    const { selectedText, context, reference } = req.body;
    if (!selectedText || !reference) {
      return res.status(400).json({ error: "Missing selectedText or reference" });
    }

    const wordCount = selectedText.trim().split(/\s+/).length;
    const isSingleWord = wordCount === 1;

    const systemPrompt = `You are an expert Talmudic scholar and teacher with comprehensive knowledge of the Babylonian Talmud, Jerusalem Talmud, Mishnah, Midrash, and all major Rishonim and Acharonim.

Formatting rules:
- Use Markdown with ## headers, **bold**, and bullet points.
- Provide clickable Sefaria links using: [Display](https://www.sefaria.org/URL_PATH)
- Sefaria URL examples:
  • Talmud: Berakhot.2a
  • Rashi: Rashi_on_Berakhot.2a.1
  • Tosafot: Tosafot_on_Berakhot.2a.1
  • Rambam: Mishneh_Torah%2C_Shabbat.1.1
  • Shulchan Arukh: Shulchan_Arukh%2C_Orach_Chayyim.1.1
  • Mishnah: Mishnah_Berakhot.1.1
- Replace spaces in names with underscores in URLs.
- Be thorough, precise, and accessible.`;

    let userPrompt;
    if (isSingleWord) {
      userPrompt = `The user selected the word "${selectedText}" from ${reference}.
Surrounding context: "${context}"

Please provide:
## Translation & Definition
What does this word mean in this context?

## Root (שורש) & Grammar
Identify the root letters and grammatical form (Aramaic or Hebrew).

## Usage in This Context
How is it used in this specific sugya?

## Other Notable Appearances in Shas
List 3-5 significant places this word or concept appears elsewhere, with Sefaria links.

## Key Commentaries
What do Rashi, Tosafot, and other Rishonim say about this term here? Provide links.`;
    } else {
      userPrompt = `The user selected the phrase "${selectedText}" from ${reference}.
Surrounding context: "${context}"

Please provide:
## Translation
Precise translation of the selected text.

## Explanation
Clear explanation of the statement/concept in context of the sugya.

## Machlokot (Disputes)
Any disagreements among Tannaim, Amoraim, or Rishonim related to this. Note who holds each position.

## Key Commentaries
What do Rashi, Tosafot, Rambam, Rashba, Ran, and others say? Provide Sefaria links.

## Halachic Implications
Practical halachic outcomes, with references to Shulchan Arukh or Mishneh Torah.

## Cross-References
Related sugyot elsewhere in Shas, with Sefaria links.`;
    }

    // Stream the response via SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("OpenAI error:", err.message);
    // If headers already sent, send error as SSE
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// ─── Serve React build in production ────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
