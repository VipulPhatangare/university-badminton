/**
 * Referee Scorecard Script
 * - Integrates with referee dashboard and database
 * - Real-time score tracking and persistence
 * - Service logic and match completion
 */

// Global state
let matchId = null;
let matchType = null;
let gender = null;
let matchData = null;
let currentScore = { player1: 0, player2: 0, server: 0 };
let currentSet = 1;
let maxPoints = 21;
let numberOfSets = 3;
let matchTimer = null;
let startTime = null;

// DOM elements
const player1Name = document.getElementById('player1Name');
const player2Name = document.getElementById('player2Name');
const player1College = document.getElementById('player1College');
const player2College = document.getElementById('player2College');
const player1Score = document.getElementById('player1Score');
const player2Score = document.getElementById('player2Score');
const player1SetScores = document.getElementById('player1SetScores');
const player2SetScores = document.getElementById('player2SetScores');
const serverArrow = document.getElementById('serverArrow');
const matchTitle = document.getElementById('matchTitle');
const matchSubtitle = document.getElementById('matchSubtitle');
const courtInfo = document.getElementById('courtInfo');
const setInfo = document.getElementById('setInfo');
const maxPointsInfo = document.getElementById('maxPointsInfo');
const matchTimer2 = document.getElementById('matchTimer');
const backToDashboard = document.getElementById('backToDashboard');
const settingsBtn = document.getElementById('settingsBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeScorecard();
});

async function initializeScorecard() {
    try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        matchId = urlParams.get('matchId');
        matchType = urlParams.get('matchType');
        gender = urlParams.get('gender');

        if (!matchId || !matchType || !gender) {
            showError('Missing required match parameters');
            return;
        }

        // Check authentication
        await checkAuthentication();
        
        // Load match data
        await loadMatchData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Start timer
        startMatchTimer();

    } catch (error) {
        console.error('Error initializing scorecard:', error);
        showError('Failed to initialize scorecard');
    }
}

async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth/session');
        const result = await response.json();

        if (!result.success || result.user.type !== 'referee') {
            window.location.href = '/?auth=required&type=referee';
            return;
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = '/?auth=required&type=referee';
    }
}

async function loadMatchData() {
    try {
        showLoading(true);
        
        const response = await fetch(`/api/referee/match-details/${matchId}`);
        const result = await response.json();

        if (result.success) {
            matchData = result.match;
            populateMatchInfo();
            
            // Load existing scores if any
            await loadExistingScores();
        } else {
            throw new Error(result.message || 'Failed to load match data');
        }
    } catch (error) {
        console.error('Error loading match data:', error);
        showError('Failed to load match data');
    } finally {
        showLoading(false);
    }
}

function populateMatchInfo() {
    const match = matchData.matches[matchType];
    
    // Set match title and details
    matchTitle.textContent = getMatchTitle(matchType);
    matchSubtitle.textContent = `${matchData.college1Name} vs ${matchData.college2Name}`;
    
    // Set player names
    if (matchType.includes('Doubles')) {
        player1Name.textContent = `${match.team1Player1Name} & ${match.team1Player2Name}`;
        player2Name.textContent = `${match.team2Player1Name} & ${match.team2Player2Name}`;
    } else {
        player1Name.textContent = match.player1Name;
        player2Name.textContent = match.player2Name;
    }
    
    // Set college names
    player1College.textContent = matchData.college1Name;
    player2College.textContent = matchData.college2Name;
    
    // Set match settings if available
    if (match.matchSettings) {
        maxPoints = match.matchSettings.maxPoints || 21;
        numberOfSets = match.matchSettings.numberOfSets || 3;
        courtInfo.textContent = `Court ${match.matchSettings.courtNumber || 1}`;
        currentScore.server = match.matchSettings.firstServePlayer === 'college1' ? 0 : 1;
    }
    
    // Update info displays
    setInfo.textContent = `Set ${currentSet} of ${numberOfSets}`;
    maxPointsInfo.textContent = `First to ${maxPoints}`;
    
    updateUI();
}

function getMatchTitle(matchType) {
    const titles = {
        'match1Singles': 'Singles 1st',
        'match2Singles': 'Singles 2nd', 
        'match3Singles': 'Singles 3rd',
        'match4Singles': 'Singles 3rd', // For boys
        'match3Doubles': 'Doubles 1st',
        'match2Doubles': 'Doubles', // For girls
        'match5Doubles': 'Doubles 2nd'
    };
    return titles[matchType] || 'Match';
}

async function loadExistingScores() {
    // Load scorecard data if it exists
    const scorecardKey = matchType.replace('match', 'match');
    const scorecardData = matchData.scorecardData?.[scorecardKey];
    
    if (scorecardData) {
        currentScore = { ...scorecardData.currentScore };
        currentSet = (scorecardData.scores?.length || 0) + 1;
        
        // Update set info
        setInfo.textContent = `Set ${currentSet} of ${numberOfSets}`;
        
        // Display completed sets
        displayCompletedSets(scorecardData.scores || []);
        
        updateUI();
    }
}

function displayCompletedSets(completedSets) {
    let player1Sets = '';
    let player2Sets = '';
    
    completedSets.forEach((set, index) => {
        player1Sets += `<div class="set_score">Set ${index + 1}: ${set.player1Score}</div>`;
        player2Sets += `<div class="set_score">Set ${index + 1}: ${set.player2Score}</div>`;
    });
    
    player1SetScores.innerHTML = player1Sets;
    player2SetScores.innerHTML = player2Sets;
}

function setupEventListeners() {
    // Back to dashboard
    backToDashboard?.addEventListener('click', () => {
        window.location.href = '/referee-dashboard';
    });
    
    // Settings button
    settingsBtn?.addEventListener('click', showSettingsModal);
    
    // Modal event listeners
    document.getElementById('closeSettingsModal')?.addEventListener('click', hideSettingsModal);
    document.getElementById('settingsForm')?.addEventListener('submit', handleSettingsUpdate);
    document.getElementById('cancelSettings')?.addEventListener('click', hideSettingsModal);
    
    // Set complete modal listeners
    document.getElementById('nextSetBtn')?.addEventListener('click', startNextSet);
    
    // Match complete modal listeners  
    document.getElementById('finishMatchBtn')?.addEventListener('click', finishMatch);
    
    // End match modal listeners
    document.getElementById('closeEndMatchModal')?.addEventListener('click', hideEndMatchModal);
    document.getElementById('cancelEndMatch')?.addEventListener('click', hideEndMatchModal);
    document.getElementById('confirmEndMatch')?.addEventListener('click', confirmEndMatch);
    
    // Quick action buttons
    document.getElementById('switchServerBtn')?.addEventListener('click', switchServer);
    document.getElementById('undoLastPointBtn')?.addEventListener('click', undoLastPoint);
    document.getElementById('endMatchBtn')?.addEventListener('click', showEndMatchModal);
    
    // Modal overlay clicks
    document.querySelectorAll('.modal_overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal);
        });
    });
}

function addPoint(player) {
    const playerIndex = player === 'player1' ? 0 : 1;
    
    // Add point
    currentScore[player]++;
    
    // Update server (rally winner gets serve)
    currentScore.server = playerIndex;
    
    // Check for set win
    if (checkSetWin()) {
        return; // Don't update UI yet, wait for set completion
    }
    
    // Update UI and save
    updateUI();
    saveScore();
    
    // Add animation
    animateScoreChange(playerIndex);
}

function subtractPoint(player) {
    const playerIndex = player === 'player1' ? 0 : 1;
    
    if (currentScore[player] > 0) {
        currentScore[player]--;
        updateUI();
        saveScore();
        animateScoreChange(playerIndex);
    }
}

function checkSetWin() {
    const player1Score = currentScore.player1;
    const player2Score = currentScore.player2;
    
    // Check if someone reached max points
    if (player1Score >= maxPoints || player2Score >= maxPoints) {
        // Check for 2-point lead (deuce situation)
        if (Math.abs(player1Score - player2Score) >= 2) {
            const winner = player1Score > player2Score ? 'player1' : 'player2';
            showSetCompleteModal(winner, player1Score, player2Score);
            return true;
        }
    }
    
    return false;
}

function showSetCompleteModal(winner, score1, score2) {
    const winnerName = winner === 'player1' ? player1Name.textContent : player2Name.textContent;
    
    document.getElementById('setWinnerName').textContent = winnerName;
    document.getElementById('completedSetNumber').textContent = currentSet;
    document.getElementById('summaryPlayer1Name').textContent = player1Name.textContent.split(' &')[0];
    document.getElementById('summaryPlayer2Name').textContent = player2Name.textContent.split(' &')[0];
    document.getElementById('summaryPlayer1Score').textContent = score1;
    document.getElementById('summaryPlayer2Score').textContent = score2;
    
    showModal(document.getElementById('setCompleteModal'));
}

function startNextSet() {
    currentSet++;
    
    // Reset scores for next set
    currentScore.player1 = 0;
    currentScore.player2 = 0;
    
    // Switch server for new set
    currentScore.server = currentScore.server === 0 ? 1 : 0;
    
    // Check if match is complete
    const player1Sets = getCompletedSets('player1');
    const player2Sets = getCompletedSets('player2');
    const setsToWin = Math.ceil(numberOfSets / 2);
    
    if (player1Sets >= setsToWin || player2Sets >= setsToWin) {
        showMatchCompleteModal();
        return;
    }
    
    // Update UI for next set
    setInfo.textContent = `Set ${currentSet} of ${numberOfSets}`;
    updateUI();
    saveScore();
    
    hideModal(document.getElementById('setCompleteModal'));
}

function getCompletedSets(player) {
    const scorecardKey = matchType.replace('match', 'match');
    const scorecardData = matchData.scorecardData?.[scorecardKey];
    
    if (!scorecardData?.scores) return 0;
    
    return scorecardData.scores.filter(set => {
        if (player === 'player1') {
            return set.player1Score > set.player2Score;
        } else {
            return set.player2Score > set.player1Score;
        }
    }).length;
}

function showMatchCompleteModal() {
    const player1Sets = getCompletedSets('player1');
    const player2Sets = getCompletedSets('player2');
    const winner = player1Sets > player2Sets ? 'player1' : 'player2';
    const winnerName = winner === 'player1' ? player1Name.textContent : player2Name.textContent;
    
    document.getElementById('matchWinnerName').textContent = winnerName;
    
    // Generate match summary
    let summaryHtml = '<h3>Match Summary</h3>';
    summaryHtml += `<p>Winner: ${winnerName}</p>`;
    summaryHtml += `<p>Sets Won: ${Math.max(player1Sets, player2Sets)} - ${Math.min(player1Sets, player2Sets)}</p>`;
    
    document.getElementById('matchSummary').innerHTML = summaryHtml;
    
    showModal(document.getElementById('matchCompleteModal'));
}

async function finishMatch() {
    try {
        showLoading(true);
        
        // Determine winner
        const player1Sets = getCompletedSets('player1');
        const player2Sets = getCompletedSets('player2');
        const winnerTeam = player1Sets > player2Sets ? 'team1' : 'team2';
        const winnerEmail = winnerTeam === 'team1' ? matchData.email1 : matchData.email2;
        
        // Complete the individual match
        const response = await fetch(`/api/referee/complete-match/${matchId}/${matchType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winnerTeam,
                winnerEmail
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Match completed successfully!');
            
            // Redirect back to dashboard after delay
            setTimeout(() => {
                window.location.href = '/referee-dashboard';
            }, 2000);
        } else {
            throw new Error(result.message || 'Failed to complete match');
        }
        
    } catch (error) {
        console.error('Error completing match:', error);
        showError('Failed to complete match');
    } finally {
        showLoading(false);
    }
}

function switchServer() {
    currentScore.server = currentScore.server === 0 ? 1 : 0;
    updateUI();
    saveScore();
}

function undoLastPoint() {
    // Simple undo - just subtract 1 from highest score
    if (currentScore.player1 > 0 || currentScore.player2 > 0) {
        if (currentScore.player1 >= currentScore.player2 && currentScore.player1 > 0) {
            currentScore.player1--;
        } else if (currentScore.player2 > 0) {
            currentScore.player2--;
        }
        
        updateUI();
        saveScore();
    }
}

function showEndMatchModal() {
    // Populate winner options
    document.getElementById('winnerOption1').textContent = player1Name.textContent;
    document.getElementById('winnerOption2').textContent = player2Name.textContent;
    
    showModal(document.getElementById('endMatchModal'));
}

function hideEndMatchModal() {
    hideModal(document.getElementById('endMatchModal'));
}

async function confirmEndMatch() {
    const winnerSelect = document.getElementById('winnerSelect');
    const selectedWinner = winnerSelect.value;
    
    if (!selectedWinner) {
        showError('Please select a winner');
        return;
    }
    
    try {
        showLoading(true);
        
        const winnerTeam = selectedWinner === 'player1' ? 'team1' : 'team2';
        const winnerEmail = winnerTeam === 'team1' ? matchData.email1 : matchData.email2;
        
        const response = await fetch(`/api/referee/complete-match/${matchId}/${matchType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winnerTeam,
                winnerEmail
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess('Match ended successfully!');
            hideEndMatchModal();
            
            setTimeout(() => {
                window.location.href = '/referee-dashboard';
            }, 2000);
        } else {
            throw new Error(result.message || 'Failed to end match');
        }
        
    } catch (error) {
        console.error('Error ending match:', error);
        showError('Failed to end match');
    } finally {
        showLoading(false);
    }
}

function showSettingsModal() {
    document.getElementById('maxPointsSetting').value = maxPoints;
    document.getElementById('numberOfSetsSetting').value = numberOfSets;
    showModal(document.getElementById('settingsModal'));
}

function hideSettingsModal() {
    hideModal(document.getElementById('settingsModal'));
}

function handleSettingsUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newMaxPoints = parseInt(formData.get('maxPoints'));
    const newNumberOfSets = parseInt(formData.get('numberOfSets'));
    
    if (newMaxPoints >= 11 && newMaxPoints <= 30) {
        maxPoints = newMaxPoints;
        maxPointsInfo.textContent = `First to ${maxPoints}`;
    }
    
    if (newNumberOfSets >= 1 && newNumberOfSets <= 5) {
        numberOfSets = newNumberOfSets;
        setInfo.textContent = `Set ${currentSet} of ${numberOfSets}`;
    }
    
    hideSettingsModal();
    showSuccess('Settings updated successfully!');
}

function updateUI() {
    // Update scores
    player1Score.textContent = currentScore.player1;
    player2Score.textContent = currentScore.player2;
    
    // Update server indicator
    if (currentScore.server === 0) {
        serverArrow.textContent = '→';
        serverArrow.style.color = '#1565c0';
        document.getElementById('player1Section').style.borderLeft = '4px solid #1565c0';
        document.getElementById('player2Section').style.borderLeft = 'none';
    } else {
        serverArrow.textContent = '←';
        serverArrow.style.color = '#1565c0';
        document.getElementById('player2Section').style.borderLeft = '4px solid #1565c0';
        document.getElementById('player1Section').style.borderLeft = 'none';
    }
}

async function saveScore() {
    try {
        const response = await fetch(`/api/referee/update-score/${matchId}/${matchType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player1Score: currentScore.player1,
                player2Score: currentScore.player2,
                setNumber: currentSet,
                isSetComplete: false
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save score');
        }
        
    } catch (error) {
        console.error('Error saving score:', error);
        // Don't show error to user for background saves
    }
}

function animateScoreChange(playerIndex) {
    const scoreElement = playerIndex === 0 ? player1Score : player2Score;
    scoreElement.style.transform = 'scale(1.2)';
    scoreElement.style.color = '#28a745';
    
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
        scoreElement.style.color = '';
    }, 300);
}

function startMatchTimer() {
    startTime = new Date();
    
    matchTimer = setInterval(() => {
        const elapsed = new Date() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        if (matchTimer2) {
            matchTimer2.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Modal utilities
function showModal(modal) {
    modal.classList.remove('hidden');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('show');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Loading utilities
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}

// Notification utilities
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification_content">
            <span class="notification_icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="notification_message">${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(40, 167, 69, 0.9)' : 'rgba(220, 53, 69, 0.9)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        backdrop-filter: blur(10px);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}