const searchForm = document.getElementById('search-form');
const wordInput = document.getElementById('word-input');
const resultsContainer = document.getElementById('results-container');
const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading');

const resultWord = document.getElementById('result-word');
const resultPhonetic = document.getElementById('result-phonetic');
const audioBtn = document.getElementById('audio-btn');
const meaningsContainer = document.getElementById('meanings-container');
const sourceLink = document.getElementById('source-link');

let audioObject = null;

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchTerm = wordInput.value.trim();

    if (!searchTerm) {
        showError('Please enter a word to search.');
        return;
    }

    await fetchWordDefinition(searchTerm);
});

async function fetchWordDefinition(word) {
    resetUI();
    showLoading(true);

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        
        if (!response.ok) {
            throw new Error(`Word not found or API error (${response.status})`);
        }

        const data = await response.json();
        displayResults(data[0]);
    } catch (error) {
        showError(`Sorry, we couldn't find definitions for "${word}". Please check your spelling and try again.`);
    } finally {
        showLoading(false);
    }
}

function displayResults(data) {
    // 1. Set Word & Phonetic
    resultWord.textContent = data.word;
    resultPhonetic.textContent = data.phonetic || (data.phonetics.find(p => p.text)?.text) || '';

    // 2. Handle Audio Pronunciation
    const audioSrc = findAudioSource(data.phonetics);
    if (audioSrc) {
        audioObject = new Audio(audioSrc);
        audioBtn.classList.remove('hidden');
        audioBtn.onclick = () => audioObject.play();
    } else {
        audioBtn.classList.add('hidden');
    }

    // 3. Render Meanings & Definitions
    meaningsContainer.innerHTML = '';
    data.meanings.forEach(meaning => {
        const meaningGroup = document.createElement('div');
        meaningGroup.className = 'meaning-group';

        const posHeading = document.createElement('h3');
        posHeading.className = 'part-of-speech';
        posHeading.textContent = meaning.partOfSpeech;
        meaningGroup.appendChild(posHeading);

        const defsList = document.createElement('ul');
        defsList.className = 'definitions-list';

        meaning.definitions.forEach(defObj => {
            const li = document.createElement('li');
            li.textContent = defObj.definition;

            if (defObj.example) {
                const exampleSpan = document.createElement('span');
                exampleSpan.className = 'example';
                exampleSpan.textContent = `"${defObj.example}"`;
                li.appendChild(exampleSpan);
            }

            defsList.appendChild(li);
        });

        meaningGroup.appendChild(defsList);

        // 4. Render Synonyms if available
        if (meaning.synonyms && meaning.synonyms.length > 0) {
            const synonymsDiv = document.createElement('div');
            synonymsDiv.className = 'synonyms-box';
            synonymsDiv.innerHTML = `Synonyms: <span>${meaning.synonyms.slice(0, 5).join(', ')}</span>`;
            meaningGroup.appendChild(synonymsDiv);
        }

        meaningsContainer.appendChild(meaningGroup);
    });

    // 5. Source Link
    if (data.sourceUrls && data.sourceUrls.length > 0) {
        sourceLink.href = data.sourceUrls[0];
        sourceLink.textContent = data.sourceUrls[0];
    }

    resultsContainer.classList.remove('hidden');
}

function findAudioSource(phonetics) {
    for (let p of phonetics) {
        if (p.audio && p.audio.trim() !== '') {
            return p.audio;
        }
    }
    return null;
}

function resetUI() {
    errorMessage.classList.add('hidden');
    resultsContainer.classList.add('hidden');
    audioBtn.classList.add('hidden');
    if (audioObject) {
        audioObject.pause();
        audioObject = null;
    }
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

function showError(message) {
    resetUI();
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}