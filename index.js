import { GoogleGenerativeAI } from '@google/generative-ai';

// Diese Funktion wird von Vercel aufgerufen
export default async function handler(req, res) {
  
  // --- CORS Header setzen ---
  // Erlaubt Anfragen von JEDER Domain (für den Test). In Produktion solltest du das auf deine Frontend-Domain einschränken.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // --- Preflight Request (OPTIONS) beantworten ---
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // --- Nur POST-Anfragen erlauben ---
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Nur POST-Anfragen sind erlaubt.' });
    return;
  }

  // --- API Key & Modell Initialisierung ---
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error("FEHLER: GEMINI_API_KEY ist nicht gesetzt.");
    res.status(500).json({ error: 'API Key für KI-Modell nicht konfiguriert.' });
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // --- Daten aus der Anfrage holen ---
    const { economic, social, partyName, symbol } = req.body;

    if (economic === undefined || social === undefined || !partyName || !symbol) {
      res.status(400).json({ error: 'Fehlende Daten in der Anfrage (economic, social, partyName, symbol benötigt).' });
      return;
    }

    // --- Prompt bauen ---
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

    // --- KI aufrufen und Antwort senden ---
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.status(200).json({ description: text });

  } catch (error) {
    console.error("FEHLER bei der KI-Anfrage:", error);
    res.status(500).json({ error: `Interner Fehler bei der Textgenerierung: ${error.message}` });
  }
}