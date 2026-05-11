// Array holding references to all category data objects loaded from individual JS files
const allCategories = [
    around_the_houseData, before_and_afterData, book_titleData, classic_movieData,
    classic_tvData, college_lifeData, eventData, familyData, fictional_characterData,
    fictional_placeData, food_and_drinkData, fun_and_gamesData, headlineData,
    husband_and_wifeData, in_the_kitchenData, landmarkData, living_thingData,
    megawordData, movie_quotesData, movie_titleData, occupationData, on_the_mapData,
    peopleData, personData, phraseData, placeData, proper_nameData, quotationData,
    rhyme_timeData, rock_onData, same_letterData, same_nameData, show_bizData,
    sloganData, song_artistData, song_lyricsData, song_titleData, star_and_roleData,
    the_50sData, the_60sData, the_70sData, the_80sData, the_90sData, thingData,
    title_authorData, titleData, tv_show_titleData, what_are_you_doingData,
    what_are_you_wearingData
];

/* const wheelSegments = [
    2500, 300, 600, 300, 500, 10000, 
    550, 400, 300, 900, 500, 650, 
    900, "BANKRUPT", 600, 400, 300, "LOSE A TURN", 
    800, 350, 450, 700, 300, 600
];
*/

// Array representing the monetary/special values of each wedge on the wheel graphic
// Duplicated values account for the fact that a visual wedge spans multiple rotational degrees
const newWheelSegments = [
    2500, 2500, 300,
    300, 300, 600,
    600, 600, 300,
    300, 300, 500,
    500, 500, "BANKRUPT",
    10000, "BANKRUPT", 550,
    550, 550, 400,
    400, 400, 300,
    300, 300, 900,
    900, 900, 500,
    500, 500, 650,
    650, 650, 900, 
    900, 900, "BANKRUPT",
    "BANKRUPT", "BANKRUPT", 600,
    600, 600, 400,
    400, 400, 300,
    300, 300, "LOSE A TURN",
    "LOSE A TURN", "LOSE A TURN", 800,
    800, 800, 350,
    350, 350, 450,
    450, 450, 700,
    700, 700, 300,
    300, 300, 600,
    600, 600, 2500
];

// ------------------------------------
// Global Game State Variables
// ------------------------------------
let currentRound = 1; // Tracks current round (1 to 4, then bonus)
let numPlayers = 1; // Number of active players
let currentPlayer = 0; // Index of the player currently taking a turn
let playerRoundBanks = [0, 0, 0]; // Money earned by each player in the current round
let playerTotalBanks = [0, 0, 0]; // Total banked money kept across all rounds
let currentPuzzle = ""; // The actual string being guessed
let currentSpinValue = 0; // Value landed on after a wheel spin
let isVowelMode = false; // Flag indicating if the user is currently buying a vowel
let currentWheelRotation = 0; // Tracks the CSS rotation degrees of the wheel graphic
let solveTimer = null; // Interval ID for the 20-second solve clock
let consonantTimer = null; // Interval ID for the 3-second consonant clock
let isSolving = false; // Flag indicating if a player is attempting to solve
let solveTiles = []; // Array of DOM tile elements that need to be filled in during a solve
let currentSolveIndex = 0; // Tracks which tile the player is currently typing into during a solve
let hasAlertedNoVowels = false; // Prevents spamming the "no vowels left" alert
let playerNames = ["PLAYER 1", "PLAYER 2", "PLAYER 3"]; // Defaults; overwritten by user input

// Toss-Up IDs
let isTossUp = false;
let tossUpInterval = null;
let tossUpRevealedIndices = [];
let tossUpEligiblePlayers = [];
let tossUpValue = 0;

// Bonus Round Specific Variables
let isBonusRound = false; 
let bonusConsonantsPicked = 0; // Tracks how many consonants the player has selected
let bonusVowelsPicked = 0; // Tracks how many vowels the player has selected
const BONUS_CONSONANT_LIMIT = 3; // Standard rules dictate 3 consonants
const BONUS_VOWEL_LIMIT = 1; // Standard rules dictate 1 vowel

// ------------------------------------
// DOM Elements
// ------------------------------------
const wheelImg = document.getElementById('fortune-wheel'); // The wheel image
const spinValueText = document.getElementById('spin-value-text'); // Text displaying wheel result

// Hides the main menu and reveals the "How many players" screen
function showPlayerSelection() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('player-selection').classList.remove('hidden');
}

// Sets the player count and dynamically creates text input fields for their names
function startGame(count) {
    numPlayers = count;
    document.getElementById('player-selection').classList.add('hidden');
    const nameEntry = document.getElementById('name-entry');
    const container = document.getElementById('name-inputs-container');
    container.innerHTML = ""; // Clears any existing inputs
    nameEntry.classList.remove('hidden'); // Shows name entry screen

    // Loops to create the correct number of input boxes
    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = "name-input-group";
        div.innerHTML = `
            <label>Player ${i}:</label>
            <input type="text" id="p${i}-name-input" placeholder="NAME" autocomplete="off">
        `;
        container.appendChild(div);
    }
}

// Reads the player names, fades out menu music, and boots up the game interface
function finalizeStart() {
    fadeOutMenuMusic();
    playerTotalBanks = [0, 0, 0]; // Resets global scores
    currentRound = 1;
    isBonusRound = false;

    // Grabs text from input boxes, defaulting to "PLAYER X" if left blank
    for (let i = 1; i <= numPlayers; i++) {
        const val = document.getElementById(`p${i}-name-input`).value.trim();
        playerNames[i - 1] = val !== "" ? val.toUpperCase() : `PLAYER ${i}`;
    }

    // Swaps from setup screen to main game screen
    document.getElementById('name-entry').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    // Hides the score trackers for players that aren't playing (e.g. Player 3 in a 2-player game)
    for (let i = 1; i <= 3; i++) {
        const display = document.getElementById(`p${i}-display`);
        display.classList.toggle('hidden', i > numPlayers);
    }

    startRoundSequence(); // Triggers the animation for round 1
}

// Handles the transition animations and state resets between rounds
async function startRoundSequence() {
    playerRoundBanks = [0, 0, 0];
    isVowelMode = false;
    hasAlertedNoVowels = false;
    isTossUp = false;

    const banner = document.getElementById('round-banner');
    banner.classList.remove('banner-enter', 'banner-exit');

    /* --------------------
    ANY HELP WITH THIS CODE SEGMENT BELOW WOULD BE GREATLY APPRECIATED!
    -------------------- */

    // Determine Round Type and Title
    let roundTitle = `ROUND ${currentRound}`;
    if (currentRound === 1) roundTitle = "TOSS-UP $1,000";
    if (currentRound === 2) roundTitle = "TOSS-UP $2,000";
    if (currentRound === 3) roundTitle = "ROUND 1";
    if (currentRound === 4) roundTitle = "ROUND 2";
    if (currentRound === 5) roundTitle = "ROUND 3";
    if (currentRound === 6) roundTitle = "TRIPLE TOSS-UP"; // 3, 4, 5 are internal TU counters for the Triple
    if (currentRound === 7) roundTitle = "ROUND 4";
    if (isBonusRound) roundTitle = "BONUS ROUND";
    /* --------------------
    -------------------- */
    
    banner.innerText = roundTitle;
    banner.style.background = isBonusRound ? "black" : "transparent";
    
    document.getElementById('game-screen').classList.add('hidden');
    void banner.offsetWidth;
    banner.classList.add('banner-enter');
    await new Promise(r => setTimeout(r, 2000));
    banner.classList.remove('banner-enter');
    banner.classList.add('banner-exit');
    await new Promise(r => setTimeout(r, 600));

    document.getElementById('game-screen').classList.remove('hidden');

    if (isBonusRound) {
        initBonusRound();
    } else if (currentRound === 1 || currentRound === 2 || (currentRound >= 6 && currentRound <= 8)) {
        isTossUp = true;
        tossUpValue = (currentRound === 1) ? 1000 : 2000;
        initTossUp();
    } else if (isTossUp) {
        document.getElementById('action-menu').classList.add('hidden'); // Ensure hidden at round start
        initTossUp();
    }   else {
        // Actual Rounds 1, 2, 3 correspond to game currentRound 3, 4, 5
        init();
    }
}

// Sets up a standard puzzle board
function init() {
    currentWheelRotation = 0; // Resets wheel physical position
    
    // Selects a random category array, updates UI, and picks a random string from that array
    const data = allCategories[Math.floor(Math.random() * allCategories.length)];
    document.getElementById('category-text').innerText = data.category;
    currentPuzzle = data.puzzles[Math.floor(Math.random() * data.puzzles.length)].toUpperCase();
    
    // Plays the reveal sound effect
    const revealSnd = document.getElementById('snd-reveal');
    revealSnd.currentTime = 0;
    revealSnd.play().catch(() => {});

    // Snaps the wheel back to 0 degrees instantly without animation
    wheelImg.style.transition = 'none';
    wheelImg.style.transform = 'rotate(0deg)';

    // Builds the physical DOM tiles, lays the text into them, and builds the keyboard
    createGrid();
    layoutLetters();
    createKeyboard();
    
    // Unhides main action buttons
    document.getElementById('spin-trigger').classList.remove('hidden');
    document.getElementById('buy-vowel-btn').classList.remove('hidden');
    document.getElementById('solve-trigger').classList.remove('hidden');
    document.getElementById('action-menu').classList.remove('hidden');
    
    // Hides end-of-round buttons
    document.getElementById('next-round-btn').classList.add('hidden');
    document.getElementById('play-again-btn').classList.add('hidden');
    const bonusBtn = document.getElementById('bonus-round-btn');
    if (bonusBtn) bonusBtn.classList.add('hidden');
    
    updateUI(); // Refreshes player scores and highlights active player
    togglePhase('menu'); // Shows the main action buttons
}

// Displays the scores between rounds and handles transitioning to the next round/bonus round
function showLeaderboard() {
    const view = document.getElementById('leaderboard-view');
    const container = document.getElementById('leaderboard-scores');
    container.innerHTML = ""; // Clears existing UI cards
    
    document.getElementById('game-screen').classList.add('hidden'); // Hides game board
    view.classList.remove('hidden'); // Shows leaderboard screen

    // Creates an animated card for each active player
    for(let i = 0; i < numPlayers; i++) {
        const scoreDiv = document.createElement('div');
        scoreDiv.className = `player-score p${i+1}-color leader-card-enter`;
        scoreDiv.style.animationDelay = `${i * 0.15}s`; // Staggers the cards popping in
        scoreDiv.innerHTML = `${playerNames[i]}: $${playerTotalBanks[i].toLocaleString()}`;
        container.appendChild(scoreDiv);
    }

    // Triggers the exit animation for the cards after 3.5 seconds
    setTimeout(() => {
        const cards = container.querySelectorAll('.player-score');
        for(let i = 0; i < cards.length; i++) {
            cards[i].classList.remove('leader-card-enter');
            cards[i].classList.add('leader-card-exit');
            cards[i].style.animationDelay = `${(cards.length - 1 - i) * 0.15}s`; // Staggers cards exiting in reverse
        }
    }, 3500);

    // After 5 seconds total, decides where to go next based on current round
    setTimeout(() => {
        view.classList.add('hidden');
        // Sequence: TU1(1), TU2(2), R1(3), R2(4), R3(5), TripleTU(6,7,8), Bonus
        if (currentRound < 8) {
            currentRound++;
            startRoundSequence();
        } else {
            handleBonusRoundEntry();
        }
    }, 5000);
}

// Determines who goes to the bonus round and prompts them to pick a category
function handleBonusRoundEntry() {
    document.getElementById('game-screen').classList.add('hidden');
    
    // Finds the highest score and sets currentPlayer to that index
    const maxScore = Math.max(...playerTotalBanks);
    currentPlayer = playerTotalBanks.indexOf(maxScore);

    // Creates a full screen menu dynamically to let the winner pick a category
    const picker = document.createElement('div');
    picker.id = "bonus-picker";
    picker.style = "position:fixed; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:10000; color:white; font-family:Arial Black;";
    
    // Instructs the winning player to choose
    const h2 = document.createElement('h2');
    h2.innerText = `${playerNames[currentPlayer]}: CHOOSE A CATEGORY`;
    picker.appendChild(h2);

    const btnCont = document.createElement('div');
    btnCont.style.display = "flex";
    btnCont.style.gap = "20px";

    // Randomly selects 3 categories from the global array
    const choices = [...allCategories].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Creates a button for each of the 3 choices
    choices.forEach(cat => {
        const btn = document.createElement('button');
        btn.innerText = cat.category;
        btn.className = "bonus-category-btn";
        btn.onclick = () => {
            // Stores their choice, resets limits, and begins the round
            window.selectedBonusData = cat;
            isBonusRound = true;
            bonusConsonantsPicked = 0;
            bonusVowelsPicked = 0;
            picker.remove(); // Deletes this temporary menu
            startRoundSequence();
        };
        btnCont.appendChild(btn);
    });

    picker.appendChild(btnCont);
    document.body.appendChild(picker); // Renders menu to screen
}

// Sets up the board specifically for the final bonus round
function initBonusRound() {
    const data = window.selectedBonusData; // Grabs the category they chose
    document.getElementById('category-text').innerText = data.category;
    currentPuzzle = data.puzzles[Math.floor(Math.random() * data.puzzles.length)].toUpperCase();
    
    // Builds board and inputs the text string
    createGrid();
    layoutLetters();
    createKeyboard();

    // Automatically reveals the standard R,S,T,L,N,E letters
    const rstlne = "RSTLNE".split("");
    rstlne.forEach(l => {
        const targets = document.querySelectorAll(`.tile[data-letter='${l}']`);
        targets.forEach(t => {
            t.classList.remove('hidden-letter'); // Shows text
            t.innerText = l;
        });
        const key = document.getElementById(`key-${l}`); // Disables them on the keyboard
        if(key) {
            key.disabled = true;
            key.classList.add('used');
        }
    });

    togglePhase('bonus-picking'); // Changes keyboard rules to allow picking 3 cons / 1 vow
}

// Processes key presses during the bonus round letter selection phase
function handleBonusPick(letter) {
    const vowels = "AEIOU";
    const isVowel = vowels.includes(letter);
    const key = document.getElementById(`key-${letter}`);

    // Checks limits and increments counters if valid
    if (isVowel && bonusVowelsPicked < BONUS_VOWEL_LIMIT) {
        bonusVowelsPicked++;
        key.disabled = true;
        key.classList.add('used');
    } else if (!isVowel && bonusConsonantsPicked < BONUS_CONSONANT_LIMIT) {
        bonusConsonantsPicked++;
        key.disabled = true;
        key.classList.add('used');
    }

    // Once exactly 3 consonants and 1 vowel are picked, move to reveal phase
    if (bonusConsonantsPicked === BONUS_CONSONANT_LIMIT && bonusVowelsPicked === BONUS_VOWEL_LIMIT) {
        revealBonusPicks();
    } else {
        togglePhase('bonus-picking'); // Refreshes keyboard state (locks/unlocks appropriate buttons)
    }
}

// Automatically flips any tiles the player chose in the bonus round
async function revealBonusPicks() {
    togglePhase('revealLetter'); // Hides menus during animation
    
    // Creates an array of the letters the user just clicked
    const usedKeys = Array.from(document.querySelectorAll('.key.used'))
                    .map(k => k.innerText)
                    .filter(l => !"RSTLNE".includes(l)); // Excludes the free letters

    // Loops through each chosen letter
    for (const letter of usedKeys) {
        let targets = Array.from(document.querySelectorAll(`.tile[data-letter='${letter}']`));
        if (targets.length > 0) {
            // Flips each matching tile one by one
            for (const t of targets) {
                t.classList.add('revealing');
                document.getElementById('snd-ding').currentTime = 0;
                document.getElementById('snd-ding').play().catch(() => {});
                await new Promise(r => setTimeout(r, 750)); // Pauses for drama
                t.classList.remove('revealing', 'hidden-letter');
                t.innerText = letter;
            }
        } else {
            await new Promise(r => setTimeout(r, 500)); // Shorter pause if the letter wasn't in the puzzle
        }
    }

    await new Promise(r => setTimeout(r, 3000)); // 3 second pause to let player analyze board
    
    // Play a random "Good Luck" sound bite
    const revealSnd = document.getElementById('snd-reveal');
    const originalSrc = revealSnd.src;
    const goodLuckSounds = ["1.wav", "2.wav"];
    const randomFile = goodLuckSounds[Math.floor(Math.random() * goodLuckSounds.length)];
    const randomPath = `sounds/good_luck/${randomFile}`;

    revealSnd.src = randomPath;
    revealSnd.currentTime = 0;

    // Await the sound playing, falls back to original reveal sound if file is missing
    try {
        await revealSnd.play();
        await new Promise(resolve => {
            revealSnd.onended = resolve;
        });
    } catch (err) {
        revealSnd.src = originalSrc;
        revealSnd.currentTime = 0;
        await revealSnd.play().catch(() => {});
        await new Promise(resolve => {
            revealSnd.onended = resolve;
        });
    }
    
    startSolveAttempt(); // Immediately triggers the 20 second clock
}

// Reloads the entire page to start a fresh game
function resetGame() {
    location.reload();
}

// Generates the 52 blank green HTML divs that make up the game board grid
function createGrid() {
    const board = document.getElementById('puzzle-board');
    board.innerHTML = ""; // Wipe old board
    const deadSlots = [0, 12, 39, 51]; // Indexes of the corner pieces on the Wheel of Fortune board that aren't used
    for (let i = 0; i < 52; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        if (deadSlots.includes(i)) tile.classList.add('dead'); // Hide the corner tiles
        tile.id = `tile-${i}`;
        board.appendChild(tile);
    }
}

// Calculates word wrapping and assigns characters to specific HTML tile divs
function layoutLetters() {
    const words = currentPuzzle.split(" ");
    
    // Row 1 and 4 have 12 slots. Row 2 and 3 have 14 slots.
    const rowStartsDefault = [1, 14, 27, 40]; // Starting tile index for default rows
    const rowStartsExpanded = [0, 13, 26, 39]; // Starting tile index for rows 2/3 if they need to be wider
    const rowLimitsDefault = 12; // Max chars for top/bottom row
    const rowLimitsExpanded = 13; // Max chars for middle rows (leaving room for spaces)
    
    let rowsUsed = [[], [], [], []]; // Array holding strings for each of the 4 rows
    let currentRow = 0;

    // Logic block that groups words into rows based on length limits
    words.forEach(word => {
        let currentLineText = rowsUsed[currentRow].join(" ");
        let spaceNeeded = currentLineText.length === 0 ? word.length : word.length + 1;
        let currentLimit = (currentRow === 1 || currentRow === 2) ? rowLimitsExpanded : rowLimitsDefault;

        if (currentLineText.length + spaceNeeded <= currentLimit) {
            rowsUsed[currentRow].push(word); // Fits on current row
        } else {
            currentRow++; // Move to next row down
            if (currentRow < 4) rowsUsed[currentRow] = [word];
        }
    });

    // Centers the puzzle vertically if it only uses 1 or 2 rows
    const totalLines = rowsUsed.filter(r => r.length > 0).length;
    let activeRowIndex = totalLines <= 2 ? 1 : 0; 

    // Loops through the assigned rows and injects the characters into the DOM elements
    rowsUsed.forEach(rowWords => {
        if (activeRowIndex >= 4 || rowWords.length === 0) return;
        let combinedRowText = rowWords.join(" ");
        let startTile;

        // Determines exact left-side starting position for centering purposes
        if (activeRowIndex === 1 || activeRowIndex === 2) {
            startTile = (combinedRowText.length > rowLimitsDefault) ? rowStartsExpanded[activeRowIndex] : rowStartsDefault[activeRowIndex];
        } else {
            startTile = rowStartsDefault[activeRowIndex];
        }

        let currentTileIndex = startTile;
        
        // Adds classes and text data to the specific tile
        rowWords.forEach((word, wordIdx) => {
            for (let char of word) {
                const tile = document.getElementById(`tile-${currentTileIndex}`);
                if (tile) {
                    tile.classList.add('active'); // Turns it white
                    if (/^[A-Z]$/.test(char)) {
                        tile.classList.add('hidden-letter'); // Hides the text
                        tile.dataset.letter = char; // Stores the letter behind the scenes
                    } else {
                        tile.innerText = char; // Automatically reveals symbols like ' or -
                        tile.classList.add('symbol-tile');
                    }
                }
                currentTileIndex++;
            }
            if (wordIdx < rowWords.length - 1) currentTileIndex++; // Add a space between words
        });
        activeRowIndex++;
    });
}

// Generates the QWERTY keyboard UI
function createKeyboard() {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = "";
    const rows = ["QWERTYUIOP".split(""), "ASDFGHJKL".split(""), "ZXCVBNM".split("")];
    
    // Loops through each row
    rows.forEach((row, rowIndex) => {
        // Adds invisible spacer elements to stagger the rows visually
        if (rowIndex === 1) {
            const s = document.createElement('div'); s.classList.add('key-spacer'); s.style.gridColumn = "span 1"; kb.appendChild(s);
        }
        if (rowIndex === 2) {
            const s = document.createElement('div'); s.classList.add('key-spacer'); s.style.gridColumn = "span 2"; kb.appendChild(s);
        }
        
        // Creates the physical button for each letter
        row.forEach(l => {
            const btn = document.createElement('button');
            btn.innerText = l;
            btn.classList.add('key');
            btn.id = `key-${l}`;
            btn.onclick = () => {
                // Routes click to the proper logic based on game state
                if (isBonusRound && !isSolving) handleBonusPick(l);
                else handleGuess(l);
            };
            kb.appendChild(btn);
        });
    });
}

// Updates the header to show correct money and highlights the player whose turn it is
function updateUI() {
    for (let i = 0; i < numPlayers; i++) {
        // Shows total bank if in bonus round, otherwise shows round bank
        const displayAmount = isBonusRound ? playerTotalBanks[i] : playerRoundBanks[i];
        const bankElement = document.getElementById(`p${i + 1}-bank`);
        
        const displayDiv = document.getElementById(`p${i + 1}-display`);
        displayDiv.innerHTML = `${playerNames[i]}: $<span id="p${i + 1}-bank">${displayAmount.toLocaleString()}</span>`;

        document.getElementById(`p${i + 1}-display`).classList.remove('active-turn'); // Removes outline
    }
    
    // Outlines the active player's name
    document.getElementById(`p${currentPlayer+1}-display`).classList.add('active-turn');

    // Controls whether the "Buy Vowel" button is clickable based on player money and puzzle state
    const buyBtn = document.getElementById('buy-vowel-btn');
    const hasVowelsLeft = checkVowelsRemaining();
    if (!hasVowelsLeft) {
        buyBtn.disabled = true; // Locks if no vowels exist in puzzle
        buyBtn.style.opacity = "0.5";
    } else {
        buyBtn.disabled = (playerRoundBanks[currentPlayer] < 250 || isBonusRound); // Locks if broke or in bonus round
        buyBtn.style.opacity = isBonusRound ? "0.5" : "1";
    }

    if (isSolving) {
        document.getElementById('solve-overlay').classList.remove('hidden');
        document.getElementById('keyboard-container').classList.remove('hidden');
    }
}

// Scans the active tiles to see if any hidden letters are A, E, I, O, or U
function checkVowelsRemaining() {
    const hiddenTiles = document.querySelectorAll('.tile.active.hidden-letter');
    const vowels = "AEIOU";
    return Array.from(hiddenTiles).some(tile => vowels.includes(tile.dataset.letter));
}

// Processes a user's letter guess during a standard turn
async function handleGuess(letter) {
    // Stop the 3-second consonant timer and hide the overlay as soon as a guess is made
    clearInterval(consonantTimer);
    document.getElementById('solve-overlay').classList.add('hidden');

    // If they are in the middle of typing a solve, route the input there instead
    if (isSolving) { handleSolveLetter(letter); return; }

    // Disable the key they just pressed
    const btn = document.getElementById(`key-${letter}`);
    btn.disabled = true;
    btn.classList.add('used'); 
    
    // Finds all tiles in the DOM that match the chosen letter
    let targets = Array.from(document.querySelectorAll(`.tile[data-letter='${letter}']`));
    
    if (targets.length > 0) {
        // Sorts tiles so they reveal from top-left to bottom-right
        targets.sort((a, b) => parseInt(a.id.split('-')[1]) - parseInt(b.id.split('-')[1]));
        togglePhase('revealLetter'); // Locks UI
        
        // Animates each tile flipping sequentially
        for (const t of targets) {
            t.classList.add('revealing');
            const dingSnd = document.getElementById('snd-ding');
            dingSnd.currentTime = 0; dingSnd.play().catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 750));
            t.classList.remove('revealing', 'hidden-letter'); 
            t.innerText = letter; 
        }
        
        // Awards money for each occurrence, provided it wasn't a purchased vowel
        if (!isVowelMode) {
            playerRoundBanks[currentPlayer] += (currentSpinValue * targets.length);
        }

        // Checks if that letter naturally completed the board
        const remainingHidden = document.querySelectorAll('.tile.active.hidden-letter');
        if (remainingHidden.length === 0) {
            document.getElementById('snd-win').currentTime = 0;
            document.getElementById('snd-win').play().catch(() => {});
            
            playerTotalBanks[currentPlayer] += playerRoundBanks[currentPlayer]; // Bank their winnings
            alert(`${playerNames[currentPlayer]} REVEALED THE ENTIRE PUZZLE!`);
            togglePhase('win'); // Triggers end of round UI
            return;
        }

        // Alerts players if they just bought/guessed the last vowel in the puzzle
        if (!hasAlertedNoVowels && !checkVowelsRemaining()) {
            alert("THERE ARE NO MORE VOWELS IN THE PUZZLE.");
            hasAlertedNoVowels = true;
        }
    } else {
        // Letter was not in the puzzle
        const wrongSnd = document.getElementById('snd-wrong');
        wrongSnd.currentTime = 0; wrongSnd.play().catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 5)); // Waits 5ms
        alert(`NO ${letter}!`);
        currentPlayer = (currentPlayer + 1) % numPlayers; // Passes turn to next player
    }
    
    isVowelMode = false; // Resets state
    togglePhase('menu'); // Shows action buttons again
}

// Inputs the typed letter into the currently highlighted tile during a solve attempt
function handleSolveLetter(letter) {
    if (currentSolveIndex < solveTiles.length) {
        const targetTile = solveTiles[currentSolveIndex];
        targetTile.innerText = letter;
        targetTile.classList.remove('hidden-letter');
        currentSolveIndex++; // Move cursor to next tile
        
        if (currentSolveIndex >= solveTiles.length) checkSolve(); // If that was the last tile, verify answer
        else highlightCurrentSolveTile(); // Otherwise flash the next empty tile
    }
}

// Applies a flashing CSS class to whichever tile the player needs to type into next
function highlightCurrentSolveTile() {
    // Remove existing highlight
    document.querySelectorAll('.tile').forEach(t => t.classList.remove('solving-active'));
    
    if (isSolving && solveTiles[currentSolveIndex]) {
        solveTiles[currentSolveIndex].classList.add('solving-active');
        
        // This prevents the flickering you see when a key is pressed
        const solveOverlay = document.getElementById('solve-overlay');
        const timerContainer = document.getElementById('timer-display');
        
        if (solveOverlay) solveOverlay.classList.remove('hidden');
        if (timerContainer) timerContainer.classList.remove('hidden');
    }
}

// Logic triggered when the user clicks "SPIN"
document.getElementById('spin-trigger').addEventListener('click', () => {
    isVowelMode = false;
    spinValueText.innerText = ""; 
    togglePhase('wheel'); // Slides the wheel up into view
    
    // Calculates a random spin time between 6 and 8 seconds
    const spinDuration = Math.floor(Math.random() * 2000) + 6000;
    const constantSpeed = 16;
    let startTime = null;
    let lastClickRotation = currentWheelRotation; 
    const clickSnd = document.getElementById('snd-click');

    // Animation loop using requestAnimationFrame for smooth spinning
    function animateWheel(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        if (elapsed < spinDuration) {
            // Cubic easing function to gradually slow down the spin
            const remaining = 1 - (elapsed / spinDuration);
            currentWheelRotation += constantSpeed * Math.pow(remaining, 3);
            wheelImg.style.transform = `rotate(${currentWheelRotation}deg)`;
            
            // Logic to play the "click" sound effect every time it passes a wedge boundary (approx 15 deg)
            const currentStep = Math.floor((currentWheelRotation + 7.5) / 15);
            const lastStep = Math.floor((lastClickRotation + 7.5) / 15);
            if (currentStep > lastStep) {
                clickSnd.currentTime = 0; clickSnd.play().catch(() => {});
                lastClickRotation = currentWheelRotation;
            }
            requestAnimationFrame(animateWheel);
        } else finalizeSpin(); // Spin finished
    }
    requestAnimationFrame(animateWheel);
});

// Determines what value the wheel landed on and triggers the outcome
function finalizeSpin() {
    const stopPoint = currentWheelRotation % 360;
    const wedgeSize = 5; // Math modifier due to wheel slice array layout
    const centerOffset = 2.5; 
    
    // Calculates which index of `newWheelSegments` array maps to the exact degree stopped at
    let actualDegree = (360 - stopPoint + centerOffset) % 360;
    if (actualDegree < 0) actualDegree += 360;
    currentSpinValue = newWheelSegments[Math.floor(actualDegree / wedgeSize)];
    
    // Only display the value over the wheel if it is a number (monetary value)
    if (typeof currentSpinValue === 'number') {
        spinValueText.innerText = `$${currentSpinValue.toLocaleString()}`;
    } else {
        spinValueText.innerText = ""; // Keep text empty for BANKRUPT or LOSE A TURN
    }

    // After 1.5 seconds, process the result
    setTimeout(() => {
        if (typeof currentSpinValue === 'number') {
            const displayValue = `$${currentSpinValue.toLocaleString()}`;
            // Normal money value, slide wheel down and show keyboard
            togglePhase('keyboard', `GUESS A CONSONANT (${displayValue})`);
        } else {
            // Penalty wedge
            if (currentSpinValue === "BANKRUPT") {
                playerRoundBanks[currentPlayer] = 0; // Wipes their round money
                triggerSpecialEffect('bankrupt'); // Plays full screen graphic
            } else if (currentSpinValue === "LOSE A TURN") {
                triggerSpecialEffect('loseaturn');
            } else {
                alert(currentSpinValue);
                currentPlayer = (currentPlayer + 1) % numPlayers;
                togglePhase('menu');
            }
        }
    }, 1500);
}

// Plays the full screen pop-in images for penalties and passes the turn
function triggerSpecialEffect(type) {
    const overlay = document.getElementById(`${type}-overlay`);
    if (type === 'bankrupt') {
        const bankruptSnd = document.getElementById('snd-bankrupt');
        bankruptSnd.currentTime = 0; bankruptSnd.play().catch(() => {});
    }
    
    overlay.classList.remove('hidden'); 
    overlay.classList.add('zoom-effect'); // Triggers CSS keyframe animation
    
    // After animation finishes, hide it and give turn to next player
    setTimeout(() => {
        overlay.classList.add('hidden'); 
        overlay.classList.remove('zoom-effect');
        currentPlayer = (currentPlayer + 1) % numPlayers;
        togglePhase('menu');
    }, 3600);
}

// Preps the board for the user to type in their guess for the whole phrase
function startSolveAttempt() {
    isSolving = true; 
    currentSolveIndex = 0;
    solveTiles = Array.from(document.querySelectorAll('.tile.active.hidden-letter')); // Gathers all blank tiles
    
    if (solveTiles.length === 0) return; // Failsafe
    
    // Play think music
    const solveMusic = document.getElementById('snd-solve-music');
    solveMusic.currentTime = 0; solveMusic.play().catch(() => {});
    
    togglePhase('solve'); // Changes UI to show timer
    highlightCurrentSolveTile(); // Flashes first tile
    
    // 20 second countdown logic
    let timeLeft = 20;
    const timerDisplay = document.getElementById('timer-text');
    timerDisplay.innerText = timeLeft;
    solveTimer = setInterval(() => {
        timeLeft--; timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) failSolve("OUT OF TIME!"); // Triggers fail if clock hits 0
    }, 1000);
}

// Called after the user types their final letter; validates if their spelling is perfect
function checkSolve() {
    clearInterval(solveTimer); // Stops clock
    document.getElementById('snd-solve-music').pause(); // Stops think music
    
    // Checks if text in every tile strictly matches the hidden dataset letter
    let isCorrect = solveTiles.every(tile => tile.innerText === tile.dataset.letter);

    if (isCorrect) {
        document.getElementById('snd-win').currentTime = 0;
        document.getElementById('snd-win').play().catch(() => {});
        
        if (isBonusRound) {
            // Awards random big prize for winning final round
            const prize = (Math.floor(Math.random() * 13) * 5000) + 40000;
            playerTotalBanks[currentPlayer] += prize;
            updateUI(); 
            alert(`YOU SOLVED IT! YOU WIN $${prize.toLocaleString()}!`);
        } else {
            // Adds their round bank to total bank
            playerTotalBanks[currentPlayer] += playerRoundBanks[currentPlayer];
            alert(`${playerNames[currentPlayer]} SOLVED IT!`);
        }
        togglePhase('win'); // Shows end of round buttons
    } else {
        failSolve("INCORRECT!"); // Typo or wrong guess
    }
    isSolving = false; // Clears solve state
}

// Processes an incorrect solve attempt or a timeout
function failSolve(msg) {
    document.getElementById('snd-solve-music').pause();
    const wrongSnd = document.getElementById('snd-wrong');
    wrongSnd.currentTime = 0; 
    wrongSnd.play().catch(() => {});
    
    alert(msg);
    clearInterval(solveTimer);
    isSolving = false;

    // Erases whatever they typed and turns tiles blank again
    solveTiles.forEach(t => {
        t.innerText = "";
        t.classList.add('hidden-letter');
        t.classList.remove('solving-active');
    });

    if (isBonusRound) {
        // If they fail bonus round, reveal the puzzle for them to see what it was
        document.querySelectorAll('.tile.active.hidden-letter').forEach(t => {
            t.innerText = t.dataset.letter;
            t.classList.remove('hidden-letter');
        });
        togglePhase('win'); // Game over
    } else {
        currentPlayer = (currentPlayer + 1) % numPlayers; // Passes turn
        togglePhase('menu'); // Normal turn UI
    }
}

// Subtracts money and triggers vowel keyboard rules if they click "Buy Vowel"
function prepareVowelPurchase() {
    if (playerRoundBanks[currentPlayer] >= 250) {
        playerRoundBanks[currentPlayer] -= 250;
        isVowelMode = true;
        updateUI(); // Refreshes bank numbers
        togglePhase('keyboard', "SELECT A VOWEL"); // Opens keyboard with only vowels enabled
    } else alert("YOU NEED $250 TO BUY A VOWEL."); // Failsafe
}

// Manages the 3-second countdown for consonant selection
function startConsonantTimer() {
    clearInterval(consonantTimer);
    let timeLeft = 3;
    const timerDisplay = document.getElementById('timer-text');
    const overlay = document.getElementById('solve-overlay');
    
    overlay.classList.remove('hidden');
    timerDisplay.innerText = timeLeft;
    
    consonantTimer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(consonantTimer);
            overlay.classList.add('hidden');
            const wrongSnd = document.getElementById('snd-wrong');
            wrongSnd.currentTime = 0; 
            wrongSnd.play().catch(() => {});
            currentPlayer = (currentPlayer + 1) % numPlayers;
            togglePhase('menu');
        }
    }, 1000);
}

// Massive utility function that manages hiding/showing HTML elements based on what is happening in the game
function togglePhase(phase, msg = "") {
    // Always clear the consonant timer when the game phase changes
    clearInterval(consonantTimer);

    // First, hide everything
    const screens = ['action-menu', 'wheel-container', 'keyboard-container', 'solve-overlay'];
    screens.forEach(s => {
        const el = document.getElementById(s);
        el.classList.add('hidden');
        if (s === 'wheel-container') el.classList.remove('visible'); // Special handling to push wheel down
    });

    // Then, selectively unhide elements depending on the required layout
    if (phase === 'revealLetter') {
        document.getElementById('action-menu').classList.add('hidden'); // Clean board view
    } else if (phase === 'menu') {
        document.getElementById('action-menu').classList.remove('hidden'); // Show 3 action buttons
        updateUI();
    } else if (phase === 'solve') {
        document.getElementById('solve-overlay').classList.remove('hidden'); // Show timer
        document.getElementById('keyboard-container').classList.remove('hidden'); // Show keyboard
        document.getElementById('instruction-text').innerText = "";
        document.querySelectorAll('.key').forEach(btn => btn.disabled = false); // All keys clickable
    } else if (phase === 'wheel') {
        const wc = document.getElementById('wheel-container');
        wc.classList.remove('hidden');
        setTimeout(() => wc.classList.add('visible'), 10); // Wheel slide up animation
    } else if (phase === 'bonus-picking') {
        document.getElementById('keyboard-container').classList.remove('hidden'); // Keyboard view
        document.getElementById('instruction-text').innerText = "CHOOSE 3 CONSONANTS AND 1 VOWEL";
        
        // Locks keys dynamically based on how many they have already picked
        const vowels = "AEIOU";
        "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(l => {
            const btn = document.getElementById(`key-${l}`);
            if (btn && !btn.classList.contains('used')) {
                const isV = vowels.includes(l);
                btn.disabled = isV ? (bonusVowelsPicked >= BONUS_VOWEL_LIMIT) : (bonusConsonantsPicked >= BONUS_CONSONANT_LIMIT);
            }
        });
    } else if (phase === 'keyboard') {
        document.getElementById('keyboard-container').classList.remove('hidden');
        document.getElementById('instruction-text').innerText = msg;
        
        // Triggers the 3-second timer if we are in a normal round and not buying a vowel
        if (!isVowelMode && !isBonusRound) {
            startConsonantTimer();
        }

        const vowels = "AEIOU";
        
        // Disables consonants if VowelMode is true, disables vowels if VowelMode is false
        "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(l => {
            const btn = document.getElementById(`key-${l}`);
            if (btn) {
                const isVowel = vowels.includes(l);
                const isUsed = btn.classList.contains('used');
                if (isUsed) btn.disabled = true;
                else btn.disabled = isVowelMode ? !isVowel : isVowel;
            }
        });
    } else if (phase === 'win') {
        // Hides normal turn buttons and reveals flow-control buttons
        document.getElementById('action-menu').classList.remove('hidden');
        document.getElementById('spin-trigger').classList.add('hidden');
        document.getElementById('buy-vowel-btn').classList.add('hidden');
        document.getElementById('solve-trigger').classList.add('hidden');
        
        if (isBonusRound) {
            document.getElementById('play-again-btn').classList.remove('hidden'); // Option to restart
        } else if (currentRound < 3) {
            document.getElementById('next-round-btn').classList.remove('hidden'); // Normal progression
        } else {
            // Dynamically injects Bonus Round button if Round 3 just ended
            let bonusBtn = document.getElementById('bonus-round-btn');
            if (!bonusBtn) {
                bonusBtn = document.createElement('button');
                bonusBtn.id = "bonus-round-btn";
                bonusBtn.innerText = "BONUS ROUND";
                bonusBtn.className = "bonus-round-trigger-btn";
                bonusBtn.onclick = () => showLeaderboard();
                document.getElementById('action-menu').appendChild(bonusBtn);
            }
            bonusBtn.classList.remove('hidden');
        }
        updateUI();
    }
}

// Starts playing the background theme music as soon as the page loads
window.onload = () => {
    const menuSnd = document.getElementById('snd-menu');
    menuSnd.play().catch(() => {
        // Browser policy fallback: waits for user interaction before playing audio if auto-play fails
        window.addEventListener('mousedown', () => {
            if (menuSnd.paused) menuSnd.play();
        }, { once: true });
    });
};

// Smoothly lowers the volume of the theme music over 1 second when the user clicks Play
function fadeOutMenuMusic() {
    const menuSnd = document.getElementById('snd-menu');
    let volume = 1.0;
    const fadeInterval = setInterval(() => {
        if (volume > 0.05) {
            volume -= 0.05; menuSnd.volume = volume;
        } else {
            clearInterval(fadeInterval); menuSnd.pause(); menuSnd.volume = 1.0; // Resets for potential replay
        }
    }, 50); // Drops volume by 5% every 50 milliseconds
}

// Small UI controls for the edge-of-screen credits panel
function openCredits() { document.getElementById('credits-modal').style.display = 'flex'; }
function closeCredits() { document.getElementById('credits-modal').style.display = 'none'; }
// Allows hitting ESC on keyboard to close the credits overlay
window.addEventListener('keydown', (e) => { if (e.key === "Escape") closeCredits(); });

function initTossUp() {
    const data = allCategories[Math.floor(Math.random() * allCategories.length)];
    document.getElementById('category-text').innerText = data.category;
    currentPuzzle = data.puzzles[Math.floor(Math.random() * data.puzzles.length)].toUpperCase();
    
    createGrid();
    layoutLetters();
    createKeyboard(); 
    
    // UI Setup: Hide standard action buttons and show Toss-Up buzzers
    document.getElementById('action-menu').classList.add('hidden'); // REMOVES ACTION BUTTONS
    document.getElementById('keyboard-container').classList.add('hidden'); // Keep keyboard hidden until buzz
    document.getElementById('toss-up-buttons').classList.remove('hidden');
    
    const btnContainer = document.getElementById('buzz-buttons-container');
    btnContainer.innerHTML = "";
    
    tossUpEligiblePlayers = [];
    for(let i = 0; i < numPlayers; i++) {
        tossUpEligiblePlayers.push(i);
        const btn = document.createElement('button');
        btn.className = `buzz-btn buzz-p${i+1}`;
        btn.innerText = playerNames[i];
        btn.onclick = () => buzzIn(i);
        btnContainer.appendChild(btn);
    }

    tossUpRevealedIndices = [];
    document.getElementById('snd-toss-up').currentTime = 0;
    document.getElementById('snd-toss-up').play();
    
    tossUpInterval = setInterval(revealTossUpLetter, 1000);
}

function buzzIn(playerIndex) {
    clearInterval(tossUpInterval);
    currentPlayer = playerIndex;
    updateUI(); 
    
    // UI Swap: Hide buzzers and reveal keyboard/solve interface
    document.getElementById('toss-up-buttons').classList.add('hidden');
    document.getElementById('action-menu').classList.add('hidden');
    
    const kbContainer = document.getElementById('keyboard-container');
    const solveOverlay = document.getElementById('solve-overlay');
    const timerDisplay = document.getElementById('timer-text');

    kbContainer.classList.remove('hidden');
    solveOverlay.classList.remove('hidden');

    isSolving = true;
    currentSolveIndex = 0;
    solveTiles = Array.from(document.querySelectorAll('.tile.active.hidden-letter'));
    highlightCurrentSolveTile();
    
    // Initialize 10 second timer
    clearInterval(solveTimer);
    let timeLeft = 10;
    timerDisplay.innerText = timeLeft;

    solveTimer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(solveTimer);
            handleTossUpFailure(playerIndex);
        }
    }, 1000);
    
    // Override the solve submission logic
    const originalCheckSolve = window.checkSolve; 
    window.checkSolve = function() {
        let isCorrect = solveTiles.every(tile => tile.innerText === tile.dataset.letter);

        if (isCorrect) {
            // 1. Stop timer but KEEP keyboard visible for now
            clearInterval(solveTimer);
            document.getElementById('snd-toss-up').pause();

            // 2. Play win sound immediately
            const winSnd = document.getElementById('snd-win');
            winSnd.currentTime = 0;
            winSnd.play().catch(() => {});

            // 3. Update bank and reveal puzzle
            playerTotalBanks[currentPlayer] += tossUpValue;
            document.querySelectorAll('.tile.active.hidden-letter').forEach(t => {
                t.classList.remove('hidden-letter');
                t.innerText = t.dataset.letter;
            });

            // 4. Show the alert while keyboard is still visible
            alert(`${playerNames[currentPlayer]} SOLVED IT FOR $${tossUpValue.toLocaleString()}!`);

            // 5. NOW hide the keyboard/solve interface
            document.getElementById('keyboard-container').classList.add('hidden');
            document.getElementById('solve-overlay').classList.add('hidden');
            isSolving = false;

            // 6. Wait for the win music to finish before showing leaderboard
            winSnd.onended = () => {
                showLeaderboard();
            };

        } else {
            clearInterval(solveTimer);
            handleTossUpFailure(playerIndex);
        }
        window.checkSolve = originalCheckSolve; 
    };
}

function revealTossUpLetter() {
    const hiddenTiles = Array.from(document.querySelectorAll('.tile.hidden-letter'));
    if (hiddenTiles.length <= 1) { // Leave one letter for the end or stop if full
        clearInterval(tossUpInterval);
        return;
    }
    const randomTile = hiddenTiles[Math.floor(Math.random() * hiddenTiles.length)];
    randomTile.classList.remove('hidden-letter');
    randomTile.innerText = randomTile.dataset.letter;
    document.getElementById('snd-ding').currentTime = 0;
    document.getElementById('snd-ding').play().catch(() => {});
}

function handleTossUpFailure(playerIndex) {
    const wrongSnd = document.getElementById('snd-wrong');
    wrongSnd.currentTime = 0; 
    wrongSnd.play().catch(() => {});
    
    alert("INCORRECT!");
    isSolving = false;

    solveTiles.forEach(t => {
        t.innerText = "";
        t.classList.add('hidden-letter');
        t.classList.remove('solving-active');
    });

    tossUpEligiblePlayers = tossUpEligiblePlayers.filter(p => p !== playerIndex);

    if (tossUpEligiblePlayers.length > 0) {
        document.getElementById('keyboard-container').classList.add('hidden');
        document.getElementById('solve-overlay').classList.add('hidden');
        document.getElementById('toss-up-buttons').classList.remove('hidden');
        
        document.querySelectorAll('.buzz-btn').forEach((b, idx) => {
            b.disabled = !tossUpEligiblePlayers.includes(idx);
        });

        tossUpInterval = setInterval(revealTossUpLetter, 1000);
    } else {
        document.getElementById('snd-toss-up').pause();
        alert("PUZZLE NOT SOLVED.");
        setTimeout(showLeaderboard, 2000);
    }
}