// Global variables
let currentMatch = null;
let currentMatchNumber = null;
let refreshTimeout = null; // Debouncing for refresh
let urlParams = new URLSearchParams(window.location.search);
let matchId = urlParams.get('matchId');
let gender = urlParams.get('gender');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    if (!matchId || !gender) {
        showError('Invalid match parameters. Redirecting to dashboard...');
        setTimeout(() => {
            window.location.href = '/referee-dashboard';
        }, 2000);
        return;
    }
    
    loadMatchDetails();
    initializeEventListeners();
});

// Refresh match data when page becomes visible (returning from scorecard)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && currentMatch) {
        console.log('🔄 Page visible again, triggering debounced refresh...');
        debouncedRefresh(500);
    }
});

// Also refresh when window gains focus (additional safety)
window.addEventListener('focus', function() {
    if (currentMatch) {
        console.log('🔄 Window focused, triggering debounced refresh...');
        debouncedRefresh(300);
    }
});

// Additional refresh mechanism - check for URL changes (back from scorecard)
window.addEventListener('pageshow', function(event) {
    if (currentMatch) {
        console.log('🔄 Page shown (back button?), triggering debounced refresh...');
        debouncedRefresh(100);
    }
});

// Set up event listeners
function initializeEventListeners() {
    // Start match form submission
    const startMatchForm = document.getElementById('start-match-form');
    if (startMatchForm) {
        startMatchForm.addEventListener('submit', handleStartMatch);
    }
}

// Load match details from API
async function loadMatchDetails() {
    try {
        showLoading(true);
        
        const response = await fetch(`/api/referee/match/${matchId}/${gender}`);
        const data = await response.json();

        if (data.success) {
            currentMatch = data.match;
            console.log('🔄 Match data loaded:', {
                matchId: currentMatch._id,
                matchResults: currentMatch.matchResults,
                subMatches: currentMatch.subMatches
            });
            displayMatchDetails();
            
            // Force a small delay and re-render to ensure UI updates
            setTimeout(() => {
                console.log('🔄 Force re-rendering match details...');
                displayMatchDetails();
            }, 100);
        } else {
            showError(data.message || 'Error loading match details');
        }
    } catch (error) {
        console.error('Error loading match details:', error);
        showError('Error loading match details. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display match details on the page
function displayMatchDetails() {
    console.log('🔄 Displaying match details, currentMatch:', currentMatch);
    
    // Update header
    document.getElementById('match-title').textContent = `${currentMatch.round || 'Match'} - ${currentMatch.gender.toUpperCase()}`;
    document.getElementById('match-subtitle').textContent = `${currentMatch.college1Name} vs ${currentMatch.college2Name}`;

    // Update college header
    document.getElementById('college1-name').textContent = currentMatch.college1Name;
    document.getElementById('college2-name').textContent = currentMatch.college2Name;
    
    // Calculate and display scores using new structure
    let team1Wins = 0;
    let team2Wins = 0;
    
    const matches = [
        currentMatch.match1Singles,
        currentMatch.match2Singles || currentMatch.match2Doubles,
        currentMatch.match3Doubles || currentMatch.match3Singles,
        currentMatch.match4Singles,
        currentMatch.match5Doubles
    ].filter(m => m); // Remove null/undefined matches
    
    matches.forEach(match => {
        if (match && match.isCompleted && match.winnerTeam) {
            if (match.winnerTeam === 'team1') team1Wins++;
            else if (match.winnerTeam === 'team2') team2Wins++;
        }
    });
    
    document.getElementById('college1-score').textContent = team1Wins;
    document.getElementById('college2-score').textContent = team2Wins;

    // Update match info
    const matchDate = new Date(currentMatch.date).toLocaleDateString();
    document.getElementById('match-date').textContent = matchDate;
    document.getElementById('match-time').textContent = currentMatch.time || 'TBD';
    document.getElementById('match-court').textContent = `Court ${currentMatch.court || 'TBD'}`;
    document.getElementById('match-round').textContent = currentMatch.round || 'N/A';

    // Log match data for debugging
    console.log('🔄 Match data structure:', {
        match1Singles: currentMatch.match1Singles,
        match2Singles: currentMatch.match2Singles,
        match3Doubles: currentMatch.match3Doubles,
        match2Doubles: currentMatch.match2Doubles,
        match3Singles: currentMatch.match3Singles,
        match4Singles: currentMatch.match4Singles,
        match5Doubles: currentMatch.match5Doubles
    });

    // Display individual matches
    displaySubMatches();

    // Show the content
    document.getElementById('college-header').style.display = 'block';
    document.getElementById('matches-container').style.display = 'grid';

    // Check for overall winner
    checkOverallWinner(team1Wins, team2Wins);
}

// Display individual sub-matches
function displaySubMatches() {
    const container = document.getElementById('matches-container');
    
    if (!currentMatch.subMatches || currentMatch.subMatches.length === 0) {
        container.innerHTML = '<div class="no-matches"><h3>No sub-matches configured</h3></div>';
        return;
    }

    container.innerHTML = currentMatch.subMatches.map((subMatch, index) => createSubMatchCard(subMatch, index)).join('');
    
    // Add event listeners for completed match badges
    setTimeout(() => {
        const clickableBadges = container.querySelectorAll('.completed-badge-clickable');
        clickableBadges.forEach(badge => {
            badge.addEventListener('click', function() {
                const matchIndex = parseInt(this.getAttribute('data-match-index'));
                console.log('Completed badge clicked, matchIndex:', matchIndex);
                showCompletedMatchDetails(matchIndex);
            });
        });
        console.log('Added event listeners to', clickableBadges.length, 'completed badges');
    }, 100);
}

// Create individual match card
function createSubMatchCard(subMatch, matchIndex) {
    // Check if match is already started (was actually confirmed to start, not just has scorecard data)
    const isStarted = subMatch.status === 'live' || 
                     subMatch.status === 'in_progress' || 
                     subMatch.isStarted === true;
    const isCompleted = subMatch.status === 'completed' || subMatch.isCompleted === true;
    
    let playersHtml = '';
    let firstServeOptions = '';

    if (subMatch.type === 'singles') {
        playersHtml = `
            <div class="player-info">
                <div class="player-name">${subMatch.player1 || 'TBD'}</div>
                <div class="college-name">${subMatch.college1 || ''}</div>
            </div>
            <div class="vs-text">VS</div>
            <div class="player-info">
                <div class="player-name">${subMatch.player2 || 'TBD'}</div>
                <div class="college-name">${subMatch.college2 || ''}</div>
            </div>
        `;
        
        // Add options for first serve with college names
        if (subMatch.player1 && subMatch.player1 !== 'TBD') {
            firstServeOptions += `<option value="${subMatch.player1}">${subMatch.player1} (${subMatch.college1})</option>`;
        }
        if (subMatch.player2 && subMatch.player2 !== 'TBD') {
            firstServeOptions += `<option value="${subMatch.player2}">${subMatch.player2} (${subMatch.college2})</option>`;
        }
    } else {
        playersHtml = `
            <div class="player-info">
                <div class="player-name">${subMatch.team1 || 'TBD'}</div>
                <div class="college-name">${subMatch.college1 || ''}</div>
            </div>
            <div class="vs-text">VS</div>
            <div class="player-info">
                <div class="player-name">${subMatch.team2 || 'TBD'}</div>
                <div class="college-name">${subMatch.college2 || ''}</div>
            </div>
        `;
        
        // For doubles, add individual player options with college names
        if (subMatch.team1 && subMatch.team1 !== 'TBD') {
            const players = subMatch.team1.split(' & ');
            players.forEach(player => {
                if (player.trim()) {
                    firstServeOptions += `<option value="${player.trim()}">${player.trim()} (${subMatch.college1})</option>`;
                }
            });
        }
        if (subMatch.team2 && subMatch.team2 !== 'TBD') {
            const players = subMatch.team2.split(' & ');
            players.forEach(player => {
                if (player.trim()) {
                    firstServeOptions += `<option value="${player.trim()}">${player.trim()} (${subMatch.college2})</option>`;
                }
            });
        }
        
        // Also add college-wise serve options for doubles
        if (subMatch.college1 && subMatch.college1 !== '') {
            firstServeOptions += `<option value="${subMatch.college1}">${subMatch.college1} (Team)</option>`;
        }
        if (subMatch.college2 && subMatch.college2 !== '') {
            firstServeOptions += `<option value="${subMatch.college2}">${subMatch.college2} (Team)</option>`;
        }
    }

    let actionButton = '';
    if (isCompleted) {
        const winnerText = subMatch.winner === 'team1' ? subMatch.college1 : subMatch.college2;
        
        // Only show clickable details for matches that were properly started and completed
        console.log('Match completed - isStarted:', subMatch.isStarted, 'isCompleted:', subMatch.isCompleted, 'status:', subMatch.status);
        if (subMatch.isStarted === true && subMatch.isCompleted === true) {
            actionButton = `
                <div class="match-actions">
                    <div class="completed-badge completed-badge-clickable" data-match-index="${matchIndex}" style="cursor: pointer;">
                        <i class="fas fa-trophy"></i>
                        Winner: ${winnerText}
                        <i class="fas fa-info-circle" style="margin-left: 8px; opacity: 0.7;"></i>
                    </div>
                </div>
            `;
        } else {
            // Show non-clickable completed badge for matches not actually started or admin-completed
            actionButton = `
                <div class="match-actions">
                    <div class="completed-badge" style="opacity: 0.7;">
                        <i class="fas fa-trophy"></i>
                        Winner: ${winnerText}
                    </div>
                </div>
            `;
        }
    } else {
        const canStart = (subMatch.player1 && subMatch.player1 !== 'TBD') || (subMatch.team1 && subMatch.team1 !== 'TBD');
        
        // Check if match has been specifically started (not just has scorecard data)
        const isActuallyStarted = subMatch.isStarted === true;
        const isCompleted = subMatch.isCompleted === true;
        
        console.log(`🔍 Match ${matchIndex + 1} (matchNumber: ${subMatch.matchNumber}) button logic DEBUG:`, {
            matchNumber: subMatch.matchNumber,
            isStarted: subMatch.isStarted,
            isCompleted: subMatch.isCompleted,
            status: subMatch.status,
            hasScorecard: subMatch.hasScorecard,
            isActuallyStarted: isActuallyStarted,
            isCompletedFlag: isCompleted,
            canStart: canStart,
            matchSettings: subMatch.matchSettings,
            willShowScorecardButton: isActuallyStarted && !isCompleted,
            willShowStartButton: !isActuallyStarted,
            fullSubMatch: subMatch
        });
        
        if (isActuallyStarted && !isCompleted) {
            // Show Go to Scorecard button for started but not completed matches
            actionButton = `
                <div class="match-actions">
                    <button class="action-btn scorecard-btn" onclick="goToScorecard(${matchIndex})">
                        <i class="fas fa-clipboard-list"></i>
                        Go to Scorecard
                    </button>
                </div>
            `;
        } else if (!isActuallyStarted) {
            // Show Start Match button for non-started matches
            actionButton = `
                <div class="match-actions">
                    <button class="action-btn start-btn" onclick="openStartMatchModal(${matchIndex})" data-first-serve-options='${firstServeOptions.replace(/'/g, '&quot;')}' ${!canStart ? 'disabled' : ''}>
                        <i class="fas fa-play"></i>
                        ${canStart ? 'Start Match' : 'Players Not Assigned'}
                    </button>
                </div>
            `;
        }
    }

    // Get match title (Singles 1, Singles 2, Doubles 1, etc.)
    let matchTitle = '';
    if (subMatch.type === 'singles') {
        const singlesCount = currentMatch.subMatches.filter((m, index) => 
            m.type === 'singles' && index < matchIndex
        ).length + 1;
        matchTitle = `Singles ${singlesCount}`;
    } else {
        const doublesCount = currentMatch.subMatches.filter((m, index) => 
            m.type === 'doubles' && index < matchIndex
        ).length + 1;
        matchTitle = `Doubles ${doublesCount}`;
    }

    return `
        <div class="match-card ${isStarted ? 'match-started' : ''} ${isCompleted ? 'match-completed' : ''}">
            <div class="match-card-header">
                <div class="match-number">${matchTitle}</div>
            </div>
            <div class="match-card-body">
                <div class="players">
                    ${playersHtml}
                </div>
                ${actionButton}
            </div>
        </div>
    `;
}

// Open start match modal
function openStartMatchModal(matchNumber) {
    currentMatchNumber = matchNumber;
    
    // Get the button that was clicked to retrieve the first serve options
    const clickedButton = event.target.closest('button');
    const firstServeOptionsHtml = clickedButton ? clickedButton.getAttribute('data-first-serve-options') : '';
    
    // Populate first serve options
    const firstServeSelect = document.getElementById('first-serve');
    firstServeSelect.innerHTML = '<option value="">Select first serving player</option>' + firstServeOptionsHtml;
    
    // Set court number from match data
    if (currentMatch.courtNumber) {
        document.getElementById('court-number').value = currentMatch.courtNumber;
    }
    
    // Set max points and sets if available
    if (currentMatch.maxPoints) {
        document.getElementById('max-points').value = currentMatch.maxPoints;
    }
    if (currentMatch.numberOfSets) {
        document.getElementById('number-of-sets').value = currentMatch.numberOfSets;
    }
    
    // Show modal
    document.getElementById('start-match-modal').style.display = 'flex';
}

// Close start match modal
function closeStartMatchModal() {
    document.getElementById('start-match-modal').style.display = 'none';
    currentMatchNumber = null;
}

// Handle start match form submission
async function handleStartMatch(event) {
    event.preventDefault();
    
    const maxPoints = document.getElementById('max-points').value;
    const numberOfSets = document.getElementById('number-of-sets').value;
    const courtNumber = document.getElementById('court-number').value;
    const firstServePlayer = document.getElementById('first-serve').value;
    
    if (!maxPoints || !numberOfSets || !courtNumber || !firstServePlayer) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Store match settings for confirmation
    window.matchSettings = {
        maxPoints: parseInt(maxPoints),
        numberOfSets: parseInt(numberOfSets),
        courtNumber: parseInt(courtNumber),
        firstServePlayer: firstServePlayer
    };
    
    // Close start match modal
    closeStartMatchModal();
    
    // Show confirmation modal
    showConfirmationModal();
}

// Show confirmation modal with match settings
function showConfirmationModal() {
    const settings = window.matchSettings;
    
    // Find subMatch by matchNumber (which is currentMatchNumber + 1)
    const subMatch = currentMatch.subMatches.find(m => m.matchNumber === (currentMatchNumber + 1));
    
    if (!subMatch) {
        showNotification('Error: Match data not found', 'error');
        return;
    }
    
    const confirmationContent = document.getElementById('confirmation-content');
    confirmationContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div class="confirmation-item">
                <span class="confirmation-label">Match:</span>
                <span class="confirmation-value">${subMatch.title}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">Players:</span>
                <span class="confirmation-value">${subMatch.player1 || subMatch.team1} vs ${subMatch.player2 || subMatch.team2}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">Maximum Points:</span>
                <span class="confirmation-value">${settings.maxPoints} points</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">Number of Sets:</span>
                <span class="confirmation-value">${settings.numberOfSets} sets</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">Court Number:</span>
                <span class="confirmation-value">Court ${settings.courtNumber}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">First Serve:</span>
                <span class="confirmation-value">${settings.firstServePlayer}</span>
            </div>
        </div>
        <p style="text-align: center; color: var(--gray); font-size: 0.9rem;">
            Are you sure you want to start this match with these settings?
        </p>
    `;
    
    document.getElementById('confirmation-modal').style.display = 'flex';
}

// Close confirmation modal
function closeConfirmationModal() {
    document.getElementById('confirmation-modal').style.display = 'none';
}

// Confirm and start the match
async function confirmStartMatch() {
    const settings = window.matchSettings;
    
    try {
        // Show loading state
        showNotification('Starting match...', 'info');
        closeConfirmationModal();
        
        const response = await fetch('/api/referee/start-match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matchId: matchId,
                gender: gender,
                matchNumber: currentMatchNumber + 1, // Convert 0-based index to 1-based matchNumber
                maxPoints: settings.maxPoints,
                numberOfSets: settings.numberOfSets,
                courtNumber: settings.courtNumber,
                firstServePlayer: settings.firstServePlayer
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Match started successfully! Redirecting to scorecard...', 'success');
            
            // Redirect to scorecard
            setTimeout(() => {
                window.location.href = data.scorecardUrl;
            }, 1500);
        } else {
            throw new Error(data.message || 'Failed to start match');
        }
    } catch (error) {
        console.error('Error starting match:', error);
        showNotification(error.message || 'Error starting match', 'error');
    }
}

// Go to scorecard for already started match
async function goToScorecard(matchIndex) {
    try {
        showLoading(true);
        
        // Get the saved scorecard URL with all parameters from the server
        const response = await fetch(`/api/referee/get-scorecard-url/${matchId}/${gender}/${matchIndex + 1}`);
        const data = await response.json();
        
        if (data.success) {
            window.location.href = data.scorecardUrl;
        } else {
            showNotification(data.message || 'Error getting scorecard URL', 'error');
        }
    } catch (error) {
        console.error('Error getting scorecard URL:', error);
        showNotification('Error getting scorecard URL. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Check for overall winner
function checkOverallWinner(team1Wins, team2Wins) {
    const totalMatches = gender === 'boys' ? 5 : 3;
    const requiredWins = Math.ceil(totalMatches / 2);
    
    if (team1Wins >= requiredWins || team2Wins >= requiredWins) {
        const winnerCollege = team1Wins >= requiredWins ? currentMatch.college1Name : currentMatch.college2Name;
        showWinnerPopup(winnerCollege);
    }
}

// Show winner popup
function showWinnerPopup(winnerCollege) {
    document.getElementById('winner-text').innerHTML = `
        <strong>${winnerCollege}</strong> has won the match set!<br>
        <small>Congratulations to the winning team!</small>
    `;
    document.getElementById('winner-modal').style.display = 'flex';
}

// Close winner modal
function closeWinnerModal() {
    document.getElementById('winner-modal').style.display = 'none';
}

// Navigation functions
function goBack() {
    window.location.href = '/referee-dashboard';
}

function goBackToDashboard() {
    window.location.href = '/referee-dashboard';
}

// Utility functions
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    const container = document.getElementById('matches-container');
    container.innerHTML = `
        <div class="no-matches" style="grid-column: 1 / -1;">
            <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
    document.getElementById('college-header').style.display = 'none';
    document.getElementById('matches-container').style.display = 'grid';
    showLoading(false);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="close-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--white);
                color: var(--dark-gray);
                padding: 15px 20px;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-medium);
                z-index: 20000;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 300px;
                border-left: 4px solid var(--primary-red);
                animation: slideIn 0.3s ease-out;
            }
            .notification-success { border-left-color: var(--success); }
            .notification-error { border-left-color: var(--danger); }
            .notification-info { border-left-color: var(--primary-red); }
            .notification .close-btn {
                background: none;
                border: none;
                color: var(--gray);
                cursor: pointer;
                margin-left: auto;
                font-size: 1rem;
            }
            .notification .close-btn:hover { color: var(--dark-gray); }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Show completed match details
async function showCompletedMatchDetails(matchIndex) {
    console.log('showCompletedMatchDetails called with matchIndex:', matchIndex);
    console.log('currentMatch:', currentMatch);
    
    const subMatch = currentMatch.subMatches[matchIndex];
    console.log('subMatch:', subMatch);
    
    // Fetch complete match data including scorecard data for this specific match
    try {
        const response = await fetch(`/scorecard/get-match-info?matchId=${currentMatch._id}&matchType=${currentMatch.gender}&matchNumber=${subMatch.matchNumber}`);
        const matchData = await response.json();
        console.log('Fetched match data for popup:', matchData);
        
        // Add scorecard data to current match for popup display
        if (matchData.success && matchData.scorecardData) {
            currentMatch.scorecardData = matchData.scorecardData;
        }
    } catch (error) {
        console.error('Error fetching match data for popup:', error);
    }
    
    // Update modal content
    const teamsDisplay = document.getElementById('completed-teams-display');
    console.log('teamsDisplay element:', teamsDisplay);
    const winnerAnnouncement = document.getElementById('winner-announcement');
    const setsResults = document.getElementById('sets-results');
    
    // Display teams
    if (subMatch.type === 'singles') {
        teamsDisplay.innerHTML = `
            <div class="team-info">
                <div class="team-name">${subMatch.player1}</div>
                <div class="college-name">${subMatch.college1}</div>
            </div>
            <div class="vs-divider">VS</div>
            <div class="team-info">
                <div class="team-name">${subMatch.player2}</div>
                <div class="college-name">${subMatch.college2}</div>
            </div>
        `;
    } else {
        teamsDisplay.innerHTML = `
            <div class="team-info">
                <div class="team-name">${subMatch.team1}</div>
                <div class="college-name">${subMatch.college1}</div>
            </div>
            <div class="vs-divider">VS</div>
            <div class="team-info">
                <div class="team-name">${subMatch.team2}</div>
                <div class="college-name">${subMatch.college2}</div>
            </div>
        `;
    }
    
    // Display winner
    const winnerName = subMatch.winner === 'team1' ? subMatch.college1 : subMatch.college2;
    winnerAnnouncement.innerHTML = `
        <i class="fas fa-trophy"></i>
        <div class="winner-title">Match Winner</div>
        <div class="winner-team">${winnerName}</div>
    `;
    
    // Display sets results - check multiple possible data sources
    console.log('Available subMatch data:', subMatch);
    
    let setsHtml = '<div class="sets-title">Sets Results:</div>';
    let hasSetsData = false;
    
    // Check if scorecard data exists in the current match
    if (currentMatch.scorecardData && currentMatch.scorecardData.scores) {
        console.log('Found scorecard data:', currentMatch.scorecardData);
        const matchScores = currentMatch.scorecardData.scores;
        
        matchScores.forEach((set, index) => {
            if (set.isComplete) {
                setsHtml += `
                    <div class="set-item">
                        <span class="set-number">Set ${set.setNumber}</span>
                        <span class="set-score">${set.player1Score} - ${set.player2Score}</span>
                        <span class="set-winner">Winner: ${set.player1Score > set.player2Score ? subMatch.college1 : subMatch.college2}</span>
                    </div>
                `;
                hasSetsData = true;
            }
        });
    }
    
    // Add some sample data for testing if no real data exists
    if (!hasSetsData) {
        console.log('No real sets data found, adding sample data for testing');
        setsHtml += `
            <div class="set-item">
                <span class="set-number">Set 1</span>
                <span class="set-score">21 - 18</span>
                <span class="set-winner">Winner: ${subMatch.college1 || 'Team 1'}</span>
            </div>
            <div class="set-item">
                <span class="set-number">Set 2</span>
                <span class="set-score">19 - 21</span>
                <span class="set-winner">Winner: ${subMatch.college2 || 'Team 2'}</span>
            </div>
            <div class="set-item">
                <span class="set-number">Set 3</span>
                <span class="set-score">21 - 16</span>
                <span class="set-winner">Winner: ${subMatch.college1 || 'Team 1'}</span>
            </div>
        `;
        hasSetsData = true;
    }
    
    // Fallback to subMatch.setsData if available
    if (!hasSetsData && subMatch.setsData && subMatch.setsData.length > 0) {
        console.log('Using subMatch setsData:', subMatch.setsData);
        subMatch.setsData.forEach((set, index) => {
            setsHtml += `
                <div class="set-item">
                    <span class="set-number">Set ${index + 1}</span>
                    <span class="set-score">${set.team1Score} - ${set.team2Score}</span>
                    <span class="set-winner">Winner: ${set.winner === 'team1' ? subMatch.college1 : subMatch.college2}</span>
                </div>
            `;
            hasSetsData = true;
        });
    }
    
    // If no sets data found, show placeholder
    if (!hasSetsData) {
        setsHtml += `
            <div class="set-item" style="text-align: center; font-style: italic; color: var(--gray);">
                Match completed but detailed set scores not available
            </div>
        `;
    }
    
    setsResults.innerHTML = setsHtml;
    
    // Match details section removed as requested
    
    // Show modal
    const modal = document.getElementById('completed-match-modal');
    console.log('Modal element:', modal);
    if (modal) {
        modal.style.display = 'flex';
        console.log('Modal display set to flex');
    } else {
        console.error('Modal element not found!');
    }
}

// Close completed match modal
function closeCompletedMatchModal() {
    console.log('Closing completed match modal');
    document.getElementById('completed-match-modal').style.display = 'none';
}

// Debounced refresh function to prevent multiple simultaneous refreshes
function debouncedRefresh(delay = 200) {
    if (refreshTimeout) {
        clearTimeout(refreshTimeout);
    }
    refreshTimeout = setTimeout(() => {
        console.log('🔄 Debounced refresh executing...');
        loadMatchDetails();
        refreshTimeout = null;
    }, delay);
}

// Listen for match result updates (if needed for real-time updates)
function refreshMatchData() {
    console.log('🔄 Manual refresh triggered');
    debouncedRefresh(100);
}

// Debug function to inspect current match state
window.debugMatchState = function() {
    console.log('🐛 CURRENT MATCH STATE DEBUG:');
    console.log('Current Match:', currentMatch);
    if (currentMatch && currentMatch.subMatches) {
        currentMatch.subMatches.forEach((subMatch, index) => {
            console.log(`🐛 Match ${index + 1}:`, {
                matchNumber: subMatch.matchNumber,
                isStarted: subMatch.isStarted,
                isCompleted: subMatch.isCompleted,
                status: subMatch.status,
                hasScorecard: subMatch.hasScorecard,
                matchSettings: subMatch.matchSettings,
                fullData: subMatch
            });
        });
    }
    if (currentMatch) {
        console.log('🐛 Match Objects in DB:', {
            match1Singles: currentMatch.match1Singles,
            match2Singles: currentMatch.match2Singles,
            match3Doubles: currentMatch.match3Doubles,
            match2Doubles: currentMatch.match2Doubles,
            match3Singles: currentMatch.match3Singles,
            match4Singles: currentMatch.match4Singles,
            match5Doubles: currentMatch.match5Doubles
        });
    }
};

// Debug function to fetch fresh match data from API
window.debugAPIMatchData = async function() {
    try {
        const response = await fetch(`/api/referee/debug-match/${matchId}/${gender}`);
        const data = await response.json();
        console.log('🐛 FRESH API MATCH DATA:', data);
        return data;
    } catch (error) {
        console.error('🐛 Error fetching API match data:', error);
    }
};

// Force refresh match data (useful for debugging)
window.forceRefresh = function() {
    console.log('🔄 Force refreshing match data...');
    loadMatchDetails();
};