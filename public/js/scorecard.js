/**
 * Badminton Scorecard Script
 * - Uses backend data for match configuration
 * - Service logic: rally winner becomes server
 * - Deuce/Advantage logic: at 14-14, need 2-point lead
 * - Set history tracking
 * - Mobile responsive design
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
    pendingSetWin: null, // Track pending set win for confirmation
    matchCompleted: false // Track if match is completed to prevent interactions
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
   Load saved scorecard data
   ------------------------- */
// Enhanced loadSavedScorecardData function with better debugging
// Enhanced loadSavedScorecardData function with better debugging
async function loadSavedScorecardData() {
    try {
        const urlParams = getUrlParams();
        console.log('🔄 loadSavedScorecardData called with params:', urlParams);
        
        if (!urlParams.matchId || !urlParams.gender || !urlParams.matchNumber) {
            console.log('❌ No match ID, gender, or match number, skipping saved data load');
            return false;
        }
        
        console.log('🔍 Fetching saved scorecard data...');
        const response = await fetch(`/scorecard/get-match-info?matchId=${urlParams.matchId}&matchType=${urlParams.gender}&matchNumber=${urlParams.matchNumber}`);
        
        if (!response.ok) {
            console.error('❌ Failed to fetch match info:', response.status);
            return false;
        }
        
        const data = await response.json();
        console.log('🔍 Received match info response:', data);
        
        if (data.success) {
            console.log('✅ Successfully loaded match data');
            console.log('🔍 isMatchStarted:', data.isMatchStarted);
            console.log('🔍 scorecardData:', data.scorecardData);
            
            // Check if match is started
            if (data.isMatchStarted) {
                console.log('✅ Match is started, processing data...');
                
                if (data.scorecardData) {
                    console.log('✅ Loading saved scorecard data:', data.scorecardData);
                    const savedData = data.scorecardData;
                    
                    // Restore match state from saved data
                    state.isMatchActive = true;
                    state.lastActions = [];
                    
                    // Restore current set and scores
                    if (savedData.currentSet !== undefined) {
                        state.currentSet = savedData.currentSet + 1; // Convert back to 1-indexed
                        console.log(`✅ Restored current set: ${state.currentSet}`);
                    } else {
                        state.currentSet = 1;
                        console.log('✅ Defaulting to set 1');
                    }
                    
                    if (savedData.currentScore) {
                        state.scores = [savedData.currentScore.player1, savedData.currentScore.player2];
                        state.server = savedData.currentScore.server;
                        console.log(`✅ Restored scores: ${state.scores[0]} - ${state.scores[1]}, server: ${state.server}`);
                    } else {
                        state.scores = [0, 0];
                        state.server = state.initialServer;
                        console.log('✅ Defaulting to fresh scores');
                    }
                    
                    // Restore completed sets
                    state.setsWon = [0, 0];
                    state.setResults = [];
                    state.setHistory = [[], []];
                    
                    if (savedData.scores && savedData.scores.length > 0) {
                        console.log(`✅ Found ${savedData.scores.length} sets in saved data`);
                        
                        for (let i = 0; i < savedData.scores.length; i++) {
                            const setData = savedData.scores[i];
                            if (setData.isComplete) {
                                const winnerIndex = setData.player1Score > setData.player2Score ? 0 : 1;
                                const score = `${setData.player1Score}-${setData.player2Score}`;
                                
                                state.setsWon[winnerIndex]++;
                                state.setHistory[winnerIndex].push(score);
                                state.setResults.push({
                                    setNumber: setData.setNumber,
                                    winnerIndex: winnerIndex,
                                    winnerName: winnerIndex === 0 ? 
                                        (state.matchData?.playerName1 || 'Player 1') : 
                                        (state.matchData?.playerName2 || 'Player 2'),
                                    score: score
                                });
                                console.log(`✅ Restored completed set ${setData.setNumber}: ${score}`);
                            }
                        }
                    } else {
                        console.log('✅ No completed sets found in saved data');
                    }
                    
                    console.log('✅ Final restored state:', {
                        currentSet: state.currentSet,
                        scores: state.scores,
                        server: state.server,
                        setsWon: state.setsWon,
                        completedSets: state.setResults.length
                    });
                    
                    // Update UI with restored state
                    updateAllUI();
                    
                    return true; // Successfully restored data
                } else {
                    console.log('✅ Match started but no scorecard data, starting fresh');
                    // Match is started but no scorecard data yet, start fresh
                    state.isMatchActive = true;
                    state.currentSet = 1;
                    state.scores = [0, 0];
                    state.server = state.initialServer;
                    updateAllUI();
                    return true;
                }
            } else {
                console.log('❌ Match not started yet');
                return false;
            }
        } else {
            console.log('❌ Failed to load match data:', data.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error loading saved scorecard data:', error);
        return false;
    }
}
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
    console.log('Match started with state:', state);
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
        state.isMatchActive = true;
    }
    state.scores = [0, 0];
    console.log('Starting new set:', { 
        currentSet: state.currentSet, 
        isMatchActive: state.isMatchActive,
        server: state.server 
    });
    updateAllUI();
}

/**
 * Add a point to player (0 or 1). Handles:
 *  - Rally winner becomes server
 *  - Deuce / advantage logic and determining set winner
 */
function addPointToPlayer(pIndex){
    if(!state.isMatchActive || state.currentSet === 0) return;
    
    // Additional check: prevent scoring if match is completed
    if (state.matchCompleted) {
        console.log('⚠️ Cannot add points to completed match');
        return;
    }
    
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
    // For referee system integration, we don't need to fetch additional match info
    // All parameters come from URL params
    const urlParams = getUrlParams();
    
    if (urlParams.matchId && urlParams.gender && urlParams.matchNumber) {
        // Fetch actual scorecard data for this specific match number
        try {
            const response = await fetch(`/scorecard/get-match-info?matchId=${urlParams.matchId}&matchType=${urlParams.gender}&matchNumber=${urlParams.matchNumber}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.scorecardData) {
                    console.log('Loaded existing scorecard data for match', urlParams.matchNumber);
                    return {
                        maxSetPoint: urlParams.maxPoints || 21,
                        maxSets: urlParams.sets || 3,
                        playerName1: "Player 1",
                        playerName2: "Player 2", 
                        _id: urlParams.matchId,
                        matchType: urlParams.gender,
                        matchNo: urlParams.matchNumber,
                        scorecardData: data.scorecardData
                    };
                }
            }
        } catch (error) {
            console.log('Error loading scorecard data:', error);
        }
        
        // Return basic match data if no existing scorecard data
        return {
            maxSetPoint: urlParams.maxPoints || 21,
            maxSets: urlParams.sets || 3,
            playerName1: "Player 1",
            playerName2: "Player 2",
            _id: urlParams.matchId,
            matchType: urlParams.gender,
            matchNo: urlParams.matchNumber
        };
    }
    
    // Fallback: try to fetch from backend (for non-referee mode)
    try {
        const response = await fetch('/scorecard/get-match-info');
        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.log('Backend match info not available, using URL parameters');
    }
    
    return null;
}

async function updateBackendScore() {
    // Always try to update backend, let the server handle the logic
    console.log('Updating backend score:', {
        scores: state.scores,
        currentSet: state.currentSet,
        matchData: state.matchData
    });
    
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
                matchId : state.matchData ? state.matchData._id : 'default',
                matchType : state.matchData ? state.matchData.matchType : 'default',
                matchNumber: state.matchData ? state.matchData.matchNo : state.matchNumber,
                server: state.server === 0 ? 
                    (state.matchData ? state.matchData.playerName1 : 'Player 1') : 
                    (state.matchData ? state.matchData.playerName2 : 'Player 2')
            })
        });

        const result = await response.json();
        console.log('Score update result:', result);
        
        if (!response.ok) {
            console.error('Failed to update score on backend');
        }
    } catch (error) {
        console.error('Error updating score:', error);
    }
}

async function updateBackendSetCompletion(winnerIndex) {
    console.log('Updating backend set completion:', {
        setNumber: state.currentSet,
        winnerIndex,
        scores: state.scores
    });
    
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
                matchId : state.matchData ? state.matchData._id : 'default',
                matchType : state.matchData ? state.matchData.matchType : 'default',
                matchNumber: state.matchData ? state.matchData.matchNo : state.matchNumber,
                server: state.server === 0 ? 
                    (state.matchData ? state.matchData.playerName1 : 'Player 1') : 
                    (state.matchData ? state.matchData.playerName2 : 'Player 2')
            })
        });

        const data = await response.json();
        console.log('Set completion result:', data);
        
        if (!data.success) {
            console.error('Failed to update set completion on backend');
        } else {
            document.getElementById('advBadge0').style.display = 'none';
            document.getElementById('advBadge1').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error updating set completion:', error);
    }
}

async function updateBackendMatchCompletion(winnerIndex) {
    console.log('Updating backend match completion:', {
        winnerIndex,
        setsWon: state.setsWon
    });
    
    const urlParams = getUrlParams();
    
    try {
        const response = await fetch('/scorecard/complete-match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                winnerIndex: winnerIndex,
                setsWon: state.setsWon,
                matchId : state.matchData ? state.matchData._id : 'default',
                matchType : state.matchData ? state.matchData.matchType : 'default',
                matchNumber: urlParams.matchNumber || state.matchNumber
            })
        });
        
        const data = await response.json();
        console.log('Match completion result:', data);
        
        if (!data.success) {
            console.error('Failed to update match completion on backend');
        }
        
        // window.location.href = '/referee-dashboard';

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
    matchNumberEl.textContent = state.matchData ? state.matchData.matchNo : state.matchNumber || '1';
    
    displayMaxPointsEl.textContent = state.maxPoints;
    displayMaxSetsEl.textContent = state.matchData ? state.matchData.maxSets : (state.maxSetsToWin * 2 - 1);
    initialServerIndicatorEl.textContent = document.getElementById('name0').textContent.trim() || 'Player 1';
    updateServerUI();
    updateSetUI();
    updateSetWinsDisplay();

    // Enable/disable undo button
    undoBtn.disabled = state.lastActions.length === 0;
    console.log('Undo button state:', { 
        disabled: undoBtn.disabled, 
        actionsLength: state.lastActions.length,
        undoContainerDisplay: undoContainer.style.display 
    });

    // If match inactive (because winner), indicate visually
    if(!state.isMatchActive){
        console.log('Match is inactive, disabling buttons');
        document.querySelectorAll('.btn[data-action="inc"]').forEach(btn=>{
            btn.disabled = true;
        });
        toggleServeBtn.disabled = true;
    } else {
        console.log('Match is active, ensuring buttons are enabled');
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
    
    // Update referee system with match result
    updateMatchResult(winnerIdx);
    
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
    window.location.href = '/referee-dashboard';
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
   Referee Integration Functions
   ------------------------- */
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        matchId: urlParams.get('matchId'),
        gender: urlParams.get('gender'),
        matchNumber: parseInt(urlParams.get('matchNumber')),
        maxPoints: parseInt(urlParams.get('maxPoints')) || 21,
        sets: parseInt(urlParams.get('sets')) || 3,
        court: parseInt(urlParams.get('court')) || 1,
        firstServe: urlParams.get('firstServe')
    };
}

async function updateMatchResult(winnerIndex) {
    const urlParams = getUrlParams();
    if (!urlParams.matchId || !urlParams.gender || !urlParams.matchNumber) {
        console.log('Missing referee match parameters, skipping result update');
        return;
    }

    try {
        const winnerTeam = winnerIndex === 0 ? 'team1' : 'team2';
        const winnerEmail = winnerIndex === 0 ? state.matchData?.email1 : state.matchData?.email2;
        
        const response = await fetch('/api/referee/update-match-result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matchId: urlParams.matchId,
                gender: urlParams.gender,
                matchNumber: urlParams.matchNumber,
                winnerTeam: winnerTeam,
                winnerEmail: winnerEmail
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('Match result updated successfully');
            
            // Check if overall match is complete
            if (data.matchComplete) {
                showOverallWinnerPopup(data.overallWinner, data.team1Wins, data.team2Wins);
            }
        } else {
            console.error('Failed to update match result:', data.message);
        }
    } catch (error) {
        console.error('Error updating match result:', error);
    }
}

function showCompletedMatchMessage() {
    // Create a popup to show that the match is already completed
    const popup = document.createElement('div');
    popup.className = 'modal-overlay';
    popup.style.zIndex = '20000';
    popup.innerHTML = `
        <div class="modal completed-match-popup">
            <div class="modal-header">
                <div class="completion-icon">🏁</div>
                <div class="modal-title">Match Already Completed</div>
            </div>
            <div class="completion-text">
                This match has already been completed and cannot be restarted.<br>
                Please check with the referee or return to the main dashboard.
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="returnToMatchSets()">Back to Match Sets</button>
                <button class="btn btn-secondary" onclick="returnToDashboard()">Return to Dashboard</button>
            </div>
        </div>
    `;

    // Add styles for the popup
    const styles = document.createElement('style');
    styles.textContent = `
        .completed-match-popup {
            background: #dc3545;
            color: white;
        }
        .completion-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        .completion-text {
            font-size: 1.1rem;
            margin-bottom: 25px;
            line-height: 1.5;
        }
    `;
    document.head.appendChild(styles);
    document.body.appendChild(popup);
    
    // Mark match as completed and disable all interactive elements
    state.matchCompleted = true;
    state.isMatchActive = false;
    
    document.querySelectorAll('.btn[data-action="inc"]').forEach(btn => {
        btn.disabled = true;
    });
    toggleServeBtn.disabled = true;
    resetMatchBtn.disabled = true;
    undoBtn.disabled = true;
    setStartBtn.disabled = true;
}

function returnToDashboard() {
    window.location.href = '/referee-dashboard';
}

function showOverallWinnerPopup(overallWinner, team1Wins, team2Wins) {
    const winnerCollege = overallWinner === 'team1' ? state.matchData?.college1Name : state.matchData?.college2Name;
    
    // Create overall winner popup
    const popup = document.createElement('div');
    popup.className = 'modal-overlay';
    popup.style.zIndex = '20000';
    popup.innerHTML = `
        <div class="modal winner-popup">
            <div class="modal-header">
                <div class="winner-trophy">🏆</div>
                <div class="modal-title">Match Set Complete!</div>
            </div>
            <div class="winner-text">
                <strong>${winnerCollege}</strong> has won the match set!<br>
                <small>Final Score: ${team1Wins} - ${team2Wins}</small><br><br>
                <small>Congratulations to the winning team!</small>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                <button class="btn btn-primary" onclick="returnToMatchSets()">Back to Match Sets</button>
            </div>
        </div>
    `;

    // Add styles for the popup
    const styles = document.createElement('style');
    styles.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 20000;
        }
        .modal {
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        }
        .winner-popup {
            background: #28a745;
            color: white;
        }
        .winner-trophy {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        .modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 15px;
        }
        .winner-text {
            font-size: 1.1rem;
            margin-bottom: 25px;
        }
        .modal-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: #fff;
            color: #28a745;
        }
        .btn-secondary {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(styles);
    document.body.appendChild(popup);
}

function returnToMatchSets() {
    const urlParams = getUrlParams();
    if (urlParams.matchId && urlParams.gender) {
        window.location.href = `/referee/match/${urlParams.matchId}?type=${urlParams.gender}`;
    } else {
        window.location.href = '/referee-dashboard';
    }
}




document.addEventListener('DOMContentLoaded', async () => {
    // Check for referee match parameters
    const urlParams = getUrlParams();
    
    // If we have referee parameters, use them to configure the match
    if (urlParams.matchId && urlParams.gender && urlParams.matchNumber) {
        console.log('🔍 Loading match from referee system:', urlParams);
        
        // Set up match configuration from URL parameters
        state.maxPoints = urlParams.maxPoints;
        state.maxSetsToWin = Math.ceil(urlParams.sets / 2);
        state.matchNumber = urlParams.matchNumber;
        
        // Load player names from the referee match details
        try {
            const matchResponse = await fetch(`/api/referee/match/${urlParams.matchId}/${urlParams.gender}`);
            const matchDetailData = await matchResponse.json();
            if (matchDetailData.success) {
                const match = matchDetailData.match;
                const subMatch = match.subMatches ? match.subMatches[urlParams.matchNumber - 1] : null;
                
                if (subMatch) {
                    if (subMatch.type === 'singles') {
                        document.getElementById('name0').textContent = `${subMatch.player1} (${subMatch.college1})`;
                        document.getElementById('name1').textContent = `${subMatch.player2} (${subMatch.college2})`;
                        
                        // Set initial server based on firstServe parameter
                        if (urlParams.firstServe) {
                            if (urlParams.firstServe.includes(subMatch.player1)) {
                                state.initialServer = 0;
                            } else if (urlParams.firstServe.includes(subMatch.player2)) {
                                state.initialServer = 1;
                            }
                        }
                    } else {
                        document.getElementById('name0').textContent = `${subMatch.team1} (${subMatch.college1})`;
                        document.getElementById('name1').textContent = `${subMatch.team2} (${subMatch.college2})`;
                        
                        // For doubles, try to match the first serve player
                        if (urlParams.firstServe) {
                            if (subMatch.team1 && subMatch.team1.includes(urlParams.firstServe)) {
                                state.initialServer = 0;
                            } else if (subMatch.team2 && subMatch.team2.includes(urlParams.firstServe)) {
                                state.initialServer = 1;
                            }
                        }
                    }
                }
                
                // Store match details for backend updates
                state.matchData = {
                    _id: urlParams.matchId,
                    matchType: urlParams.gender,
                    matchNo: urlParams.matchNumber,
                    maxSets: urlParams.sets,
                    playerName1: document.getElementById('name0').textContent,
                    playerName2: document.getElementById('name1').textContent,
                    college1Name: subMatch ? subMatch.college1 : 'College 1',
                    college2Name: subMatch ? subMatch.college2 : 'College 2'
                };
            }
        } catch (error) {
            console.error('❌ Error fetching match details:', error);
            // Fallback to generic names
            document.getElementById('name0').textContent = 'Player 1';
            document.getElementById('name1').textContent = 'Player 2';
        }
        
        // Set initial server state
        state.server = state.initialServer;
        
        // Load saved scorecard data first to check if match should be restored
        console.log('🔍 About to load saved scorecard data...');
        const hasRestoredData = await loadSavedScorecardData();
        console.log('🔍 Finished loading saved scorecard data, restored:', hasRestoredData);
        
        // Only start new match if no saved data was found AND match is not already started
        if (!hasRestoredData) {
            console.log('🔍 No saved data found, checking if match should be started...');
            
            // Check if match is already started in the database
            const matchInfoResponse = await fetch(`/scorecard/get-match-info?matchId=${urlParams.matchId}&matchType=${urlParams.gender}&matchNumber=${urlParams.matchNumber}`);
            const matchInfoData = await matchInfoResponse.json();
            
            if (matchInfoData.success && matchInfoData.isMatchCompleted) {
                console.log('⚠️ Match is already completed! Preventing restart.');
                showCompletedMatchMessage();
                return; // Exit early
            } else if (matchInfoData.success && matchInfoData.isMatchStarted) {
                console.log('✅ Match is already started in database, but no scorecard data - starting fresh');
                state.isMatchActive = true;
                state.currentSet = 1;
                state.scores = [0, 0];
                updateAllUI();
            } else {
                console.log('❌ Match not started yet, waiting for start...');
                // Don't auto-start, wait for referee to start the match
                state.isMatchActive = false;
                state.currentSet = 0;
                updateAllUI();
            }
        } else {
            console.log('✅ Match state restored from saved data');
        }
        
        // Update UI to show referee mode
        if (matchNumberEl) {
            matchNumberEl.textContent = urlParams.matchNumber;
        }
     } else {
        // Not in referee mode, fetch match data from backend (existing logic)
        const matchData = await fetchMatchInfo();
        
        if (matchData) {
        state.matchData = matchData;
        
        // Override with URL parameters if present (referee mode)
        if (urlParams.maxPoints) {
            state.maxPoints = urlParams.maxPoints;
        } else {
            state.maxPoints = matchData.maxSetPoint || 15;
        }
        
        if (urlParams.sets) {
            state.maxSetsToWin = Math.ceil(urlParams.sets / 2);
        } else {
            state.maxSetsToWin = Math.floor(matchData.maxSets / 2 + 1) || 2;
        }
        
        // Set player names
        document.getElementById('name0').textContent = matchData.playerName1 || matchData.teamName1;
        document.getElementById('name1').textContent = matchData.playerName2 || matchData.teamName2;
        
        // Add college names to match data for referee integration
        if (urlParams.matchId) {
            try {
                const matchResponse = await fetch(`/api/referee/match/${urlParams.matchId}/${urlParams.gender}`);
                const matchDetailData = await matchResponse.json();
                if (matchDetailData.success) {
                    state.matchData.college1Name = matchDetailData.match.college1Name;
                    state.matchData.college2Name = matchDetailData.match.college2Name;
                    state.matchData.email1 = matchDetailData.match.email1;
                    state.matchData.email2 = matchDetailData.match.email2;
                }
            } catch (error) {
                console.error('Error fetching match details:', error);
            }
        }
        
        console.log('Match data loaded:', matchData);
        
        // Set initial server based on backend data or URL parameter
        if (urlParams.firstServe) {
            // Use first serve from URL (referee mode)
            const firstServeInfo = urlParams.firstServe;
            const playerName1 = matchData.playerName1 || matchData.teamName1;
            const playerName2 = matchData.playerName2 || matchData.teamName2;
            
            if (firstServeInfo.includes(playerName1) || firstServeInfo.toLowerCase().includes('team1')) {
                state.initialServer = 0;
            } else {
                state.initialServer = 1;
            }
        } else if (matchData.set && matchData.set.length > 0) {
            // Use backend data
            const currentSet = matchData.set[matchData.set.length - 1];
            if(matchData.playerName1){
                state.initialServer = currentSet.serve === matchData.playerName1 ? 0 : 1;
            }else{
                state.initialServer = currentSet.serve === matchData.teamName1 ? 0 : 1;
            }
        }
        
        state.server = state.initialServer;
        
        // Load saved scorecard data first
        const hasRestoredData = await loadSavedScorecardData();
        
        // Load existing set data if available
        if (matchData.set && matchData.set.length > 0) {
            const currentSet = matchData.set[matchData.set.length - 1];
            
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
        } else {
            // Set default values if no backend data
            state.matchData = {
                _id: 'default',
                matchType: 'default',
                matchNo: 1,
                maxSets: 3,
                playerName1: 'Player 1',
                playerName2: 'Player 2'
            };
            
            // Initialize match for non-referee mode only if no saved data
            if (!hasRestoredData) {
                console.log('Initializing non-referee match');
                startMatch();
            }
        }
    }
    
    updateAllUI();
});