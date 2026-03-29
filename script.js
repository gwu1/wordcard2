class VocabularyFlashcards {
    constructor() {
        this.wordSets = {};
        this.currentSet = 'default';
        this.words = [];
        this.currentIndex = 0;
        this.showDefinition = false;
        this.init();
    }

    init() {
        this.loadWordSets();
        this.setupEventListeners();
        this.updateUI();
    }

    // Word Set Management
    loadWordSets() {
        const stored = localStorage.getItem('vocabularyWordSets');
        if (stored) {
            this.wordSets = JSON.parse(stored);
        } else {
            // Initialize with default set
            this.wordSets = {
                'default': {
                    name: 'Default Set',
                    words: [],
                    createdAt: new Date().toISOString()
                }
            };
            this.saveWordSets();
        }
        
        // Load current set words
        this.loadCurrentSet();
    }

    saveWordSets() {
        localStorage.setItem('vocabularyWordSets', JSON.stringify(this.wordSets));
    }

    loadCurrentSet() {
        if (this.wordSets[this.currentSet]) {
            this.words = this.wordSets[this.currentSet].words || [];
        } else {
            this.words = [];
        }
    }

    saveCurrentSet() {
        if (this.wordSets[this.currentSet]) {
            this.wordSets[this.currentSet].words = this.words;
            this.saveWordSets();
        }
    }

    createNewSet() {
        const name = prompt('Enter name for new word set:');
        if (!name || !name.trim()) return;
        
        const setId = Date.now().toString();
        this.wordSets[setId] = {
            name: name.trim(),
            words: [],
            createdAt: new Date().toISOString()
        };
        
        this.saveWordSets();
        this.updateSetSelector();
        this.switchToSet(setId);
        this.showNotification(`Word set "${name.trim()}" created!`);
    }

    deleteCurrentSet() {
        if (this.currentSet === 'default') {
            alert('Cannot delete the default set.');
            return;
        }
        
        const setName = this.wordSets[this.currentSet].name;
        if (!confirm(`Are you sure you want to delete "${setName}"? This will delete all words in this set.`)) {
            return;
        }
        
        delete this.wordSets[this.currentSet];
        this.saveWordSets();
        this.switchToSet('default');
        this.updateSetSelector();
        this.showNotification(`Word set "${setName}" deleted.`);
    }

    switchToSet(setId) {
        this.saveCurrentSet(); // Save current set before switching
        this.currentSet = setId;
        this.loadCurrentSet();
        this.currentIndex = 0;
        this.updateUI();
        
        // Update selector
        document.getElementById('setSelect').value = setId;
    }

    updateSetSelector() {
        const selector = document.getElementById('setSelect');
        selector.innerHTML = '';
        
        Object.keys(this.wordSets).forEach(setId => {
            const set = this.wordSets[setId];
            const option = document.createElement('option');
            option.value = setId;
            option.textContent = set.name;
            selector.appendChild(option);
        });
        
        selector.value = this.currentSet;
        
        // Update delete button state
        const deleteBtn = document.getElementById('deleteSetBtn');
        deleteBtn.disabled = this.currentSet === 'default';
    }

    // Event Listeners
    setupEventListeners() {
        // Word set management
        document.getElementById('setSelect').addEventListener('change', (e) => {
            this.switchToSet(e.target.value);
        });

        document.getElementById('newSetBtn').addEventListener('click', () => {
            this.createNewSet();
        });

        document.getElementById('deleteSetBtn').addEventListener('click', () => {
            this.deleteCurrentSet();
        });

        // Form submission
        document.getElementById('wordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addWord();
        });

        // Import words
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importWords();
        });

        // Example checkbox
        document.getElementById('useExample').addEventListener('change', (e) => {
            this.toggleExampleList(e.target.checked);
        });

        // Clear all words
        document.getElementById('clearAll').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all words?')) {
                this.clearAllWords();
            }
        });

        // Start presentation
        document.getElementById('startPresentation').addEventListener('click', () => {
            this.startPresentation();
        });

        // Touch/click on flashcard to go to next word
        document.getElementById('flashcard').addEventListener('click', () => {
            this.nextWord();
        });

        // Prevent iOS double-tap zoom and ensure single tap behavior
        document.getElementById('flashcard').addEventListener('touchend', (e) => {
            // Prevent default iOS behaviors
            e.preventDefault();
            this.nextWord();
        });

        // Exit button
        document.getElementById('exitBtn').addEventListener('click', () => {
            this.exitPresentation();
        });

        // Pronunciation button
        document.getElementById('pronounceBtn').addEventListener('click', () => {
            this.pronounceCurrentWord();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('presentationMode').classList.contains('hidden')) return;
            
            switch(e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    this.nextWord();
                    break;
                case 'p':
                case 'P':
                    this.pronounceCurrentWord();
                    break;
                case 'Escape':
                    this.exitPresentation();
                    break;
            }
        });

        // Touch gestures for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartTime = 0;

        document.getElementById('flashcard').addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartTime = Date.now();
        });

        document.getElementById('flashcard').addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const touchDuration = Date.now() - touchStartTime;
            this.handleSwipe(touchDuration);
        });

        const handleSwipe = (duration) => {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                // Any swipe - next word
                this.nextWord();
            }
        };

        this.handleSwipe = handleSwipe;
    }

    // Word Management
    addWord() {
        const wordInput = document.getElementById('word');
        const definitionInput = document.getElementById('definition');
        
        const word = wordInput.value.trim();
        const definition = definitionInput.value.trim();
        
        if (!word) {
            alert('Please enter a word');
            return;
        }

        const newWord = {
            id: Date.now(),
            word: word,
            definition: definition || '',
            createdAt: new Date().toISOString()
        };

        this.words.push(newWord);
        this.saveCurrentSet();
        this.updateUI();

        // Clear form
        wordInput.value = '';
        definitionInput.value = '';
        wordInput.focus();

        // Show success feedback
        this.showNotification('Word added successfully!');
    }

    importWords() {
        const bulkWordsTextarea = document.getElementById('bulkWords');
        const wordsText = bulkWordsTextarea.value.trim();
        
        if (!wordsText) {
            alert('Please enter words to import');
            return;
        }

        const words = wordsText.split('\n')
            .map(word => word.trim())
            .filter(word => word.length > 0);

        if (words.length === 0) {
            alert('No valid words found');
            return;
        }

        let addedCount = 0;
        words.forEach(word => {
            const newWord = {
                id: Date.now() + Math.random(),
                word: word,
                definition: '',
                createdAt: new Date().toISOString()
            };
            this.words.push(newWord);
            addedCount++;
        });

        this.saveCurrentSet();
        this.updateUI();

        // Clear the textarea
        bulkWordsTextarea.value = '';

        this.showNotification(`${addedCount} words imported successfully!`);
    }

    toggleExampleList(useExample) {
        const bulkWordsTextarea = document.getElementById('bulkWords');
        const exampleWords = `lesson
boring
elephant
frightened
truck
dream
Dragon Boat Festival
new
answer
wrong
gun
desserts
share
quiet
slow
together
graphes
kind
kids
started
huge
other`;
        
        if (useExample) {
            bulkWordsTextarea.value = exampleWords;
        } else {
            bulkWordsTextarea.value = '';
        }
    }

    deleteWord(id) {
        this.words = this.words.filter(word => word.id !== id);
        this.saveCurrentSet();
        this.updateUI();
        this.showNotification('Word deleted');
    }

    clearAllWords() {
        this.words = [];
        this.saveCurrentSet();
        this.updateUI();
        this.showNotification('All words cleared');
    }

    // UI Updates
    updateUI() {
        this.updateSetSelector();
        this.updateWordCount();
        this.updateWordsList();
        this.updatePresentationButton();
    }

    updateWordCount() {
        const count = this.words.length;
        document.getElementById('wordCount').textContent = `${count} ${count === 1 ? 'word' : 'words'}`;
    }

    updateWordsList() {
        const container = document.getElementById('wordsList');
        
        if (this.words.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #718096; padding: 40px;">No words added yet. Add your first word above!</p>';
            return;
        }

        container.innerHTML = this.words.map(word => `
            <div class="word-item">
                <h3>${this.escapeHtml(word.word)}</h3>
                ${word.definition ? `<p>${this.escapeHtml(word.definition)}</p>` : ''}
                <button class="delete-btn" onclick="flashcards.deleteWord(${word.id})" title="Delete word">×</button>
            </div>
        `).join('');
    }

    updatePresentationButton() {
        const button = document.getElementById('startPresentation');
        button.disabled = this.words.length === 0;
    }

    // Presentation Mode
    startPresentation() {
        if (this.words.length === 0) return;
        
        this.currentIndex = 0;
        
        document.getElementById('menuMode').classList.add('hidden');
        document.getElementById('presentationMode').classList.remove('hidden');
        
        // Request fullscreen on supported devices
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen not available:', err);
            });
        }
        
        this.updateFlashcard();
    }

    exitPresentation() {
        document.getElementById('presentationMode').classList.add('hidden');
        document.getElementById('menuMode').classList.remove('hidden');
        
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => {
                console.log('Error exiting fullscreen:', err);
            });
        }
    }

    updateFlashcard() {
        if (this.words.length === 0) return;
        
        const currentWord = this.words[this.currentIndex];
        const wordDisplay = document.getElementById('wordDisplay');
        
        wordDisplay.textContent = currentWord.word;
    }

    pronounceCurrentWord() {
        if (this.words.length === 0) return;
        
        const currentWord = this.words[this.currentIndex].word;
        
        // Use Web Speech API for pronunciation
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(currentWord);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            utterance.pitch = 1;
            
            speechSynthesis.cancel(); // Cancel any ongoing speech
            speechSynthesis.speak(utterance);
        } else {
            // Fallback for browsers that don't support speech synthesis
            this.showNotification('Speech synthesis not supported in this browser');
        }
    }

    nextWord() {
        if (this.words.length === 0) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.words.length;
        this.updateFlashcard();
    }

    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }
}

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize the app
const flashcards = new VocabularyFlashcards();
