// DOM elements
const assignedMatchesContainer = document.getElementById('assignedMatchesContainer');
const completedMatchesContainer = document.getElementById('completedMatchesContainer');
const refreshMatchesBtn = document.getElementById('refreshMatches');
const logoutBtn = document.getElementById('logoutBtn');
const refereeName = document.getElementById('refereeName');
const loadingSpinner = document.getElementById('loadingSpinner');

// Modal elements
const startSetModal = document.getElementById('startSetModal');
const closeStartSetModal = document.getElementById('closeStartSetModal');
const startSetForm = document.getElementById('startSetForm');
const matchSetsModal = document.getElementById('matchSetsModal');
const closeMatchSetsModal = document.getElementById('closeMatchSetsModal');
const startIndividualMatchModal = document.getElementById('startIndividualMatchModal');
const closeIndividualMatchModal = document.getElementById('closeIndividualMatchModal');
const startIndividualMatchForm = document.getElementById('startIndividualMatchForm');

// Global variables
let currentMatchId = null;
let currentMatchData = null;
let currentIndividualMatch = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadMatches();
    setupEventListeners();
});

// Check if referee is authenticated
async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth/session');
        const result = await response.json();

        if (!result.success || result.user.type !== 'referee') {
            window.location.href = '/?auth=required&type=referee';
            return;
        }

        // Set referee name
        refereeName.textContent = result.user.name || 'Referee';
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = '/?auth=required&type=referee';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Refresh matches
    refreshMatchesBtn.addEventListener('click', loadMatches);

    // Logout
    logoutBtn.addEventListener('click', logout);

    // Modal close buttons
    closeStartSetModal.addEventListener('click', () => hideModal(startSetModal));
    closeMatchSetsModal.addEventListener('click', () => hideModal(matchSetsModal));
    closeIndividualMatchModal.addEventListener('click', () => hideModal(startIndividualMatchModal));

    // Modal overlay clicks
    document.querySelectorAll('.modal_overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal);
        });
    });

    // Start set form submission
    startSetForm.addEventListener('submit', handleStartSet);

    // Start individual match form submission
    startIndividualMatchForm.addEventListener('submit', handleStartIndividualMatch);

    // Cancel buttons
    document.getElementById('cancelStartSet').addEventListener('click', () => hideModal(startSetModal));
    document.getElementById('cancelIndividualMatch').addEventListener('click', () => hideModal(startIndividualMatchModal));
}

// Load matches data
async function loadMatches() {
    showLoading(true);
    try {
        const response = await fetch('/api/referee/assigned-matches');
        const result = await response.json();

        if (result.success) {
            renderAssignedMatches(result.assignedMatches);
            renderCompletedMatches(result.completedMatches);
        } else {
            showError('Failed to load matches: ' + result.message);
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        showError('Failed to load matches. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Render assigned matches
function renderAssignedMatches(matches) {
    if (matches.length === 0) {
        assignedMatchesContainer.innerHTML = `
            <div class="empty_state">
                <h3>No Assigned Matches</h3>
                <p>You don't have any assigned matches at the moment. Check back later or contact the admin.</p>
            </div>
        `;
        return;
    }

    assignedMatchesContainer.innerHTML = matches.map(match => createMatchCard(match, 'assigned')).join('');
}

// Render completed matches
function renderCompletedMatches(matches) {
    if (matches.length === 0) {
        completedMatchesContainer.innerHTML = `
            <div class="empty_state">
                <h3>No Completed Matches</h3>
                <p>You haven't completed any matches yet.</p>
            </div>
        `;
        return;
    }

    completedMatchesContainer.innerHTML = matches.map(match => createMatchCard(match, 'completed')).join('');
}

// Create match card HTML
function createMatchCard(match, type) {
    const statusClass = getStatusClass(match.matchStatus);
    const progressPercentage = getProgressPercentage(match);
    const maxMatches = match.gender === 'boys' ? 5 : 3;
    
    return `
        <div class="match_card">
            <div class="match_card_header">
                <div class="match_teams">${match.college1Name} vs ${match.college2Name}</div>
                <div class="match_info_line">${match.date} • ${match.time}</div>
                <div class="match_info_line">Court: ${match.court || 'TBA'} • Round: ${match.round}</div>
                <div class="match_info_line">Gender: ${match.gender.toUpperCase()}</div>
            </div>
            
            <div class="match_card_body">
                <div class="match_status ${statusClass}">
                    ${getStatusText(match)}
                </div>
                
                ${match.matchStatus !== 'complete' ? `
                    <div class="match_progress">
                        <div class="progress_text">Progress: ${match.completedMatches || 0}/${maxMatches} matches completed</div>
                        <div class="progress_bar">
                            <div class="progress_fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                ` : ''}
                
                ${match.overallWinner ? `
                    <div class="winner_badge">
                        Winner: ${match.overallWinner === 'team1' ? match.college1Name : match.college2Name}
                    </div>
                ` : ''}
                
                <div class="match_actions">
                    ${getActionButtons(match, type)}
                </div>
            </div>
        </div>
    `;
}

// Get status class for styling
function getStatusClass(status) {
    const statusMap = {
        'upcoming': 'status_upcoming',
        'live': 'status_live',
        'complete': 'status_complete',
        'players_allocated': 'status_upcoming'
    };
    return statusMap[status] || 'status_upcoming';
}

// Get status text
function getStatusText(match) {
    if (match.matchStatus === 'complete') return 'Completed';
    if (match.setInProgress) return 'In Progress';
    if (match.setStarted) return 'Set Started';
    return 'Upcoming';
}

// Get progress percentage
function getProgressPercentage(match) {
    const maxMatches = match.gender === 'boys' ? 5 : 3;
    return ((match.completedMatches || 0) / maxMatches) * 100;
}

// Get action buttons based on match state
function getActionButtons(match, type) {
    if (type === 'completed') {
        return `<button class="action_btn btn_disabled">View Results</button>`;
    }

    if (!match.setStarted) {
        return `<button class="action_btn start_set_btn" onclick="openStartSetModal('${match._id}')">Start Set</button>`;
    }

    if (match.setStarted && !match.overallWinner) {
        return `<button class="action_btn view_matches_btn" onclick="openMatchSetsModal('${match._id}')">View Matches</button>`;
    }

    return `<button class="action_btn btn_disabled">Set Complete</button>`;
}

// Open start set modal
async function openStartSetModal(matchId) {
    currentMatchId = matchId;
    
    try {
        const response = await fetch(`/api/referee/match-details/${matchId}`);
        const result = await response.json();

        if (result.success) {
            currentMatchData = result.match;
            
            // Populate modal
            document.getElementById('matchTeams').textContent = 
                `${currentMatchData.college1Name} vs ${currentMatchData.college2Name}`;
            document.getElementById('matchDetails').textContent = 
                `${currentMatchData.date} • ${currentMatchData.time} • ${currentMatchData.gender.toUpperCase()}`;
            
            // Populate first serve options
            const firstServeSelect = document.getElementById('firstServeCollege');
            firstServeSelect.innerHTML = `
                <option value="">Select College</option>
                <option value="college1">${currentMatchData.college1Name}</option>
                <option value="college2">${currentMatchData.college2Name}</option>
            `;
            
            showModal(startSetModal);
        }
    } catch (error) {
        console.error('Error loading match details:', error);
        showError('Failed to load match details');
    }
}

// Handle start set form submission
async function handleStartSet(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        courtNumber: formData.get('courtNumber'),
        firstServeCollege: formData.get('firstServeCollege')
    };

    try {
        const response = await fetch(`/api/referee/start-set/${currentMatchId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            hideModal(startSetModal);
            showSuccess('Set started successfully!');
            loadMatches(); // Reload matches
        } else {
            showError('Failed to start set: ' + result.message);
        }
    } catch (error) {
        console.error('Error starting set:', error);
        showError('Failed to start set. Please try again.');
    }
}

// Open match sets modal
async function openMatchSetsModal(matchId) {
    currentMatchId = matchId;
    
    try {
        const response = await fetch(`/api/referee/match-details/${matchId}`);
        const result = await response.json();

        if (result.success) {
            currentMatchData = result.match;
            
            // Update modal header
            document.getElementById('setMatchTeams').textContent = 
                `${currentMatchData.college1Name} vs ${currentMatchData.college2Name}`;
            
            // Update score display
            updateSetScoreDisplay();
            
            // Render individual matches
            renderIndividualMatches();
            
            showModal(matchSetsModal);
        }
    } catch (error) {
        console.error('Error loading match details:', error);
        showError('Failed to load match details');
    }
}

// Update set score display
function updateSetScoreDisplay() {
    document.getElementById('college1Name').textContent = currentMatchData.college1Name;
    document.getElementById('college2Name').textContent = currentMatchData.college2Name;
    
    // Calculate team scores (number of matches won)
    let college1Score = 0;
    let college2Score = 0;
    
    Object.values(currentMatchData.matches).forEach(match => {
        if (match.winnerTeam === 'team1') college1Score++;
        else if (match.winnerTeam === 'team2') college2Score++;
    });
    
    document.getElementById('college1Score').textContent = college1Score;
    document.getElementById('college2Score').textContent = college2Score;
}

// Render individual matches
function renderIndividualMatches() {
    const container = document.getElementById('individualMatches');
    const matches = currentMatchData.matches;
    const gender = currentMatchData.gender;
    
    let matchesHtml = '';
    
    if (gender === 'boys') {
        matchesHtml = `
            ${createIndividualMatchCard('match1Singles', 'Singles 1st', matches.match1Singles)}
            ${createIndividualMatchCard('match2Singles', 'Singles 2nd', matches.match2Singles)}
            ${createIndividualMatchCard('match3Doubles', 'Doubles 1st', matches.match3Doubles)}
            ${createIndividualMatchCard('match4Singles', 'Singles 3rd', matches.match4Singles)}
            ${createIndividualMatchCard('match5Doubles', 'Doubles 2nd', matches.match5Doubles)}
        `;
    } else {
        matchesHtml = `
            ${createIndividualMatchCard('match1Singles', 'Singles 1st', matches.match1Singles)}
            ${createIndividualMatchCard('match2Doubles', 'Doubles', matches.match2Doubles)}
            ${createIndividualMatchCard('match3Singles', 'Singles 2nd', matches.match3Singles)}
        `;
    }
    
    container.innerHTML = matchesHtml;
}

// Create individual match card
function createIndividualMatchCard(matchKey, title, matchData) {
    const isDoubles = matchKey.includes('Doubles');
    const isStarted = matchData.isStarted || false;
    const isCompleted = matchData.isCompleted || false;
    
    let playersHtml = '';
    if (isDoubles) {
        playersHtml = `
            <div class="player_vs">
                <div class="player_info">
                    <div class="player_name">${matchData.team1Player1Name || 'TBA'} & ${matchData.team1Player2Name || 'TBA'}</div>
                    <div class="college_name">${currentMatchData.college1Name}</div>
                </div>
                <div class="vs_text">VS</div>
                <div class="player_info">
                    <div class="player_name">${matchData.team2Player1Name || 'TBA'} & ${matchData.team2Player2Name || 'TBA'}</div>
                    <div class="college_name">${currentMatchData.college2Name}</div>
                </div>
            </div>
        `;
    } else {
        playersHtml = `
            <div class="player_vs">
                <div class="player_info">
                    <div class="player_name">${matchData.player1Name || 'TBA'}</div>
                    <div class="college_name">${currentMatchData.college1Name}</div>
                </div>
                <div class="vs_text">VS</div>
                <div class="player_info">
                    <div class="player_name">${matchData.player2Name || 'TBA'}</div>
                    <div class="college_name">${currentMatchData.college2Name}</div>
                </div>
            </div>
        `;
    }
    
    let buttonHtml = '';
    let winnerHtml = '';
    
    if (isCompleted) {
        const winnerTeam = matchData.winnerTeam;
        const winnerCollege = winnerTeam === 'team1' ? currentMatchData.college1Name : currentMatchData.college2Name;
        buttonHtml = `<button class="start_match_btn match_completed" disabled>Completed</button>`;
        winnerHtml = `<div class="winner_indicator">Winner: ${winnerCollege}</div>`;
    } else if (isStarted) {
        buttonHtml = `<button class="start_match_btn match_started" onclick="goToScorecard('${matchKey}')">Go to Scorecard</button>`;
    } else {
        const hasPlayers = isDoubles ? 
            (matchData.team1Player1Name && matchData.team2Player1Name) :
            (matchData.player1Name && matchData.player2Name);
            
        if (hasPlayers) {
            buttonHtml = `<button class="start_match_btn" onclick="openStartIndividualMatchModal('${matchKey}', '${title}')">Start Match</button>`;
        } else {
            buttonHtml = `<button class="start_match_btn btn_disabled" disabled>Players Not Allocated</button>`;
        }
    }
    
    return `
        <div class="individual_match_card">
            <div class="match_title">${title}</div>
            <div class="match_players">${playersHtml}</div>
            ${winnerHtml}
            <div class="match_card_actions">
                ${buttonHtml}
            </div>
        </div>
    `;
}

// Open start individual match modal
function openStartIndividualMatchModal(matchKey, title) {
    currentIndividualMatch = matchKey;
    const matchData = currentMatchData.matches[matchKey];
    
    // Update modal content
    document.getElementById('individualMatchTitle').textContent = title;
    
    const isDoubles = matchKey.includes('Doubles');
    let playersText = '';
    if (isDoubles) {
        playersText = `${matchData.team1Player1Name} & ${matchData.team1Player2Name} vs ${matchData.team2Player1Name} & ${matchData.team2Player2Name}`;
    } else {
        playersText = `${matchData.player1Name} vs ${matchData.player2Name}`;
    }
    document.getElementById('individualMatchPlayers').textContent = playersText;
    
    // Populate first serve options
    const firstServeSelect = document.getElementById('firstServePlayer');
    firstServeSelect.innerHTML = `
        <option value="">Select Player/Team</option>
        <option value="college1">${currentMatchData.college1Name}</option>
        <option value="college2">${currentMatchData.college2Name}</option>
    `;
    
    showModal(startIndividualMatchModal);
}

// Handle start individual match form submission
async function handleStartIndividualMatch(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        maxPoints: parseInt(formData.get('maxPoints')),
        numberOfSets: parseInt(formData.get('numberOfSets')),
        courtNumber: parseInt(formData.get('matchCourtNumber')),
        firstServePlayer: formData.get('firstServePlayer')
    };

    try {
        const response = await fetch(`/api/referee/start-match/${currentMatchId}/${currentIndividualMatch}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            hideModal(startIndividualMatchModal);
            showSuccess('Match started successfully!');
            
            // Redirect to scorecard page with match details
            const params = new URLSearchParams({
                matchId: currentMatchId,
                matchType: currentIndividualMatch,
                gender: currentMatchData.gender
            });
            window.location.href = `/scorecard?${params.toString()}`;
        } else {
            showError('Failed to start match: ' + result.message);
        }
    } catch (error) {
        console.error('Error starting individual match:', error);
        showError('Failed to start match. Please try again.');
    }
}

// Go to scorecard for existing match
function goToScorecard(matchKey) {
    const params = new URLSearchParams({
        matchId: currentMatchId,
        matchType: matchKey,
        gender: currentMatchData.gender
    });
    window.location.href = `/scorecard?${params.toString()}`;
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        const result = await response.json();
        
        if (result.success) {
            window.location.href = '/';
        } else {
            showError('Failed to logout');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showError('Failed to logout. Please try again.');
    }
}

// Modal utilities
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    
    // Clear forms
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
}

// Loading utilities
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

// Notification utilities
function showSuccess(message) {
    // Create and show success notification
    showNotification(message, 'success');
}

function showError(message) {
    // Create and show error notification
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification_content">
            <span class="notification_icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="notification_message">${message}</span>
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
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
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}