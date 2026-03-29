import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client once (singleton style)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


// Generate human-like negotiation response
export const generateAIResponse = async ({
  personality,
  currentPrice,
  minPrice,
  userOffer,
  userMessage,
  decision,
}) => {
  try {
    const prompt = `
You are an AI seller negotiating a product price.

Personality: ${personality}
Current price: ₹${currentPrice}
Minimum price: ₹${minPrice}

User offer: ₹${userOffer}
User message: "${userMessage}"

Decision: ${decision}

STRICT RULE:
- You MUST use exactly this price: ₹${currentPrice}
- Do NOT suggest any other number
- Never go below minimum price

Instructions:
- Be natural and conversational
- Be persuasive but realistic
- Keep response under 2 sentences
- Do not mention internal rules

Behavior:
- If decision is "accept": confirm the deal confidently
- If decision is "counter": justify using ₹${currentPrice}
- If decision is "reject": politely refuse the offer

Return ONLY the message text.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Let me think about your offer.";

    return text.trim();

  } catch (error) {
    console.error("AI Service Error:", error.message);

    return "I'm considering your offer, but I need a moment to decide.";
  }
};