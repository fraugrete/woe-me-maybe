document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Variablen & Elemente holen ---
    const pageStart = document.getElementById('page-start');
    const pageQuestions = document.getElementById('page-questions');
    const pageConfig = document.getElementById('page-config');
    const pageResults = document.getElementById('page-results');
    const pages = [pageStart, pageQuestions, pageConfig, pageResults];
    const startButton = document.getElementById('start-button');
    const createPartyButton = document.getElementById('create-party-button');
    const restartButton = document.getElementById('restart-button');
    const answerButtonsContainer = document.getElementById('answer-buttons');
    const questionNumberSpan = document.getElementById('question-number');
    const questionTextP = document.getElementById('question-text');
    const partyNameInput = document.getElementById('party-name');
    const nameSuggestionButtons = document.querySelectorAll('.name-suggestion');
    const colorSelectionDiv = document.getElementById('color-selection');
    const symbolSelectionDiv = document.getElementById('symbol-selection');
    const resultPartyNameSpan = document.getElementById('result-party-name');
    const resultSymbolDiv = document.getElementById('result-symbol');
    const resultTextP = document.getElementById('result-text');
    const resultImage = document.getElementById('result-image');
    const pageResultsDiv = document.getElementById('page-results');
    const shareFb = document.getElementById('share-fb');
    const shareRd = document.getElementById('share-rd');
    const shareBs = document.getElementById('share-bs');
    const shareTh = document.getElementById('share-th');
    const shareWa = document.getElementById('share-wa');
    const copyLinkButton = document.getElementById('copy-link');
    const copyFeedbackSpan = document.getElementById('copy-feedback');

    const questions = [
        "Der Klimaschutz sollte Vorrang vor wirtschaftlichem Wachstum haben.", "Der Staat sollte stärker umverteilen, um soziale Ungleichheit zu reduzieren.", "Märkte funktionieren am besten mit möglichst wenig staatlicher Einmischung.", "Österreich sollte die Einwanderung stärker begrenzen.", "Der Staat sollte massiv in digitale Infrastruktur und Bildung investieren, auch wenn das hohe Kosten verursacht.", "Zur Gewährleistung der inneren Sicherheit sollten die Befugnisse der Polizei erweitert werden.", "Österreich sollte mehr Kompetenzen an die Europäische Union abgeben.", "Das Bildungssystem sollte stärker vereinheitlicht werden, um gleiche Chancen für alle zu schaffen.", "Das Gesundheitssystem sollte rein staatlich finanziert und betrieben werden.", "Traditionelle Werte und Lebensmodelle sollten stärker geschützt und gefördert werden."
    ];
    const questionEffects = [
        [0, 1], [1, 0], [-1, 0], [0, -1], [0.5, 0.5], [0, -1], [0, 1], [1, 0.5], [1, 0], [0, -1]
    ];

    let currentQuestionIndex = 0;
    let userAnswers = [];
    let partyConfig = { name: '', color: '#A8DADC', symbol: '❓' };
    let politicalProfile = { economic: 0, social: 0 };

    // --- 2. Funktionen ---
    function showPage(pageToShow) {
        pages.forEach(page => { if(page) page.style.display = 'none'; });
        if (pageToShow) {
            pageToShow.style.display = 'block';
        } else {
            console.error("showPage: pageToShow ist undefiniert!");
        }
    }

    function displayQuestion() {
        if (currentQuestionIndex < questions.length) {
            questionNumberSpan.textContent = currentQuestionIndex + 1;
            questionTextP.textContent = questions[currentQuestionIndex];
        } else {
            showPage(pageConfig);
        }
    }

    function clearSelection(containerSelector, className) {
        document.querySelectorAll(`${containerSelector} .${className}`).forEach(btn => {
            btn.classList.remove('selected');
        });
    }

    function calculateProfile() {
        politicalProfile.economic = 0;
        politicalProfile.social = 0;
        userAnswers.forEach((answerValue, index) => {
            const effect = questionEffects[index];
            politicalProfile.economic += answerValue * effect[0];
            politicalProfile.social += answerValue * effect[1];
        });
        console.log("Frontend - Politisches Profil:", politicalProfile);
    }

   async function fetchKiDescription(profile, name, sym) {
    resultTextP.textContent = "KI-Beschreibung wird geladen...";
    try {
        // Wir bauen die URL mit Query-Parametern
        const queryParams = new URLSearchParams({
            economic: profile.economic,
            social: profile.social,
            partyName: name,
            symbol: sym
        });
        
        const backendUrl = `https://woe-me-maybe-525717567522.europe-west1.run.app/generate-description?${queryParams.toString()}`;

        const response = await fetch(backendUrl, {
            method: 'POST', // Wir versuchen weiterhin POST, aber das Backend akzeptiert jetzt auch GET
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ economic: profile.economic, social: profile.social, partyName: name, symbol: sym }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Server antwortete mit Status ${response.status}` }));
            throw new Error(`Backend-Fehler (${response.status}): ${errorData.error || response.statusText}`);
        }
        const data = await response.json();
        return data.description || "Keine Beschreibung von der KI erhalten.";
    } catch (error) {
        console.error("Fehler beim Abrufen der KI-Beschreibung:", error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return "Fehler: Netzwerkproblem oder Backend nicht erreichbar.";
        }
        return `Fehler: ${error.message}`;
    }
}

    function updateShareLinks(partyName) {
        // HIER WURDE DIE URL GEÄNDERT
       const quizUrl = "https://woe-me-maybe.vercel.app/"; 
        const shareTextBase = `Ich habe im KI-Parteien-Quiz die "${partyName}" erstellt! Finde deine Partei: `;
        const shareTextWithUrl = shareTextBase + quizUrl;
        const encodedUrl = encodeURIComponent(quizUrl);
        const encodedText = encodeURIComponent(shareTextWithUrl);
        const encodedTitle = encodeURIComponent(`Meine KI-Partei: ${partyName}`);
        shareFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        shareRd.href = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        shareBs.href = `https://bsky.app/intent/compose?text=${encodedText}`;
        shareTh.href = `https://www.threads.net/intent/post?text=${encodedText}`;
        shareWa.href = `https://api.whatsapp.com/send?text=${encodedText}`;
    }

    async function displayResults() {
        calculateProfile();
        partyConfig.name = partyNameInput.value || "Deine Partei";
        const visionImages = { left: 'https://placehold.co/300x200/A8DADC/000000?text=Sozialer+Zusammenhalt', right: 'https://placehold.co/300x200/F4A261/000000?text=Wirtschaft+%26+Innovation', progressive: 'https://placehold.co/300x200/2A9D8F/FFFFFF?text=Zukunft+%26+Natur', conservative: 'https://placehold.co/300x200/E63946/FFFFFF?text=Tradition+%26+Sicherheit', center: 'https://placehold.co/300x200/CCCCCC/000000?text=Ausgleich+%26+Dialog' };
        const dominantColors = { left: '#457B9D', right: '#F4A261', progressive: '#2A9D8F', conservative: '#E63946', center: '#CCCCCC' };
        let visionSrc = visionImages.center; let borderColor = dominantColors.center;
        const threshold = 3; const absEco = Math.abs(politicalProfile.economic); const absSoc = Math.abs(politicalProfile.social);

        if (absEco > threshold || absSoc > threshold) {
            if (absEco >= absSoc) { if (politicalProfile.economic > threshold) { visionSrc = visionImages.left; borderColor = dominantColors.left; } else { visionSrc = visionImages.right; borderColor = dominantColors.right; } }
            else { if (politicalProfile.social > threshold) { visionSrc = visionImages.progressive; borderColor = dominantColors.progressive; } else { visionSrc = visionImages.conservative; borderColor = dominantColors.conservative; } }
        }

        resultPartyNameSpan.textContent = partyConfig.name;
        resultSymbolDiv.textContent = partyConfig.symbol;
        resultSymbolDiv.style.borderColor = borderColor;
        pageResultsDiv.style.backgroundColor = partyConfig.color;
        resultImage.src = visionSrc;
        resultImage.alt = "Vision: " + (visionSrc.split('text=')[1] || 'Bild').replace(/\+/g, ' ');
        
        const kiText = await fetchKiDescription(politicalProfile, partyConfig.name, partyConfig.symbol);
        resultTextP.textContent = kiText;

        updateShareLinks(partyConfig.name);
        showPage(pageResults);
    }

    function restartQuiz() {
        currentQuestionIndex = 0;
        userAnswers = [];
        partyNameInput.value = '';
        partyConfig = { name: '', color: '#A8DADC', symbol: '❓' };
        politicalProfile = { economic: 0, social: 0 };
        clearSelection('#color-selection', 'color-btn');
        clearSelection('#symbol-selection', 'symbol-btn');
        pageResultsDiv.style.backgroundColor = 'transparent';
        resultTextP.textContent = "KI-Beschreibung wird geladen...";
        showPage(pageStart);
    }

    // --- 3. Event Listeners ---
    startButton.addEventListener('click', () => {
        restartQuiz();
        displayQuestion();
        showPage(pageQuestions);
    });
    answerButtonsContainer.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const value = parseInt(event.target.dataset.value, 10);
            userAnswers.push(value);
            currentQuestionIndex++;
            displayQuestion();
        }
    });
    nameSuggestionButtons.forEach(button => {
        button.addEventListener('click', () => { partyNameInput.value = button.textContent; });
    });
    colorSelectionDiv.addEventListener('click', (event) => {
        if (event.target.classList.contains('color-btn')) {
            clearSelection('#color-selection', 'color-btn');
            event.target.classList.add('selected');
            partyConfig.color = event.target.dataset.color;
        }
    });
    symbolSelectionDiv.addEventListener('click', (event) => {
        if (event.target.classList.contains('symbol-btn')) {
            clearSelection('#symbol-selection', 'symbol-btn');
            event.target.classList.add('selected');
            partyConfig.symbol = event.target.dataset.symbol;
        }
    });
    createPartyButton.addEventListener('click', displayResults);
    restartButton.addEventListener('click', restartQuiz);
    copyLinkButton.addEventListener('click', () => {
        // HIER WURDE DIE URL AUCH GEÄNDERT
        const quizUrl = "https://woe-me-maybe.vercel.app/"; // Deine neue Vercel Frontend-URL
        const partyName = partyConfig.name || "Deine Partei";
        const textToCopy = `Ich habe im KI-Parteien-Quiz die "${partyName}" erstellt! Finde deine Partei: ${quizUrl}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyFeedbackSpan.style.display = 'inline';
            setTimeout(() => { copyFeedbackSpan.style.display = 'none'; }, 2000);
        }).catch(err => { console.error('Fehler beim Kopieren: ', err); alert('Kopieren fehlgeschlagen.'); });
    });

    // --- 4. Initialisierung ---
    showPage(pageStart);
});