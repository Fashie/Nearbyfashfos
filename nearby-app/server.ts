import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase payload limit to handle photos
app.use(express.json({ limit: "15mb" }));

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY environment variable is not defined or is placeholder. Using simulated mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API for Snapchat's My AI Chatbot integration
app.post("/api/my-ai/chat", async (req, res) => {
  try {
    const { prompt, image, chatHistory } = req.body;
    const client = getGeminiClient();

    if (!client) {
      // Elegant simulated fallback so the app remains 100% interactive without API secrets
      let simulatedResponse = "";
      if (image) {
        simulatedResponse = "Whoa, that's a sharp snap! 📸✨ I love your custom filters! Let's make some more designs together in Yaba/Lekki. (PS: Add a real Gemini API Key in 'Secrets' to unlock full AI vision and chat!)";
      } else {
        const text = (prompt || "").toLowerCase();
        if (text.includes("hello") || text.includes("hi") || text.includes("how far")) {
          simulatedResponse = "How far my neighbor! 🇳🇬 How are you doing today? Hope no wahala? Ready to connect with neighbors around you? ✨";
        } else if (text.includes("map") || text.includes("where") || text.includes("radar")) {
          simulatedResponse = "I'm currently hanging around the Yaba Tech-Grid! 🇳🇬 Near the delicious Jollof canteen. Check our Nearby Radar to see specifically where people are!";
        } else if (text.includes("suya") || text.includes("spot") || text.includes("food")) {
          simulatedResponse = "Ah, if you want the best hot spicy Suya in Yaba, check out the joints by Tejuosho or Herbert Macaulay way! They grill the perfect spot-on meat 🥩🔥";
        } else {
          simulatedResponse = "That's super cool, pure vibes! 👻 Tell me more, or send a snap using the Camera! (To make me fully intelligent, link your Gemini API key in 'Secrets' panel!)";
        }
      }
      return res.json({ response: simulatedResponse });
    }

    // Build parts for Gemini API call
    const parts: any[] = [];
    if (image) {
      let mimeType = "image/jpeg";
      let base64Data = image;
      if (image.startsWith("data:")) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
    }

    // Chat history conversion or final text prompt
    const contextPrompt = prompt || "Hey! Comment on my snap!";
    parts.push({ text: contextPrompt });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: parts,
      config: {
        systemInstruction: "You are 'Nearby AI', a friendly and street-smart virtual guide and companion for Nigerians (especially in Lagos and Abuja!). Speak in an approachable, supportive, and cool young adult tone. Use popular Nigerian English / pidgin words naturally but clearly (e.g. 'How far', 'No wahala', 'Abeg', 'Sharp', 'Vibe', 'Gist'). Suggest cool neighborhood spots like Yaba Tech-Grid, Lekki Admiralty, Ikeja Isaac John, and Wuse II. Use emojis like ✨, 🇳🇬, 🍛, 👻, 🔥, 📸. Keep replies very brief (1-3 sentences max).",
        temperature: 0.9,
      }
    });

    res.json({ response: response.text || "Love that! Keep 'em coming! 👻✨" });
  } catch (error: any) {
    console.error("Gemini API Error in /api/my-ai/chat:", error);
    res.status(500).json({
      error: "Could not fetch AI reply",
      response: "Oops, My AI is feeling a bit dizzy right now! 😵 Let's try sending that again!"
    });
  }
});

// Premium AI Icebreaker Assistant API
app.post("/api/ai-icebreaker", async (req, res) => {
  try {
    const { userProfile, neighborProfile } = req.body;
    
    // Extrapolate shared info
    const interests1: string[] = userProfile?.interests || [];
    const interests2: string[] = neighborProfile?.interests || [];
    const mutualInterests = interests1.filter(val => interests2.map(i => i.toLowerCase()).includes(val.toLowerCase()));
    
    const client = getGeminiClient();
    if (!client) {
      // Dynamic fallback starters in local Pidgin & English
      const starters = [
        `How far ${neighborProfile?.name || 'neighbor'}! 🇳🇬 I noticed we both reside around ${neighborProfile?.streetName || 'the neighborhood'}. Hope no wahala?`,
      ];
      
      if (mutualInterests.length > 0) {
        starters.push(`Ah! I noticed we both share a love for ${mutualInterests[0]}! 🍛 How did you get into that?`);
      } else if (interests2.length > 0) {
        starters.push(`I noticed you're interested in ${interests2[0]}! agriculture? Let's connect and discuss it! ✨`);
      }
      
      // Hobbies specific fallback
      if (interests2.join(" ").toLowerCase().includes("hike") || interests2.join(" ").toLowerCase().includes("hiking")) {
        starters.push("You enjoy hiking? Me too! What's your favorite trail around here? 🌲");
      } else if (interests2.join(" ").toLowerCase().includes("farm") || interests2.join(" ").toLowerCase().includes("agri") || interests2.join(" ").toLowerCase().includes("agriculture")) {
        starters.push("I noticed you're interested in agriculture. Let's chat on local agro-practices! 🌾");
      } else {
        starters.push("We also share mutual proximity! Have you been to the local physical neighborhood events recently? 🎪");
      }
      
      return res.json({ starters: starters.slice(0, 3) });
    }
    
    // Ask Gemini for extremely fun Pidgin/street-smart starters
    const promptText = `Generate exactly 3 extremely creative, highly localized, friendly conversation starters/icebreakers in young adult Nigerian pidgin or colloquial English style.
User 1 (Me) Profile: Name: ${userProfile?.name || 'User'}, Interests: ${interests1.join(', ') || 'No listed interests'}, Location: ${userProfile?.streetName || 'Adjacent block'}.
User 2 (Neighbor) Profile: Name: ${neighborProfile?.name || 'Neighbor'}, Interests: ${interests2.join(', ') || 'Discoverable'}, Location: ${neighborProfile?.streetName || 'Adjacent block'}.
Our shared mutual interests: ${mutualInterests.join(', ') || 'None yet, but they are physical neighbors'}.
Shared communities suggestions: ${neighborProfile?.streetName ? 'Lover of local food spots and tech hangouts' : 'Naija Social Grid'}.

Formatting constraints: Return them as a JSON array of strings ONLY. No markdown, no other words. Example output: ["starter 1", "starter 2", "starter 3"]`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: promptText }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.85,
      }
    });
    
    let resultStarters: string[] = [];
    try {
      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed)) {
        resultStarters = parsed;
      }
    } catch (parseError) {
      console.warn("Could not parse JSON response from Gemini for icebreakers. Fallback.", response.text);
    }
    
    if (resultStarters.length === 0) {
      resultStarters = [
        `How far ${neighborProfile?.name || 'neighbor'}! I saw your grid pin. We both live around ${neighborProfile?.streetName || 'here'}, let's chat! 🇳🇬`,
        interests2.length > 0 ? `I saw we both are huge fans of ${interests2[0] || 'sports'}! Hope no wahala? Let's talk vibes! ✨` : `How's Bodija/Lekki treatin' you today? 🍛`,
        `Hope you're having a smooth week! Let's connect and catch up!`
      ];
    }
    
    res.json({ starters: resultStarters });
  } catch (err: any) {
    console.error("Icebreaker generate error:", err);
    res.status(500).json({ starters: ["How far! Let's connect and chat!", "Hey! I saw your profile pin, how are you?"] });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Snapchat Web Server] Server running on http://localhost:${PORT}`);
  });
}

startServer();
