import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import cors from 'cors';

// --- Konfiguration ---
const app = express();
const port = process.env.PORT || 8080; // Google Cloud Run gibt den Port über eine Umgebungsvariable vor

// --- Middleware ---
app.use(cors()); // CORS für alle Anfragen erlauben
app.use(express.json()); // JSON-Body-Parser

// --- KI-Modell Initialisierung ---
let model;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ist nicht als Umgebungsvariable gesetzt.");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} catch (error) {
  console.error("KRITISCHER FEHLER: KI-Modell konnte nicht initialisiert werden.", error);
}

// --- API Endpunkt / Route ---
app.post('/generate-description', async (req, res) => {
  if (!model) {
    return res.status(500).json({ error: "KI-Modell nicht korrekt initialisiert." });
  }

  try {
    const { economic, social, partyName, symbol } = req.body;

    if (economic === undefined || social === undefined || !partyName || !symbol) {
      return res.status(400).json({ error: 'Fehlende Daten in der Anfrage.' });
    }

    const prompt = `
Rolle: Du bist ein schlagkräftiger Wahlkampf-Stratege in Österreich. Deine Aufgabe ist es, die Essenz einer neuen Partei in wenigen, prägnanten Sätzen mit konkreten Beispielen darzustellen.
Kontext: Eine neue fiktive Partei namens "${partyName}" (Symbol: ${symbol}) wurde erstellt. Ihr politisches Profil ist:
- Wirtschaftsachse: ${economic} (Skala -10 bis +10; + = Links/Staat, - = Rechts/Markt)
- Gesellschaftsachse: ${social} (Skala -10 bis +10; + = Progressiv/Liberal, - = Konservativ/Traditionell)
Aufgabe: Verfasse einen kurzen, prägnanten und plakativen Beschreibungstext (ca. 80-120 Wörter).
1.  Beginne mit einer klaren Charakterisierung der Partei ("${partyName} tritt an für...").
2.  Nenne zwei konkrete, fiktive politische Kernforderungen/Beispiele, die direkt aus dem Profil abgeleitet sind und die Vision der Partei illustrieren. (Sei spezifisch!).
3.  Formuliere ausschließlich aus der Perspektive der Partei - als würdest du ihre Kernbotschaft verkünden.
Stil: Direkt, selbstbewusst, aktiv, zukunftsorientiert, leicht verständlich.
ABSOLUTE TABUS (STRENG BEACHTEN!):
- KEINE Analyse: Füge keinerlei Sätze hinzu, die die Chancen, die Etablierung, die Wähleransprache oder zukünftige Entwicklungen analysieren oder kommentieren.
- KEINE VAGHEIT: Keine unklaren Phrasen, keine "Gründungsphasen".
- KEINE META-KOMMENTARE.
- KEIN JARGON, KEINE EXTREME, KEINE BELEIDIGUNGEN.
Liefere nur den reinen Beschreibungstext. Beginne direkt mit dem ersten Satz.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ description: text });

  } catch (error) {
    console.error("Fehler bei der KI-Anfrage:", error);
    return res.status(500).json({ error: "Interner Fehler bei der Textgenerierung." });
  }
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`Server läuft und lauscht auf Port ${port}`);
});