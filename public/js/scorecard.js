/**
 * Badminton Scorecard Script for Referee System
 * - Integrates with referee dashboard and database
 * - Real-time score tracking and persistence
 * - Service logic and deuce/advantage handling
 * - Match completion and winner determination
 */

/* -------------------------
   Config & State
   ------------------------- */
const state = {
    maxPoints: 15,
    maxSetsToWin: 2,
    currentSet: 0,
    scores: [0, 0],
    setsWon: [0, 0],
    setHistory: [[], []],
    server: 0,
    initialServer: 0,
    isMatchActive: false,
    lastActions: [],
    matchNumber: 1,
    setResults: [],
    matchData: null,
    pendingSetWin: null // Track pending set win for confirmation
};

/* -------------------------
   Cached DOM nodes
   ------------------------- */
const scoreEls = [document.getElementById('score0'), document.getElementById('score1')];
const setsEls = [document.getElementById('sets0'), document.getElementById('sets1')];
const advEls = [document.getElementById('advBadge0'), document.getElementById('advBadge1')];
const playerCards = [document.getElementById('player0'), document.getElementById('player1')];
const flashEls = [document.getElementById('flash0'), document.getElementById('flash1')];

const currentSetEl = document.getElementById('currentSetDisplay');
const displayMaxPointsEl = document.getElementById('displayMaxPoints');
const displayMaxSetsEl = document.getElementById('displayMaxSets');
const initialServerIndicatorEl = document.getElementById('initialServerIndicator');
const matchNumberEl = document.getElementById('matchNumber');
const setStartBtn = document.getElementById('setStartBtn');
const setStartContainer = document.getElementById('setStartContainer');
const setNumberIndicator = document.getElementById('setNumberIndicator');
const setConfirmation = document.getElementById('setConfirmation');
const confirmSetNumber = document.getElementById('confirmSetNumber');
const confirmSetNumberText = document.getElementById('confirmSetNumberText');
const setConfirmBtn = document.getElementById('setConfirmBtn');
const setCancelBtn = document.getElementById('setCancelBtn');

const toggleServeBtn = document.getElementById('toggleServeBtn');
const resetMatchBtn = document.getElementById('resetMatchBtn');
const undoBtn = document.getElementById('undoBtn');
const undoContainer = document.getElementById('undoContainer');

const overlay = document.getElementById('overlay');
const overlayClose = document.getElementById('overlayClose');
const winnerText = document.getElementById('winnerText');
const winnerTitle = document.getElementById('winnerTitle');

const setWinsContainer = document.getElementById('setWinsContainer');
const setWinsList = document.getElementById('setWinsList');

// Add new DOM elements for set win confirmation
const setWinConfirmation = document.getElementById('setWinConfirmation');
const setWinConfirmText = document.getElementById('setWinConfirmText');
const setWinConfirmBtn = document.getElementById('setWinConfirmBtn');
const setWinCancelBtn = document.getElementById('setWinCancelBtn');

/* -------------------------
   Utility Helpers
   ------------------------- */
function clamp(value, min=0, max=9999){ return Math.max(min, Math.min(max, value)); }
function animateScore(index){
    const el = scoreEls[index];
    el.classList.add('anim');
    setTimeout(()=>el.classList.remove('anim'), 200);
}
function showFlash(index){
    const f = flashEls[index];
    f.classList.add('show');
    setTimeout(()=>f.classList.remove('show'), 900);
}
function updateServerUI(){
    if (state.currentSet === 0) {
        playerCards.forEach(card => card.classList.remove('serving'));
        return;
    }
    
    playerCards.forEach((card, idx)=>{
        if(idx === state.server) {
            card.classList.add('serving');
        } else {
            card.classList.remove('serving');
        }
    });
}

function updateSetUI() {
    if (state.currentSet === 0) {
        currentSetEl.textContent = '-';
        setStartContainer.style.display = 'block';
        setNumberIndicator.textContent = '1';
        document.querySelectorAll('.btn[data-action="inc"]').forEach(btn => {
            btn.disabled = true;
        });
        toggleServeBtn.disabled = true;
        undoContainer.style.display = 'none';
        setWinsContainer.style.display = 'none';
    } else {
        currentSetEl.textContent = state.currentSet;
        setStartContainer.style.display = 'none';
        document.querySelectorAll('.btn[data-action="inc"]').forEach(btn => {
            btn.disabled = false;
        });
        toggleServeBtn.disabled = false;
        undoContainer.style.display = 'flex';
        setWinsContainer.style.display = 'block';
    }
}

function updateSetWinsDisplay() {
    setWinsList.innerHTML = '';
    
    if (state.setResults.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'No sets completed yet';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#999';
        setWinsList.appendChild(emptyMsg);
        return;
    }
    
    state.setResults.forEach(result => {
        const setWinItem = document.createElement('div');
        setWinItem.className = 'set-win-item';
        
        const setInfo = document.createElement('div');
        setInfo.textContent = `Set ${result.setNumber}`;
        
        const scoreInfo = document.createElement('div');
        scoreInfo.textContent = `${result.winnerName} won ${result.score}`;
        scoreInfo.style.fontWeight = '600';
        
        setWinItem.appendChild(setInfo);
        setWinItem.appendChild(scoreInfo);
        setWinsList.appendChild(setWinItem);
    });
}

/* -------------------------
   Core Game Logic
   ------------------------- */

// start or reset for new match
function startMatch(){
    state.currentSet = 0;
    state.scores = [0,0];
    state.setsWon = [0,0];
    state.setHistory = [[], []];
    state.server = state.initialServer;
    state.isMatchActive = true;
    state.lastActions = [];
    state.setResults = [];
    state.pendingSetWin = null;
    updateAllUI();
}

// full reset
function fullReset(){
    startMatch();
    hideOverlay();
}

// Start a new set
function startNewSet() {
    if (state.currentSet === 0) {
        state.currentSet = 1;
    }
    state.scores = [0, 0];
    updateAllUI();
}

/**
 * Add a point to player (0 or 1). Handles:
 *  - Rally winner becomes server
 *  - Deuce / advantage logic and determining set winner
 */
function addPointToPlayer(pIndex){
    if(!state.isMatchActive || state.currentSet === 0) return;
    const other = 1 - pIndex;

    // Save snapshot for undo (only for points, not set wins)
    state.lastActions.push({
        type: 'point',
        player: pIndex,
        prev: {
            scores: [...state.scores],
            setsWon: [...state.setsWon],
            currentSet: state.currentSet,
            server: state.server,
            setHistory: JSON.parse(JSON.stringify(state.setHistory)),
            setResults: JSON.parse(JSON.stringify(state.setResults))
        }
    });

    // Rally winner serves next
    state.server = pIndex;

    // Add point
    state.scores[pIndex] = clamp(state.scores[pIndex] + 1, 0, 9999);
    animateScore(pIndex);

    // Check if this point would win the set and show confirmation
    const setWinner = checkSetWinCondition();
    if (setWinner !== null) {
        // Show confirmation before awarding the set win
        showSetWinConfirmation(setWinner);
    } else {
        // No set win, just update UI
        evaluateSetState();
        updateAllUI();
        updateBackendScore();
    }
}

/**
 * Check if the current score would win the set
 * Returns the player index who would win, or null if no win
 */
function checkSetWinCondition() {
    const m = state.maxPoints;
    const [a, b] = state.scores;
    const lead = Math.abs(a - b);

    // Determine if we are in deuce region
    const deuceThreshold = m - 1;
    let setWonBy = null;

    if(a >= m || b >= m){
        // If both below deuce threshold, simple winner
        if(a >= m && a - b >= 2) setWonBy = 0;
        if(b >= m && b - a >= 2) setWonBy = 1;

        // If both reached deuceThreshold (e.g., 14) -> still require 2 lead
        if(a >= deuceThreshold && b >= deuceThreshold){
            if(lead >= 2){
                setWonBy = a > b ? 0 : 1;
            }
        } else {
            // Not both reached deuce threshold: if someone reached m and opponent <= m-2 OR lead >=2
            if(a >= m && a - b >= 2) setWonBy = 0;
            if(b >= m && b - a >= 2) setWonBy = 1;
        }
    }

    return setWonBy;
}

/**
 * Evaluate set conditions after a point change.
 * - Normal win: reaches maxPoints and opponent < maxPoints - 1
 * - Deuce region: if both >= maxPoints - 1, need 2 point lead
 */
function evaluateSetState(){
    const m = state.maxPoints;
    const [a, b] = state.scores;
    const lead = Math.abs(a - b);

    // Determine if we are in deuce region
    const deuceThreshold = m - 1;

    if(a >= deuceThreshold && b >= deuceThreshold){
        // show advantage when lead ==1
        if(lead === 1){
            showAdvantage(a > b ? 0 : 1);
        } else {
            hideAdvantages();
        }
    } else {
        hideAdvantages();
    }
}

/**
 * Handle a player winning the set.
 * - Record set score
 * - Increment setsWon
 * - If match won (setsWon >= maxSetsToWin) show overlay
 * - Reset scores for next set, increment currentSet
 * - Server: keep as the winner (they were last rally winner)
 */
async function handleSetWin(winnerIndex){
    const loserIndex = 1 - winnerIndex;
    const winnerName = document.getElementById(`name${winnerIndex}`).textContent.trim() || `Player ${winnerIndex + 1}`;
    const score = `${state.scores[winnerIndex]}-${state.scores[loserIndex]}`;
    
    // Record the set result
    state.setResults.push({
        setNumber: state.currentSet,
        winnerIndex: winnerIndex,
        winnerName: winnerName,
        score: score
    });
    
    // Record the set score in history
    state.setHistory[winnerIndex].push(score);
    
    state.setsWon[winnerIndex] += 1;
    // Flash their panel
    showFlash(winnerIndex);

    // Clear the undo history when a set is won
    state.lastActions = [];

    // Update backend with set completion
    await updateBackendSetCompletion(winnerIndex);

    // Check match winner
    if(state.setsWon[winnerIndex] >= state.maxSetsToWin){
        // Match ends
        state.isMatchActive = false;
        updateAllUI();
        showMatchWinner(winnerIndex);
        
        // Update backend with match completion
        await updateBackendMatchCompletion(winnerIndex);
        return;
    }

    // Show set completion popup
    showSetCompletionPopup(winnerIndex);

    // UI update
    updateAllUI();
}

/* Advantage display helpers */
function showAdvantage(index){
    advEls[index].style.display = 'inline-block';
    advEls[1-index].style.display = 'none';
}
function hideAdvantages(){
    advEls.forEach(e => e.style.display = 'none');
}

/* Undo functionality - Only works for points, not set wins */
function undoLastAction() {
    if (state.lastActions.length === 0) return;
    
    const lastAction = state.lastActions.pop();
    
    // Only allow undoing point actions, not set wins
    if (lastAction.type === 'point') {
        const prev = lastAction.prev;
        
        // Restore previous state
        state.scores = prev.scores;
        state.setsWon = prev.setsWon;
        state.currentSet = prev.currentSet;
        state.server = prev.server;
        state.setHistory = prev.setHistory;
        state.setResults = prev.setResults;
        
        // If we're undoing the first action of a set, we might need to reactivate the match
        if (state.currentSet > 0) {
            state.isMatchActive = true;
        }
        
        updateAllUI();
        
        // Also update backend with the restored score
        updateBackendScore();
    }
}

/* -------------------------
   Set Win Confirmation
   ------------------------- */
function showSetWinConfirmation(winnerIndex) {
    state.pendingSetWin = winnerIndex;
    const winnerName = document.getElementById(`name${winnerIndex}`).textContent.trim() || `Player ${winnerIndex + 1}`;
    const score = `${state.scores[winnerIndex]}-${state.scores[1-winnerIndex]}`;
    
    setWinConfirmText.innerHTML = `<strong>${winnerName}</strong> would win Set ${state.currentSet} with a score of ${score}. Confirm?`;
    setWinConfirmation.classList.remove('hidden');
}

function hideSetWinConfirmation() {
    setWinConfirmation.classList.add('hidden');
    state.pendingSetWin = null;
}

function confirmSetWin() {
    if (state.pendingSetWin !== null) {
        handleSetWin(state.pendingSetWin);
        hideSetWinConfirmation();
    }
}

function cancelSetWin() {
    // Revert the last point if canceled
    undoLastAction();
    hideSetWinConfirmation();
}

/* -------------------------
   Backend API Integration
   ------------------------- */
async function fetchMatchInfo() {
    try {
        const response = await fetch('/scorecard/get-match-info');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching match info:', error);
        return null;
    }
}

async function updateBackendScore() {
    try {
        const response = await fetch('/scorecard/update-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                player1Point: state.scores[0],
                player2Point: state.scores[1],
                currentSet: state.currentSet,
                matchId : state.matchData._id,
                matchType : state.matchData.matchType,
                server: state.server === 0 ? state.matchData.playerName1 : state.matchData.playerName2
            })
        });

        console.log(state.setsWon);
        
        if (!response.ok) {
            console.error('Failed to update score on backend');
        }
    } catch (error) {
        console.error('Error updating score:', error);
    }
}

async function updateBackendSetCompletion(winnerIndex) {
    try {
        const response = await fetch('/scorecard/complete-set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                setNumber: state.currentSet,
                winnerIndex: winnerIndex,
                player1Point: state.scores[0],
                player2Point: state.scores[1],
                matchId : state.matchData._id,
                matchType : state.matchData.matchType,
                server: state.server === 0 ? state.matchData.playerName1 : state.matchData.playerName2
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            console.error('Failed to update set completion on backend');
        }else{
            document.getElementById('advBadge0').style.display = 'none';
            document.getElementById('advBadge1').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error updating set completion:', error);
    }
}

async function updateBackendMatchCompletion(winnerIndex) {
    try {
        const response = await fetch('/scorecard/complete-match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                winnerIndex: winnerIndex,
                setsWon: state.setsWon,
                matchId : state.matchData._id,
                matchType : state.matchData.matchType
            })
        });
        
        const data = await response.json();
        if (!data.success) {
            console.error('Failed to update match completion on backend');
        }
        
        // window.location.href = '/refree';

    } catch (error) {
        console.error('Error updating match completion:', error);
    }
}

/* -------------------------
   UI Update logic
   ------------------------- */
function updateAllUI(){
    // scores
    scoreEls.forEach((el, idx) => {
        el.textContent = state.scores[idx];
    });

    // sets
    setsEls.forEach((el, idx) => {
        el.textContent = state.setsWon[idx];
    });

    // match number
    matchNumberEl.textContent = state.matchData ? state.matchData.matchNo : '1';
    
    displayMaxPointsEl.textContent = state.maxPoints;
    displayMaxSetsEl.textContent = state.matchData.maxSets;
    initialServerIndicatorEl.textContent = document.getElementById('name0').textContent.trim() || 'Player 1';
    updateServerUI();
    updateSetUI();
    updateSetWinsDisplay();

    // Enable/disable undo button
    undoBtn.disabled = state.lastActions.length === 0;

    // If match inactive (because winner), indicate visually
    if(!state.isMatchActive){
        document.querySelectorAll('.btn[data-action="inc"]').forEach(btn=>{
            btn.disabled = true;
        });
        toggleServeBtn.disabled = true;
    }
}

/* -------------------------
   Overlay / Winner UI
   ------------------------- */
function showMatchWinner(winnerIdx){
    winnerTitle.textContent = 'Match Winner';
    const name = document.getElementById(`name${winnerIdx}`).textContent.trim() || `Player ${winnerIdx+1}`;
    winnerText.innerHTML = `<strong>${name}</strong> wins the match (${state.setsWon[winnerIdx]} - ${state.setsWon[1-winnerIdx]})`;
    
    // Generate match summary
    const summaryHTML = generateMatchSummary();
    document.getElementById('matchSummary').innerHTML = summaryHTML;
    
    overlay.classList.remove('hidden');
}

function hideOverlay(){
    overlay.classList.add('hidden');
}

function generateMatchSummary() {
    let html = '<div class="summary-container">';
    html += '<h3>Match Summary</h3>';
    
    state.setResults.forEach(result => {
        html += `
            <div class="summary-row">
                <span>Set ${result.setNumber}</span>
                <span>${result.winnerName} won (${result.score})</span>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

function showSetCompletionPopup(winnerIndex) {
    const setCompletionOverlay = document.getElementById('setCompletionOverlay');
    const setCompletionText = document.getElementById('setCompletionText');
    const winnerName = document.getElementById(`name${winnerIndex}`).textContent.trim() || `Player ${winnerIndex + 1}`;
    
    setCompletionText.innerHTML = `<strong>${winnerName}</strong> won Set ${state.currentSet}!`;
    
    // Show current match status in the summary
    const summaryHTML = `
        <div class="set-summary-details">
            <p>Match Score: ${state.setsWon[0]} - ${state.setsWon[1]}</p>
            <p>Set Score: ${state.scores[winnerIndex]}-${state.scores[1-winnerIndex]}</p>
        </div>
    `;
    document.getElementById('setCompletionSummary').innerHTML = summaryHTML;
    
    setCompletionOverlay.classList.remove('hidden');
}

function showSetConfirmation() {
    state.isMatchActive = true;
    confirmSetNumber.textContent = state.currentSet + 1;
    confirmSetNumberText.textContent = state.currentSet + 1;
    setConfirmation.classList.remove('hidden');
}

function hideSetConfirmation() {
    setConfirmation.classList.add('hidden');
}

/* -------------------------
   Event Listeners
   ------------------------- */

// inc buttons (event delegation)
document.addEventListener('click', (e)=>{
    const target = e.target.closest('[data-action]');
    if(!target) return;
    const action = target.dataset.action;
    const p = parseInt(target.dataset.player);
    if(action === 'inc') addPointToPlayer(p);
});

// set start button
setStartBtn.addEventListener('click', () => {
    showSetConfirmation();
});

// set confirmation buttons
setConfirmBtn.addEventListener('click', () => {
    hideSetConfirmation();
    startNewSet();
});

setCancelBtn.addEventListener('click', () => {
    hideSetConfirmation();
});

// set win confirmation buttons
setWinConfirmBtn.addEventListener('click', confirmSetWin);
setWinCancelBtn.addEventListener('click', cancelSetWin);

// toggle server manually
toggleServeBtn.addEventListener('click', ()=>{
    state.server = 1 - state.server;
    updateAllUI();
    updateBackendScore();
});

// full reset
resetMatchBtn.addEventListener('click', ()=>{
    if(confirm('Reset match to defaults?')) fullReset();
});

// undo button
undoBtn.addEventListener('click', undoLastAction);

// overlay close
// overlayClose.addEventListener('click', hideOverlay);

// allow names to be edited and reflected
document.getElementById('name0').addEventListener('input', updateAllUI);
document.getElementById('name1').addEventListener('input', updateAllUI);

// Add event listener for complete match button
document.getElementById('completeMatchBtn').addEventListener('click', () => {
    window.location.href = '/refree';
});

// Add event listener for start next set button
document.getElementById('startNextSetBtn').addEventListener('click', () => {
    document.getElementById('setCompletionOverlay').classList.add('hidden');
    state.currentSet += 1;
    state.scores = [0,0];
    state.isMatchActive = true;
    updateAllUI();
});

/* -------------------------
   Initialize the application
   ------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch match data from backend
    const matchData = await fetchMatchInfo();
    
    if (matchData) {
        state.matchData = matchData;
        state.maxPoints = matchData.maxSetPoint || 15;
        state.maxSetsToWin = Math.floor(matchData.maxSets / 2 + 1) || 2;
        
        // Set player names
        document.getElementById('name0').textContent = matchData.playerName1 || matchData.teamName1;
        document.getElementById('name1').textContent = matchData.playerName2 || matchData.teamName2;
        
        console.log(matchData);
        // Set initial server based on backend data
        if (matchData.set && matchData.set.length > 0) {
            const currentSet = matchData.set[matchData.set.length - 1];
            if(matchData.playerName1){
                state.initialServer = currentSet.serve === matchData.playerName1 ? 0 : 1;
            }else{
                state.initialServer = currentSet.serve === matchData.teamName1 ? 0 : 1;
            }
            
            state.server = state.initialServer;
            
            // If set is already in progress, load the scores
            if (!currentSet.isSetComplete) {
                state.currentSet = matchData.set.length;
                state.scores = [currentSet.player1Point, currentSet.player2Point];
                state.isMatchActive = true;
                
                // Load completed sets
                for (let i = 0; i < matchData.set.length - 1; i++) {
                    const set = matchData.set[i];
                    if (set.isSetComplete) {
                        const winnerIndex = set.player1Point > set.player2Point ? 0 : 1;
                        let winnerName = '';
                        if(matchData.playerName1){
                            winnerName = winnerIndex === 0 ? matchData.playerName1 : matchData.playerName2;
                        }else{
                            winnerName = winnerIndex === 0 ? matchData.teamName1 : matchData.teamName2;
                        }
                         
                        const score = `${set.player1Point}-${set.player2Point}`;
                        
                        state.setResults.push({
                            setNumber: i + 1,
                            winnerIndex: winnerIndex,
                            winnerName: winnerName,
                            score: score
                        });
                        
                        state.setsWon[winnerIndex]++;
                        state.setHistory[winnerIndex].push(score);
                    }
                }
            }
        }
    }
    
    updateAllUI();
});