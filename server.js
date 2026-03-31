require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());

let groq;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function getLiveMarketPicks() {
    if (!groq) return null;
    try {
        console.log(`🤖 Scanning current market for a balanced portfolio...`);
        const prompt = `Act as an elite, real-time Indian FinTech algorithm. Based on current macroeconomic trends, suggest exactly 3 specific, actionable Indian investment assets.
        CRUCIAL RULE: You MUST provide a balanced portfolio:
        1. Exactly ONE "High" risk asset (e.g., Small Cap, Crypto, High-growth stock).
        2. Exactly ONE "Moderate" risk asset (e.g., Index Fund, Bluechip stock).
        3. Exactly ONE "Low" risk asset (e.g., Government Bond, Silver/Gold ETF, Fixed Deposit).
        
        You MUST return ONLY a valid JSON array. Do not include any conversational text, intro, or markdown formatting outside the JSON.
        Structure each object EXACTLY like this:
        [
          {
            "name": "Asset Name (e.g., Tata Motors or Nifty 50 ETF)",
            "type": "Asset Category",
            "risk": "High", // MUST be 'High', 'Moderate', or 'Low'
            "return_pct": 14.5,
            "desc": "One fun, punchy sentence explaining why this is a great buy right now, ending with an emoji."
          }
        ]`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", 
            temperature: 0.4, 
        });
        
        const rawJson = completion.choices[0]?.message?.content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(rawJson);
    } catch (err) {
        console.error("❌ Groq Live Market Picks Error:", err.message);
        return null; 
    }
}

async function getDynamicCatalog() {
    if (!groq) return null;
    try {
        console.log(`🛒 Generating full live market catalog...`);
        const prompt = `Act as an Indian FinTech AI. Generate a realistic, current market catalog with 3 categories: stocks, mutuals, and indexes. Provide exactly 5 top Indian market items per category based on current trends.
        Return ONLY a valid JSON object. No markdown, no intro.
        Format EXACTLY like this:
        {
          "stocks": [{ "name": "Asset Name", "roi": 14.5, "desc": "Short punchy description 🚀" }],
          "mutuals": [{ "name": "Fund Name", "roi": 12.0, "desc": "Short description 📈" }],
          "indexes": [{ "name": "Index Name", "roi": 10.5, "desc": "Short description 🛡️" }]
        }`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
        });

        const rawJson = completion.choices[0]?.message?.content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(rawJson);
    } catch (err) {
        console.error("❌ Groq Catalog Error:", err.message);
        return null;
    }
}

async function getMacroMarketAnalysis(assetNames) {
    if (!groq) return "ERROR: No GROQ_API_KEY found in .env file.";
    try {
        console.log(`🌍 Fetching Live Market Intelligence for: ${assetNames}`);
        const prompt = `Act as a cool, modern, and highly engaging FinTech AI advisor. 
        First, give a quick, punchy 1-sentence update on the current global market (mentioning geopolitics, inflation, or tech trends). 
        Then, use clear bullet points and emojis to explain EXACTLY why these 3 specific Indian assets (${assetNames}) create the perfect balanced portfolio right now. 
        Keep it energetic, concise, easy to read, and highly relevant. Don't use bold markdown (**), just use emojis for emphasis!`;
        
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", 
            temperature: 0.7,
        });
        
        return completion.choices[0]?.message?.content.replace(/\*\*/g, '').replace(/\n/g, '<br>').trim();
    } catch (err) {
        console.error("❌ Groq Macro Analysis Error:", err.message);
        return `Market Intelligence Feed Offline. Error: ${err.message}. Please check your terminal.`; 
    }
}

app.post('/api/mock/transactions', async (req, res) => {
  const { uploadedData, isCustomAdd, customName } = req.body; 
  const transactionsToAnalyze = uploadedData || [];

  let pythonVerdict = {
      allocation: { stocks: 60, bonds: 30, cash: 10 },
      ai_message: "Fallback neutral allocation.",
      debug_info: { expected_return: "6.50%" },
      recommendations: [] 
  };

  try {
      const response = await fetch('http://localhost:8000/api/engine/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: transactionsToAnalyze })
      });
      pythonVerdict = await response.json();
  } catch (error) {
      console.error("❌ Failed to reach Python Optimizer. Is main.py running on port 8000?");
  }

  // 🚀 THE FIX: Dynamic Matrix Override for Hackathon Visuals!
  // This calculates the live health score so the UI chart SPINS every time you simulate an expense
  let totalIncome = 0;
  let totalExpense = 0;
  transactionsToAnalyze.forEach(tx => {
      if (tx.amount > 0) totalIncome += tx.amount;
      else totalExpense += Math.abs(tx.amount);
  });
  
  let savingsRatio = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) : -1;

  if (savingsRatio >= 0.4) {
      pythonVerdict.allocation = { stocks: 75, bonds: 15, cash: 10 }; // Very Healthy -> Aggressive
  } else if (savingsRatio >= 0.2) {
      pythonVerdict.allocation = { stocks: 55, bonds: 30, cash: 15 }; // Okay -> Moderate
  } else if (savingsRatio >= 0) {
      pythonVerdict.allocation = { stocks: 35, bonds: 45, cash: 20 }; // Tight -> Conservative
  } else {
      pythonVerdict.allocation = { stocks: 15, bonds: 50, cash: 35 }; // Negative Balance -> Panic/Cash heavy
  }

  let macroAnalysisText = "Market Intelligence Feed Offline.";
  let dynamicRecommendations = [];
  let dynamicCatalog = null;

  if (groq) {
      const [livePicks, catalogData] = await Promise.all([
          getLiveMarketPicks(),
          getDynamicCatalog()
      ]);
      
      dynamicCatalog = catalogData;

      if (livePicks && Array.isArray(livePicks)) {
          dynamicRecommendations = livePicks.map(pick => ({ ...pick, rationale: pick.desc }));
          const dynamicAssetNames = dynamicRecommendations.map(r => r.name).join(', ');
          macroAnalysisText = await getMacroMarketAnalysis(dynamicAssetNames);
      } else {
          macroAnalysisText = await getMacroMarketAnalysis("Small Cap Funds, Nifty 50, and Government Bonds");
          dynamicRecommendations = pythonVerdict.recommendations; 
      }
  }

  if (!dynamicCatalog || !dynamicCatalog.stocks) {
      dynamicCatalog = {
          stocks: [{ name: "Reliance Ind", roi: 18.5, desc: "Backup Data 🏭" }],
          mutuals: [{ name: "Quant Small Cap", roi: 25.4, desc: "Backup Data 🔥" }],
          indexes: [{ name: "Nifty 50 Index", roi: 12.5, desc: "Backup Data 📈" }]
      };
  }

  res.json({
    message: isCustomAdd ? `Added custom transaction: ${customName}` : `Analyzed statement`,
    transactions: transactionsToAnalyze,
    allocation: pythonVerdict.allocation, // Sends the new dynamic matrix!
    ai_message: pythonVerdict.ai_message,
    expected_return: pythonVerdict.debug_info ? pythonVerdict.debug_info.expected_return : "6.50%",
    macro_analysis: macroAnalysisText, 
    recommendations: dynamicRecommendations,
    catalog: dynamicCatalog 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Fully Dynamic Live AI Gateway running on port ${PORT}`));