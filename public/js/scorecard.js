/**
 * Badminton Scorecard Script
 * - Uses backend data for match configuration
 * - Service logic: rally winner becomes server
 * - Deuce/Advantage logic: at 14-14, need 2-point lead
 * - Set history tracking
 * - Mobile responsive design
 * - Persistent data storage
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
    matchId: null,
    matchType: null,
    submatchKey: null
};

/* -------------------------
   Mobile Enhancement Functions
   ------------------------- */

// Initialize mobile-specific features
function initializeMobileEnhancements() {
    // Handle orientation changes
    handleOrientationChange();
    window.addEventListener('orientationchange', () => {
        setTimeout(handleOrientationChange, 100);
    });
    
    // Prevent zoom on double-tap for score buttons
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Add swipe gesture for undo (swipe down)
    initializeSwipeGestures();
    
    // Optimize for PWA if standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        document.body.classList.add('pwa-mode');
    }
    
    // Prevent pull-to-refresh on mobile
    let preventPullToRefresh = false;
    
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        
        const { clientY } = e.touches[0];
        const { scrollTop } = document.documentElement;
        
        if (clientY < 100 && scrollTop === 0) {
            preventPullToRefresh = true;
        } else {
            preventPullToRefresh = false;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (preventPullToRefresh) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Handle device orientation changes
function handleOrientationChange() {
    const container = document.querySelector('.container');
    const isLandscape = window.innerHeight < window.innerWidth;
    const isMobile = window.innerWidth <= 800;
    
    if (isMobile) {
        if (isLandscape) {
            container.classList.add('landscape-mode');
            container.classList.remove('portrait-mode');
        } else {
            container.classList.add('portrait-mode');
            container.classList.remove('landscape-mode');
        }
    }
}

// Initialize swipe gestures for mobile
function initializeSwipeGestures() {
    let startY = 0;
    let startX = 0;
    let startTime = 0;
    let isTracking = false;
    
    document.addEventListener('touchstart', (e) => {
        // Only track if not touching a button
        if (!e.target.closest('[data-action]') && !e.target.closest('button')) {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
            startTime = Date.now();
            isTracking = true;
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (!isTracking) return;
        isTracking = false;
        
        const endY = e.changedTouches[0].clientY;
        const endX = e.changedTouches[0].clientX;
        const deltaY = endY - startY;
        const deltaX = endX - startX;
        const deltaTime = Date.now() - startTime;
        
        // Swipe down gesture for undo (minimum 100px vertically, maximum 500ms, more vertical than horizontal)
        if (deltaY > 100 && deltaTime < 500 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
            if (state.lastActions.length > 0) {
                undoLastAction();
                // Haptic feedback for undo
                if ('vibrate' in navigator) {
                    navigator.vibrate([100, 50, 100]); // Double buzz for undo
                }
            }
        }
    }, { passive: true });
}

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
const displayNumberOfSetsEl = document.getElementById('displayNumberOfSets');
const initialServerIndicatorEl = document.getElementById('initialServerIndicator');
const matchNumberEl = document.getElementById('matchNumber');
const roundDisplayEl = document.getElementById('roundDisplay');
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
const winnerText = document.getElementById('winnerText');
const winnerTitle = document.getElementById('winnerTitle');

const setWinsContainer = document.getElementById('setWinsContainer');
const setWinsList = document.getElementById('setWinsList');

// Set win confirmation elements
const setWinConfirmation = document.getElementById('setWinConfirmation');
const setWinConfirmText = document.getElementById('setWinConfirmText');
const setWinConfirmBtn = document.getElementById('setWinConfirmBtn');
const setWinCancelBtn = document.getElementById('setWinCancelBtn');

// Set completion elements
const setCompletionOverlay = document.getElementById('setCompletionOverlay');
const setCompletionText = document.getElementById('setCompletionText');
const setCompletionSummary = document.getElementById('setCompletionSummary');
const startNextSetBtn = document.getElementById('startNextSetBtn');
const completeMatchBtn = document.getElementById('completeMatchBtn');

/* -------------------------
   Toast Notification System
   ------------------------- */

// Show/hide updating indicator
function showUpdatingIndicator() {
    let indicator = document.querySelector('.updating-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'updating-indicator';
        indicator.innerHTML = `
            <div class="updating-content">
                <div class="updating-spinner"></div>
                <span>Updating...</span>
            </div>
        `;
        document.body.appendChild(indicator);
    }
    indicator.classList.add('show');
}

function hideUpdatingIndicator() {
    const indicator = document.querySelector('.updating-indicator');
    if (indicator) {
        indicator.classList.remove('show');
    }
}

function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    let icon = '💙'; // default blue heart
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ️';
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

function showConfirmToast(message, onConfirm, onCancel = null) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create confirm toast element
    const toast = document.createElement('div');
    toast.className = 'toast toast-confirm';
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">❓</span>
            <span class="toast-message">${message}</span>
            <div class="toast-buttons">
                <button class="toast-btn toast-btn-confirm">Yes</button>
                <button class="toast-btn toast-btn-cancel">Cancel</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const confirmBtn = toast.querySelector('.toast-btn-confirm');
    const cancelBtn = toast.querySelector('.toast-btn-cancel');
    
    confirmBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
        if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
        if (onCancel) onCancel();
    });
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
}

/* -------------------------
   Utility Functions
   ------------------------- */

// Format round name from backend format (round_1 → Round 1)
function formatRoundName(round) {
    if (!round) return 'Round 1';
    
    const roundMappings = {
        'round_1': 'Round 1',
        'round_2': 'Round 2',
        'round_3': 'Round 3',
        'quater': 'Quarter Final',
        'quarter': 'Quarter Final',
        'semi': 'Semi Final',
        'final': 'Final'
    };
    
    return roundMappings[round] || round;
}

// Get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        matchId: params.get('matchId'),
        matchType: params.get('matchType'),
        submatchKey: params.get('submatchKey')
    };
}

// Clamp value between min and max
function clamp(value, min=0, max=9999){ 
    return Math.max(min, Math.min(max, value)); 
}

// Animate score when it changes
function animateScore(index){
    const el = scoreEls[index];
    el.classList.add('anim');
    setTimeout(()=>el.classList.remove('anim'), 200);
}

// Show flash animation when set is won
function showFlash(index){
    const f = flashEls[index];
    f.classList.add('show');
    setTimeout(()=>f.classList.remove('show'), 900);
}

// Update server UI indication
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

// Update set-related UI elements
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

// Update set wins display
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

// Start or reset for new match
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

// Full reset
function fullReset(){
    showConfirmToast(
        'Are you sure you want to reset the match to defaults? This action cannot be undone.',
        () => {
            startMatch();
            hideOverlay();
            // Also reset backend if needed
            resetBackendMatch();
            showToast('Match has been reset successfully!', 'success');
        }
    );
}

// Start a new set
function startNewSet() {
    if (state.currentSet === 0) {
        state.currentSet = 1;
        showToast(`Set ${state.currentSet} has started! Good luck! 🏸`, 'info');
    } else {
        showToast(`Set ${state.currentSet} started successfully!`, 'success');
    }
    state.scores = [0, 0];
    state.lastActions = []; // Clear undo history for new set
    updateAllUI();
    
    // Update backend about new set starting
    updateBackendNewSet();
}

/**
 * Add a point to player (0 or 1). Handles:
 *  - Rally winner becomes server
 *  - Deuce / advantage logic and determining set winner
 */
let lastPointTime = 0;
const POINT_DEBOUNCE_TIME = 500; // 500ms debounce to prevent double-taps

function addPointToPlayer(pIndex){
    if(!state.isMatchActive || state.currentSet === 0) return;
    
    // Debounce rapid clicks/taps
    const now = Date.now();
    if (now - lastPointTime < POINT_DEBOUNCE_TIME) {
        console.log('Point update debounced - too fast');
        return;
    }
    lastPointTime = now;
    
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
        
        // Show updating indicator and update backend
        showUpdatingIndicator();
        updateBackendScore().then(success => {
            hideUpdatingIndicator();
            if (success) {
                showToast('Score updated successfully!', 'success', 1500);
            }
        });
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
    if (state.lastActions.length === 0) {
        showToast('No actions to undo!', 'warning');
        return;
    }
    
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
        
        showToast('Last action undone successfully!', 'info');
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
    
    // Update backend with reverted score
    updateBackendScore();
}

/* -------------------------
   Backend API Integration
   ------------------------- */

// Get URL parameters
const urlParams = getUrlParams();
state.matchId = urlParams.matchId;
state.matchType = urlParams.matchType;
state.submatchKey = urlParams.submatchKey;

async function fetchMatchInfo() {
    try {
        let url = '/api/referee/get-match-info';
        if (state.matchId && state.matchType && state.submatchKey) {
            url += `?matchId=${state.matchId}&matchType=${state.matchType}&submatchKey=${state.submatchKey}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching match info:', error);
        return null;
    }
}

async function updateBackendScore() {
    if (!state.matchId || !state.matchType || !state.submatchKey) return;
    
    try {
        const requestData = {
            player1Point: state.scores[0],
            player2Point: state.scores[1],
            currentSet: state.currentSet,
            matchId: state.matchId,
            matchType: state.matchType,
            submatchKey: state.submatchKey,
            server: state.server // Send server index (0 or 1) instead of player name
        };

        const response = await fetch('/api/referee/update-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to update score on backend:', response.status, errorText);
            showToast('Failed to update score. Please check your connection.', 'error');
            return false;
        }
        
        const result = await response.json();
        if (!result.success) {
            console.error('Backend returned error:', result.message);
            showToast('Score update failed: ' + result.message, 'error');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error updating score:', error);
        showToast('Network error while updating score. Retrying...', 'warning');
        
        // Retry once after a delay
        setTimeout(() => {
            updateBackendScore();
        }, 2000);
        
        return false;
    }
}

async function updateBackendNewSet() {
    if (!state.matchId || !state.matchType || !state.submatchKey) return;
    
    try {
        const response = await fetch('/api/referee/new-set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matchId: state.matchId,
                matchType: state.matchType,
                submatchKey: state.submatchKey,
                setNumber: state.currentSet
            })
        });

        if (!response.ok) {
            console.error('Failed to update new set on backend');
        }
    } catch (error) {
        console.error('Error updating new set:', error);
    }
}

async function updateBackendSetCompletion(winnerIndex) {
    if (!state.matchId || !state.matchType || !state.submatchKey) return;
    
    try {
        const response = await fetch('/api/referee/complete-set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                setNumber: state.currentSet,
                winnerIndex: winnerIndex,
                player1Point: state.scores[0],
                player2Point: state.scores[1],
                matchId: state.matchId,
                matchType: state.matchType,
                submatchKey: state.submatchKey,
                server: state.server // Send server index (0 or 1) instead of player name
            })
        });

        const data = await response.json();
        
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
    if (!state.matchId || !state.matchType || !state.submatchKey) return;
    
    try {
        const response = await fetch('/api/referee/complete-match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                winnerIndex: winnerIndex,
                setsWon: state.setsWon,
                matchId: state.matchId,
                matchType: state.matchType,
                submatchKey: state.submatchKey
            })
        });
        
        const data = await response.json();
        if (!data.success) {
            console.error('Failed to update match completion on backend');
        }
        
    } catch (error) {
        console.error('Error updating match completion:', error);
    }
}

async function resetBackendMatch() {
    if (!state.matchId || !state.matchType || !state.submatchKey) return;
    
    try {
        const response = await fetch('/api/referee/reset-match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matchId: state.matchId,
                matchType: state.matchType,
                submatchKey: state.submatchKey
            })
        });
        
        if (!response.ok) {
            console.error('Failed to reset match on backend');
        }
    } catch (error) {
        console.error('Error resetting match:', error);
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

    // match number and round
    matchNumberEl.textContent = state.matchData ? state.matchData.matchNo : '1';
    roundDisplayEl.textContent = state.matchData ? formatRoundName(state.matchData.round) : 'Round 1';
    
    displayMaxPointsEl.textContent = state.maxPoints;
    displayNumberOfSetsEl.textContent = state.matchData ? state.matchData.numberOfSets : '3';
    initialServerIndicatorEl.textContent = document.getElementById('name0').textContent.trim() || 'Player 1';
    
    // Update tournament context
    const tournamentRoundEl = document.getElementById('tournamentRound');
    const matchStartTimeEl = document.getElementById('matchStartTime');
    const courtNumberEl = document.getElementById('courtNumber');
    
    if (tournamentRoundEl && state.matchData) {
        const gender = state.matchType === 'girls' ? 'Girls' : 'Boys';
        const round = formatRoundName(state.matchData.round);
        tournamentRoundEl.textContent = `${gender} - ${round}`;
    }
    
    if (matchStartTimeEl && state.matchData) {
        const startTime = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        matchStartTimeEl.textContent = startTime;
    }
    
    if (courtNumberEl && state.matchData) {
        courtNumberEl.textContent = state.matchData.courtNumber || '1';
    }
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
    const winnerName = document.getElementById(`name${winnerIndex}`).textContent.trim() || `Player ${winnerIndex + 1}`;
    
    setCompletionText.innerHTML = `<strong>${winnerName}</strong> won Set ${state.currentSet}!`;
    
    // Show current match status in the summary
    const summaryHTML = `
        <div class="set-summary-details">
            <p>Match Score: ${state.setsWon[0]} - ${state.setsWon[1]}</p>
            <p>Set Score: ${state.scores[winnerIndex]}-${state.scores[1-winnerIndex]}</p>
        </div>
    `;
    setCompletionSummary.innerHTML = summaryHTML;
    
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
// Enhanced touch and click handling for better mobile experience
let lastTouchTime = 0;
let touchHandled = false;

document.addEventListener('touchstart', (e) => {
    const target = e.target.closest('[data-action]');
    if (target) {
        // Add active state immediately on touch
        target.classList.add('touch-active');
        touchHandled = false;
    }
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const target = e.target.closest('[data-action]');
    if (target && !touchHandled) {
        touchHandled = true;
        lastTouchTime = Date.now();
        
        // Remove active state after touch
        setTimeout(() => {
            target.classList.remove('touch-active');
        }, 150);
        
        // Handle the action
        const action = target.dataset.action;
        const p = parseInt(target.dataset.player);
        
        if(action === 'inc') {
            // Add visual feedback for touch
            provideTouchFeedback(target);
            addPointToPlayer(p);
        }
    }
}, { passive: false });

document.addEventListener('click', (e)=>{
    const target = e.target.closest('[data-action]');
    if(!target) return;
    
    // Prevent double handling on mobile (if touch was recent, skip click)
    if (Date.now() - lastTouchTime < 500) {
        e.preventDefault();
        return;
    }
    
    // Prevent double-tap zoom on mobile
    e.preventDefault();
    
    const action = target.dataset.action;
    const p = parseInt(target.dataset.player);
    
    if(action === 'inc') {
        // Add visual feedback for touch
        provideTouchFeedback(target);
        addPointToPlayer(p);
    }
});

// Provide visual and haptic feedback for touch interactions
function provideTouchFeedback(element) {
    // Visual feedback
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
        element.style.transform = '';
        element.style.transition = '';
    }, 100);
    
    // Haptic feedback on supported devices
    if ('vibrate' in navigator) {
        navigator.vibrate(50); // Short vibration for score increment
    }
}

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
resetMatchBtn.addEventListener('click', fullReset);

// undo button
undoBtn.addEventListener('click', undoLastAction);

// allow names to be edited and reflected
document.getElementById('name0').addEventListener('input', updateAllUI);
document.getElementById('name1').addEventListener('input', updateAllUI);

// Add event listener for complete match button
completeMatchBtn.addEventListener('click', () => {
    window.location.href = '/referee';
});

// Add event listener for start next set button
startNextSetBtn.addEventListener('click', () => {
    setCompletionOverlay.classList.add('hidden');
    state.currentSet += 1;
    state.scores = [0,0];
    state.isMatchActive = true;
    updateAllUI();
    updateBackendNewSet();
});

/* -------------------------
   Auto-save and Persistence
   ------------------------- */

// Auto-save score every 5 seconds if the game is active
setInterval(() => {
    if (state.isMatchActive && state.currentSet > 0) {
        updateBackendScore();
    }
}, 5000);

// Save score before page unload (user closes tab, navigates away, etc.)
window.addEventListener('beforeunload', (event) => {
    if (state.isMatchActive && state.currentSet > 0) {
        // Use sendBeacon for reliable sending even as page unloads
        const scoreData = JSON.stringify({
            matchId: state.matchId,
            matchType: state.matchType,
            submatchKey: state.submatchKey,
            player1Point: state.scores[0],
            player2Point: state.scores[1],
            currentSet: state.currentSet,
            server: state.server
        });
        
        if (navigator.sendBeacon) {
            // Send as text/plain which our server can handle
            const blob = new Blob([scoreData], { type: 'text/plain' });
            navigator.sendBeacon('/api/referee/update-score', blob);
        } else {
            // Fallback for browsers that don't support sendBeacon
            updateBackendScore();
        }
    }
});

// Save score when page visibility changes (user switches tabs, minimizes, etc.)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && state.isMatchActive && state.currentSet > 0) {
        updateBackendScore();
    }
});

/* -------------------------
   Initialize the application
   ------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize mobile enhancements
    initializeMobileEnhancements();
    
    // Fetch match data from backend
    const matchData = await fetchMatchInfo();
    
    if (matchData) {
        state.matchData = matchData;
        state.maxPoints = matchData.maxSetPoint || 21;
        state.maxSetsToWin = Math.floor((matchData.numberOfSets || 3) / 2 + 1) || 2;
        
        // Set player/team names
        document.getElementById('name0').textContent = matchData.playerName1 || 'Player 1';
        document.getElementById('name1').textContent = matchData.playerName2 || 'Player 2';
        
        // Set initial server based on backend data
        if (matchData.firstServePlayer) {
            // Determine initial server based on first serve player
            if (matchData.firstServePlayer === 'team1') {
                state.initialServer = 0;
            } else {
                state.initialServer = 1;
            }
        }
        
        // Restore current game state from backend
        if (matchData.currentScore) {
            state.scores = [matchData.currentScore.player1, matchData.currentScore.player2];
            state.server = matchData.currentScore.server;
            state.currentSet = matchData.currentSet || 1;
            state.isMatchActive = matchData.isMatchActive || false;
        } else {
            // Set defaults if no current score data
            state.server = state.initialServer;
            state.currentSet = 1;
            state.scores = [0, 0];
        }
        
        // Restore sets won from backend data
        if (matchData.setsWon) {
            state.setsWon = matchData.setsWon;
        }
        
        // Load existing completed sets
        if (matchData.sets && matchData.sets.length > 0) {
            // Process existing sets
            for (let i = 0; i < matchData.sets.length; i++) {
                const set = matchData.sets[i];
                if (set.isComplete) {
                    const winnerIndex = set.player1Score > set.player2Score ? 0 : 1;
                    const winnerName = winnerIndex === 0 ? matchData.playerName1 : matchData.playerName2;
                    const score = `${set.player1Score}-${set.player2Score}`;
                    
                    state.setResults.push({
                        setNumber: set.setNumber || (i + 1),
                        winnerIndex: winnerIndex,
                        winnerName: winnerName,
                        score: score
                    });
                    
                    state.setHistory[winnerIndex].push(score);
                }
            }
        }
        
        // If match is active and we have an ongoing set, enable scoring
        if (state.isMatchActive && state.currentSet > 0) {
            // Don't reset to defaults - keep the restored state
        }
    }
    
    updateAllUI();
});