/**
 * Referee Dashboard JavaScript
 * Handles referee match management, match set view, and scorecard interactions
 */

// Use relative URL to work in any environment
const API_BASE_URL = '';

// Global state
let currentSection = 'assignedMatches';
let currentMatch = null;
let currentSubmatch = null;
let refereeData = null;
let currentMatchId = null;
let currentMatchGender = null;

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    initializeEventListeners();
    
    // Check URL parameters for section navigation
    checkUrlParams();
    
    // Check if there's an active match and load it directly
    checkAndLoadActiveMatch();
    
    // Add focus listener to refresh current match when returning from scorecard
    let lastFocusTime = 0;
    let modalShown = false; // Flag to prevent multiple modal shows
    window.addEventListener('focus', () => {
        const now = Date.now();
        // Prevent rapid consecutive refreshes (debounce for 2 seconds)
        if (now - lastFocusTime < 2000) return;
        lastFocusTime = now;
        
        console.log('Window focused - checking for match updates...');
        if (currentMatchId && currentMatchGender) {
            console.log('Refreshing current match:', currentMatchId, currentMatchGender);
            // Small delay to ensure we're back in focus properly
            setTimeout(() => {
                viewMatchSet(currentMatchId, currentMatchGender);
            }, 500);
        }
    });
    
    // Removed aggressive periodic refresh to prevent conflicts
});

function checkSession() {
    fetch(`${API_BASE_URL}/api/auth/session`)
        .then(response => response.json())
        .then(data => {
            if (!data.success || data.user.type !== 'referee') {
                window.location.href = '/?auth=required&type=referee';
                return;
            }
            
            refereeData = data.user;
            const refereeNameElement = document.getElementById('refereeName');
            if (refereeNameElement) {
                refereeNameElement.textContent = refereeData.name || 'Referee';
            }
        })
        .catch(error => {
            console.error('Session check error:', error);
            window.location.href = '/?auth=required&type=referee';
        });
}

// Check URL parameters for section navigation
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    if (section === 'completedMatches') {
        // Switch to completed matches section
        setTimeout(() => {
            switchSection('completedMatches');
        }, 100);
    }
}

function initializeEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar .menu-item').forEach(item => {
        item.addEventListener('click', () => {
            switchSection(item.dataset.section);
        });
    });

    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Back to matches button
    document.getElementById('backToMatches').addEventListener('click', () => {
        document.getElementById('matchSetSection').style.display = 'none';
        document.getElementById('assignedMatchesSection').style.display = 'block';
        currentMatch = null;
    });

    // Modal close buttons
    document.querySelectorAll('.close, #cancelStartMatch').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('startMatchModal').style.display = 'none';
        });
    });

    document.querySelectorAll('#closeSubmatchModal, #cancelSubmatch').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('startSubmatchModal').style.display = 'none';
        });
    });

    // Start match confirmation
    document.getElementById('confirmStartMatch').addEventListener('click', confirmStartMatch);

    // Start submatch confirmation
    document.getElementById('confirmSubmatch').addEventListener('click', confirmSubmatch);

    // Search inputs
    document.getElementById('assignedMatchesSearch').addEventListener('input', debounce(() => {
        const query = document.getElementById('assignedMatchesSearch').value;
        searchMatches('assigned', query);
    }, 300));

    document.getElementById('completedMatchesSearch').addEventListener('input', debounce(() => {
        const query = document.getElementById('completedMatchesSearch').value;
        searchMatches('completed', query);
    }, 300));
}

// ===========================
// SECTION SWITCHING
// ===========================
function switchSection(sectionName) {
    currentSection = sectionName;
    
    // Update sidebar active item
    document.querySelectorAll('.sidebar .menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.menu-item[data-section="${sectionName}"]`).classList.add('active');
    
    // Update visible section
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    if (sectionName === 'assignedMatches') {
        document.getElementById('assignedMatchesSection').style.display = 'block';
        loadAssignedMatches();
    } else if (sectionName === 'completedMatches') {
        document.getElementById('completedMatchesSection').style.display = 'block';
        loadCompletedMatches();
    }
}

// Toggle sidebar for mobile view
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('active');
    mainContent.classList.toggle('sidebar-active');
}

// ===========================
// DATA LOADING
// ===========================

// Check for active matches and load directly if found
function checkAndLoadActiveMatch() {
    fetch(`${API_BASE_URL}/api/referee/matches/assigned`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch assigned matches');
            }
            return response.json();
        })
        .then(data => {
            if (data.matches && data.matches.length > 0) {
                // Check if there's an active match that should go directly to submatches view
                const activeMatch = data.matches.find(match => match.setInProgress === true || match.matchStarted === true);
                if (activeMatch) {
                    // Directly load the match set view for the active match
                    viewMatchSet(activeMatch._id, activeMatch.gender || 'boys');
                    return;
                }
            }
            
            // If no active match, load assigned matches normally
            loadAssignedMatches();
        })
        .catch(error => {
            console.error('Error checking for active matches:', error);
            // Fallback to loading assigned matches normally
            loadAssignedMatches();
        });
}

// Load assigned matches for the logged-in referee
function loadAssignedMatches() {
    const matchesGrid = document.getElementById('assignedMatchesGrid');
    const loadingEl = document.getElementById('assignedMatchesLoading');
    const noMatchesEl = document.getElementById('noAssignedMatches');
    
    // Show loading, hide no matches message
    matchesGrid.innerHTML = '';
    loadingEl.style.display = 'flex';
    noMatchesEl.style.display = 'none';
    
    fetch(`${API_BASE_URL}/api/referee/matches/assigned`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch assigned matches');
            }
            return response.json();
        })
        .then(data => {
            loadingEl.style.display = 'none';
            
            if (!data.matches || data.matches.length === 0) {
                noMatchesEl.style.display = 'block';
                return;
            }
            
            // Check if there's an active match that should go directly to submatches view
            const activeMatch = data.matches.find(match => match.setInProgress === true || match.matchStarted === true);
            if (activeMatch) {
                // Directly load the match set view for the active match
                viewMatchSet(activeMatch._id, activeMatch.gender || 'boys');
                return;
            }
            
            renderMatchCards(matchesGrid, data.matches, 'assigned');
        })
        .catch(error => {
            console.error('Error loading assigned matches:', error);
            loadingEl.style.display = 'none';
            noMatchesEl.style.display = 'block';
            noMatchesEl.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Matches</h3>
                <p>There was a problem loading your assigned matches. Please try again.</p>
            `;
        });
}

// Load completed matches for the logged-in referee
function loadCompletedMatches() {
    const matchesGrid = document.getElementById('completedMatchesGrid');
    const loadingEl = document.getElementById('completedMatchesLoading');
    const noMatchesEl = document.getElementById('noCompletedMatches');
    
    // Show loading, hide no matches message
    matchesGrid.innerHTML = '';
    loadingEl.style.display = 'flex';
    noMatchesEl.style.display = 'none';
    
    fetch(`${API_BASE_URL}/api/referee/matches/completed`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch completed matches');
            }
            return response.json();
        })
        .then(data => {
            loadingEl.style.display = 'none';
            
            if (!data.matches || data.matches.length === 0) {
                noMatchesEl.style.display = 'block';
                return;
            }
            
            renderMatchCards(matchesGrid, data.matches, 'completed');
        })
        .catch(error => {
            console.error('Error loading completed matches:', error);
            loadingEl.style.display = 'none';
            noMatchesEl.style.display = 'block';
            noMatchesEl.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Matches</h3>
                <p>There was a problem loading your completed matches. Please try again.</p>
            `;
        });
}

// Render match cards to the specified container
function renderMatchCards(container, matches, type) {
    // Check if any match has started
    const activeMatch = matches.find(match => match.setInProgress === true || match.matchStarted === true);
    
    container.innerHTML = matches.map(match => {
        const isActive = match.setInProgress === true || match.matchStarted === true;
        const isStarted = match.matchStarted === true; // Match has been started but may not have active submatch
        const statusClass = getMatchStatusClass(match);
        const statusText = getMatchStatusText(match);
        
        // If there's an active match and this isn't it, don't show it
        if (type === 'assigned' && activeMatch && !isActive) {
            return '';
        }
        
        return `
            <div class="match-card ${isActive ? 'active' : ''}" data-id="${match._id}" data-gender="${match.gender || 'boys'}">
                <div class="match-card-header">
                    <div class="match-status ${statusClass}">${statusText}</div>
                    <div class="match-date">${formatDate(match.date)} ${match.time || ''}</div>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <div class="team-name">${match.college1Name}</div>
                        <div class="team-details">${match.email1 || ''}</div>
                    </div>
                    <div class="vs-text">VS</div>
                    <div class="team">
                        <div class="team-name">${match.college2Name}</div>
                        <div class="team-details">${match.email2 || ''}</div>
                    </div>
                </div>
                <div class="match-details">
                    <div class="match-info">
                        <i class="fas fa-trophy"></i>
                        <span>${formatRoundName(match.round)} (${match.gender === 'girls' ? 'Girls' : 'Boys'})</span>
                    </div>
                    <div class="match-info">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Court ${match.court || 'TBD'}</span>
                    </div>
                    <div class="match-info">
                        <i class="fas fa-user-tie"></i>
                        <span>Ref: ${match.refreeName || 'Assigned'}</span>
                    </div>
                    <div class="match-info">
                        <i class="fas fa-hashtag"></i>
                        <span>Match #${match.matchNo || '1'}</span>
                    </div>
                </div>
                <div class="match-actions">
                    ${type === 'assigned' && !isStarted ? 
                        `<button class="btn-start-match" onclick="startMatch('${match._id}', '${match.gender || 'boys'}')">
                            <i class="fas fa-play"></i> Start Match
                        </button>` :
                        type === 'assigned' && isStarted ?
                        `<button class="btn-go-to-matches" onclick="viewMatchSet('${match._id}', '${match.gender || 'boys'}')">
                            <i class="fas fa-table-tennis"></i> Go to Matches
                        </button>` :
                        type === 'completed' ?
                        `<button class="btn-view-details" onclick="goToMatchDetail('${match._id}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>` :
                        ''}
                </div>
            </div>
        `;
    }).join('');
}

// Check if match is actually completed by examining submatch completion
function isMatchActuallyCompleted(match) {
    if (match.matchStatus === 'complete' || match.matchComplete === true || match.isCompleted === true) {
        return true;
    }
    
    // Check if enough submatches are completed to determine a winner
    const gender = match.gender || 'boys';
    const neededWins = gender === 'girls' ? 2 : 3; // Girls need 2/3, Boys need 3/5
    
    let team1Wins = 0;
    let team2Wins = 0;
    
    // Check all possible submatch keys based on gender
    const submatchKeys = gender === 'girls' 
        ? ['match1Singles', 'match2Doubles', 'match3Singles']
        : ['match1Singles', 'match2Singles', 'match3Doubles', 'match4Singles', 'match5Doubles'];
    
    submatchKeys.forEach(key => {
        const submatch = match[key];
        if (submatch && submatch.isCompleted && submatch.winnerTeam) {
            if (submatch.winnerTeam === 'team1') team1Wins++;
            if (submatch.winnerTeam === 'team2') team2Wins++;
        }
    });
    
    return team1Wins >= neededWins || team2Wins >= neededWins;
}

// Get match status class for styling
function getMatchStatusClass(match) {
    // Check if match is actually completed
    if (isMatchActuallyCompleted(match)) {
        return 'status-complete';
    } else if (match.matchStatus === 'live' || match.setInProgress || match.matchStarted) {
        return 'status-live';
    } else {
        return 'status-upcoming';
    }
}

// Get match status text
function getMatchStatusText(match) {
    // Check if match is actually completed first
    if (isMatchActuallyCompleted(match)) {
        return 'Completed';
    } else if (match.setInProgress) {
        return 'In Progress';
    } else if (match.matchStarted) {
        return 'Started';
    } else {
        return 'Upcoming';
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Date TBD';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short', 
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

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

// Search matches
function searchMatches(type, query) {
    if (!query || query.trim() === '') {
        if (type === 'assigned') {
            loadAssignedMatches();
        } else {
            loadCompletedMatches();
        }
        return;
    }
    
    const gridId = type === 'assigned' ? 'assignedMatchesGrid' : 'completedMatchesGrid';
    const loadingId = type === 'assigned' ? 'assignedMatchesLoading' : 'completedMatchesLoading';
    const noMatchesId = type === 'assigned' ? 'noAssignedMatches' : 'noCompletedMatches';
    
    const grid = document.getElementById(gridId);
    const loading = document.getElementById(loadingId);
    const noMatches = document.getElementById(noMatchesId);
    
    grid.innerHTML = '';
    loading.style.display = 'flex';
    noMatches.style.display = 'none';
    
    fetch(`${API_BASE_URL}/api/referee/matches/search?type=${type}&query=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Search failed');
            }
            return response.json();
        })
        .then(data => {
            loading.style.display = 'none';
            
            if (!data.matches || data.matches.length === 0) {
                noMatches.style.display = 'block';
                noMatches.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>No Matches Found</h3>
                    <p>No matches found for "${query}"</p>
                `;
                return;
            }
            
            renderMatchCards(grid, data.matches, type);
        })
        .catch(error => {
            console.error('Search error:', error);
            loading.style.display = 'none';
            noMatches.style.display = 'block';
        });
}

// ===========================
// MATCH ACTIONS
// ===========================

// Show start match confirmation
function startMatch(matchId, matchGender) {
    // Find the match from the DOM to get the team names
    const matchCard = document.querySelector(`.match-card[data-id="${matchId}"]`);
    if (!matchCard) return;
    
    const teamsElement = matchCard.querySelector('.match-teams');
    if (!teamsElement) return;
    
    const teams = teamsElement.textContent.trim();
    const matchTeamsElement = document.getElementById('matchTeams');
    if (matchTeamsElement) {
        matchTeamsElement.textContent = teams.replace(/\s+/g, ' ').replace('VS', 'vs');
    }
    
    currentMatch = { id: matchId, gender: matchGender };
    
    // Show the confirmation modal
    const modal = document.getElementById('startMatchModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Confirm starting the match
function confirmStartMatch() {
    if (!currentMatch) return;
    
    // Hide the modal
    const modal = document.getElementById('startMatchModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Mark the match as started in the backend
    markMatchAsStarted(currentMatch.id, currentMatch.gender);
}

// Mark match as started in backend
function markMatchAsStarted(matchId, matchGender) {
    fetch(`${API_BASE_URL}/api/referee/matches/start-match`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            matchId: matchId,
            gender: matchGender
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to start match');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Navigate to the match set view
            viewMatchSet(currentMatch.id, currentMatch.gender);
        } else {
            console.error('Failed to start match:', data.message);
            alert('Failed to start match. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error starting match:', error);
        alert('Failed to start match. Please try again.');
    });
}

// Load and display the match set view
function viewMatchSet(matchId, matchGender) {
    // Store current match info for refresh capability
    currentMatchId = matchId;
    currentMatchGender = matchGender;
    console.log('Viewing match set:', { matchId, matchGender });
    
    // Hide other sections, show match set section
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    const matchSetSection = document.getElementById('matchSetSection');
    matchSetSection.style.display = 'block';
    
    // Show loading state
    matchSetSection.innerHTML = `
        <div class="section-header">
            <div class="section-title">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading Match Details...</span>
            </div>
            <div class="section-actions">
                <button class="btn btn-primary" id="backToMatches">
                    <i class="fas fa-arrow-left"></i> Back to Matches
                </button>
            </div>
        </div>
        <div class="loading-state">
            <i class="fas fa-circle-notch fa-spin"></i>
            <p>Loading match details...</p>
        </div>
    `;
    
    // Re-attach back button event listener
    document.getElementById('backToMatches').addEventListener('click', () => {
        document.getElementById('matchSetSection').style.display = 'none';
        document.getElementById('assignedMatchesSection').style.display = 'block';
        currentMatch = null;
        currentMatchId = null;
        currentMatchGender = null;
    });
    
    // Fetch match details
    fetch(`${API_BASE_URL}/api/referee/matches/${matchId}?gender=${matchGender}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch match details');
            }
            return response.json();
        })
        .then(data => {
            // Store current match data
            currentMatch = data.match;
            
            // Render match set view
            renderMatchSetView(data.match);
        })
        .catch(error => {
            console.error('Error loading match details:', error);
            matchSetSection.innerHTML = `
                <div class="section-header">
                    <div class="section-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Error</span>
                    </div>
                    <div class="section-actions">
                        <button class="btn btn-primary" id="backToMatches">
                            <i class="fas fa-arrow-left"></i> Back to Matches
                        </button>
                    </div>
                </div>
                <div class="no-matches-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Match</h3>
                    <p>There was a problem loading the match details. Please try again.</p>
                </div>
            `;
            
            // Re-attach back button event listener
            document.getElementById('backToMatches').addEventListener('click', () => {
                document.getElementById('matchSetSection').style.display = 'none';
                document.getElementById('assignedMatchesSection').style.display = 'block';
                currentMatch = null;
            });
        });
}

// Render the match set view with submatch cards
function renderMatchSetView(match) {
    // First, restore the original match set section structure if it was replaced due to an error
    const matchSetSection = document.getElementById('matchSetSection');
    if (!document.getElementById('matchSetTitle')) {
        matchSetSection.innerHTML = `
            <div class="section-header">
                <div class="section-title">
                    <i class="fas fa-table-tennis"></i>
                    <span id="matchSetTitle">Match Details</span>
                </div>
                <div class="section-actions">
                    <button class="btn btn-secondary" id="refreshMatch" style="margin-right: 10px;">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button class="btn btn-primary" id="backToMatches">
                        <i class="fas fa-arrow-left"></i> Back to Matches
                    </button>
                </div>
            </div>
            
            <div class="college-score">
                <div>
                    <div class="college-name" id="college1Name">College A</div>
                    <div class="college-score-value" id="college1Score">0</div>
                </div>
                <div class="vs">VS</div>
                <div>
                    <div class="college-name" id="college2Name">College B</div>
                    <div class="college-score-value" id="college2Score">0</div>
                </div>
            </div>
            
            <div class="submatches" id="subMatchesContainer">
                <!-- Submatch cards will be loaded dynamically -->
            </div>
        `;
        
        // Re-attach back button event listener
        document.getElementById('backToMatches').addEventListener('click', () => {
            document.getElementById('matchSetSection').style.display = 'none';
            document.getElementById('assignedMatchesSection').style.display = 'block';
            currentMatch = null;
        });
    }
    
    // Update section title with null checks
    const matchSetTitle = document.getElementById('matchSetTitle');
    const college1Name = document.getElementById('college1Name');
    const college2Name = document.getElementById('college2Name');
    const college1Score = document.getElementById('college1Score');
    const college2ScoreEl = document.getElementById('college2Score');
    
    if (matchSetTitle) {
        matchSetTitle.textContent = `${match.college1Name} vs ${match.college2Name}`;
    }
    
    // Update college names and scores
    if (college1Name) {
        college1Name.textContent = match.college1Name;
    }
    if (college2Name) {
        college2Name.textContent = match.college2Name;
    }
    
    // Calculate current scores (completed matches won by each college)
    const college1ScoreValue = match.gender === 'boys' ? 
        (match.match1Singles?.winnerTeam === 'team1' ? 1 : 0) +
        (match.match2Singles?.winnerTeam === 'team1' ? 1 : 0) +
        (match.match3Doubles?.winnerTeam === 'team1' ? 1 : 0) +
        (match.match4Singles?.winnerTeam === 'team1' ? 1 : 0) +
        (match.match5Doubles?.winnerTeam === 'team1' ? 1 : 0) :
        (match.match1Singles?.winnerTeam === 'team1' ? 1 : 0) +
        (match.match2Doubles?.winnerTeam === 'team1' ? 1 : 0) +
        (match.match3Singles?.winnerTeam === 'team1' ? 1 : 0);
    
    const college2ScoreValue = match.gender === 'boys' ? 
        (match.match1Singles?.winnerTeam === 'team2' ? 1 : 0) +
        (match.match2Singles?.winnerTeam === 'team2' ? 1 : 0) +
        (match.match3Doubles?.winnerTeam === 'team2' ? 1 : 0) +
        (match.match4Singles?.winnerTeam === 'team2' ? 1 : 0) +
        (match.match5Doubles?.winnerTeam === 'team2' ? 1 : 0) :
        (match.match1Singles?.winnerTeam === 'team2' ? 1 : 0) +
        (match.match2Doubles?.winnerTeam === 'team2' ? 1 : 0) +
        (match.match3Singles?.winnerTeam === 'team2' ? 1 : 0);
    
    if (college1Score) {
        college1Score.textContent = college1ScoreValue;
    }
    if (college2ScoreEl) {
        college2ScoreEl.textContent = college2ScoreValue;
    }
    
    // Render submatch cards
    const container = document.getElementById('subMatchesContainer');
    if (!container) {
        console.error('subMatchesContainer not found');
        return;
    }
    container.innerHTML = '';
    
    // For boys: 5 matches (3 singles, 2 doubles)
    if (match.gender === 'boys' || !match.gender) {
        // Singles 1
        container.appendChild(createSubmatchCard(
            match, 
            'match1Singles', 
            'Singles 1', 
            match.match1Singles?.player1Name || 'Player 1', 
            match.match1Singles?.player2Name || 'Player 2',
            match.college1Name,
            match.college2Name
        ));
        
        // Singles 2
        container.appendChild(createSubmatchCard(
            match, 
            'match2Singles', 
            'Singles 2', 
            match.match2Singles?.player1Name || 'Player 1', 
            match.match2Singles?.player2Name || 'Player 2',
            match.college1Name,
            match.college2Name
        ));
        
        // Doubles 1
        container.appendChild(createSubmatchCard(
            match, 
            'match3Doubles', 
            'Doubles 1', 
            `${match.match3Doubles?.team1Player1Name || 'Player 1'} / ${match.match3Doubles?.team1Player2Name || 'Player 2'}`,
            `${match.match3Doubles?.team2Player1Name || 'Player 1'} / ${match.match3Doubles?.team2Player2Name || 'Player 2'}`,
            match.college1Name,
            match.college2Name,
            true
        ));
        
        // Singles 3
        container.appendChild(createSubmatchCard(
            match, 
            'match4Singles', 
            'Singles 3', 
            match.match4Singles?.player1Name || 'Player 1', 
            match.match4Singles?.player2Name || 'Player 2',
            match.college1Name,
            match.college2Name
        ));
        
        // Doubles 2
        container.appendChild(createSubmatchCard(
            match, 
            'match5Doubles', 
            'Doubles 2', 
            `${match.match5Doubles?.team1Player1Name || 'Player 1'} / ${match.match5Doubles?.team1Player2Name || 'Player 2'}`,
            `${match.match5Doubles?.team2Player1Name || 'Player 1'} / ${match.match5Doubles?.team2Player2Name || 'Player 2'}`,
            match.college1Name,
            match.college2Name,
            true
        ));
    } 
    // For girls: 3 matches (2 singles, 1 doubles)
    else if (match.gender === 'girls') {
        // Singles 1
        container.appendChild(createSubmatchCard(
            match, 
            'match1Singles', 
            'Singles 1', 
            match.match1Singles?.player1Name || 'Player 1', 
            match.match1Singles?.player2Name || 'Player 2',
            match.college1Name,
            match.college2Name
        ));
        
        // Doubles
        container.appendChild(createSubmatchCard(
            match, 
            'match2Doubles', 
            'Doubles', 
            `${match.match2Doubles?.team1Player1Name || 'Player 1'} / ${match.match2Doubles?.team1Player2Name || 'Player 2'}`,
            `${match.match2Doubles?.team2Player1Name || 'Player 1'} / ${match.match2Doubles?.team2Player2Name || 'Player 2'}`,
            match.college1Name,
            match.college2Name,
            true
        ));
        
        // Singles 2
        container.appendChild(createSubmatchCard(
            match, 
            'match3Singles', 
            'Singles 2', 
            match.match3Singles?.player1Name || 'Player 1', 
            match.match3Singles?.player2Name || 'Player 2',
            match.college1Name,
            match.college2Name
        ));
    }
    
    // Use frontend function to check if match is complete
    const completionStatus = checkMatchCompletion(match);
    console.log('Frontend completion check result:', completionStatus);
    
    if (completionStatus.isComplete) {
        console.log('🏆 Match winner detected! Showing popup...', { 
            winner: completionStatus.winner,
            scores: `${completionStatus.team1Wins}-${completionStatus.team2Wins}`,
            matchStatus: match.matchStatus
        });
        container.appendChild(createMatchWinnerCard(completionStatus.winner));
        
        // Check if modal hasn't been shown already for this session to prevent duplicate popups
        const modalKey = `winner_modal_${match._id}_${completionStatus.team1Wins}_${completionStatus.team2Wins}`;
        const modalAlreadyShown = sessionStorage.getItem(modalKey);
        

        
        if (!modalAlreadyShown) {
            console.log('College winner detected and modal not shown yet, showing winner modal...');
            // Mark modal as shown
            sessionStorage.setItem(modalKey, 'true');
            
            // Use setTimeout to ensure DOM is ready and avoid conflicts with page refresh
            setTimeout(() => {
                showAutomaticMatchWinnerModal(match, completionStatus.team1Wins, completionStatus.team2Wins);
            }, 100);
        } else {
            console.log('Modal already shown for this winner scenario, skipping to prevent duplicates', {
                modalKey: modalKey,
                alreadyShown: !!modalAlreadyShown
            });
            
            // TEMPORARY FIX: Show modal even if match is complete but not if already shown this session
            if (!modalAlreadyShown) {
                console.log('TEMP: Forcing modal show even for completed match...');
                sessionStorage.setItem(modalKey, 'true');
                setTimeout(() => {
                    showAutomaticMatchWinnerModal(match, college1ScoreValue, college2ScoreValue);
                }, 100);
            }
        }
    }
}

// Create a submatch card
function createSubmatchCard(match, submatchKey, title, player1, player2, college1, college2, isDoubles = false) {
    const submatch = match[submatchKey];
    const submatchCard = document.createElement('div');
    submatchCard.className = 'submatch-card';
    submatchCard.dataset.key = submatchKey;
    
    // Determine status class and text
    let statusClass, statusText;
    if (submatch?.isCompleted) {
        statusClass = 'status-complete';
        statusText = 'Completed';
    } else if (submatch?.isStarted) {
        statusClass = 'status-live';
        statusText = 'In Progress';
    } else {
        statusClass = 'status-upcoming';
        statusText = 'Not Started';
    }
    
    // Winner name display (if completed)
    let winnerDisplay = '';
    if (submatch?.isCompleted) {
        // Prefer winnerEmail if available, else show winnerTeam label
        const winnerTeam = submatch.winnerTeam === 'team1' ? college1 : submatch.winnerTeam === 'team2' ? college2 : null;
        winnerDisplay = `<div class="submatch-winner">Winner: <strong>${winnerTeam || (submatch.winnerEmail || 'N/A')}</strong></div>`;
    }

    // Match configuration display
    let matchConfigDisplay = '';
    if (submatch?.matchSettings) {
        matchConfigDisplay = `
            <div class="submatch-config">
                <small>
                    <i class="fas fa-cog"></i> 
                    ${submatch.matchSettings.maxPoints || 21} pts | 
                    Best of ${submatch.matchSettings.numberOfSets || 3} | 
                    Court ${submatch.matchSettings.courtNumber || 'TBD'}
                </small>
            </div>
        `;
    }

    // Set scores display (if available)
    let setScoresDisplay = '';
    const dataKey = getSubmatchDataKey(submatchKey);
    const scoreData = match.scorecardData?.[dataKey];
    if (scoreData && Array.isArray(scoreData.scores) && scoreData.scores.length > 0) {
        const completedSets = scoreData.scores.filter(s => s.isComplete);
        if (completedSets.length > 0) {
            setScoresDisplay = `
                <div class="submatch-sets">
                    <small><i class="fas fa-list"></i> Sets: 
                        ${completedSets.map(s => `${s.player1Score}-${s.player2Score}`).join(', ')}
                    </small>
                </div>
            `;
        }
    }

    // Create card content
    submatchCard.innerHTML = `
        <div class="submatch-header">
            <div class="submatch-title">${title}</div>
            <span class="submatch-status ${statusClass}">${statusText}</span>
        </div>
        <div class="submatch-players">
            <div class="player-info">
                <strong>${player1}</strong>
                <small>${college1}</small>
            </div>
            <div class="vs-divider">vs</div>
            <div class="player-info">
                <strong>${player2}</strong>
                <small>${college2}</small>
            </div>
        </div>
        ${matchConfigDisplay}
        ${setScoresDisplay}
        ${winnerDisplay}
        <div class="match-actions">
            ${submatch?.isCompleted ? 
                `<button class="btn-scorecard btn-completed" data-match-id="${match._id}" data-subkey="${submatchKey}" data-gender="${match.gender}">
                    <i class="fas fa-info-circle"></i> View Summary
                </button>` : 
                submatch?.isStarted ? 
                `<button class="btn-scorecard" onclick="goToScorecard('${match._id}', '${submatchKey}', '${match.gender}')">
                    <i class="fas fa-clipboard-list"></i> Go to Scorecard
                </button>` : 
                `<button class="btn-start-match" onclick="startSubmatch('${match._id}', '${submatchKey}', '${college1}', '${college2}', '${match.gender}')">
                    <i class="fas fa-play"></i> Start
                </button>`
            }
        </div>
    `;

    // If completed, add click handler to open summary modal
    if (submatch?.isCompleted) {
        const btn = submatchCard.querySelector('.btn-completed');
        if (btn) {
            btn.addEventListener('click', async (e) => {
                const matchId = btn.dataset.matchId;
                const subkey = btn.dataset.subkey;
                const gender = btn.dataset.gender || 'boys';
                openCompletedModal(matchId, subkey, gender);
            });
        }
    }
    
    return submatchCard;
}

// Create a card showing the match winner
function createMatchWinnerCard(winnerName) {
    const winnerCard = document.createElement('div');
    winnerCard.className = 'submatch-card';
    winnerCard.style.gridColumn = '1 / -1';
    winnerCard.style.textAlign = 'center';
    winnerCard.style.background = 'linear-gradient(135deg, #fdfbec 0%, #fff9db 100%)';
    winnerCard.style.border = '2px solid #FFD700';
    
    winnerCard.innerHTML = `
        <div class="submatch-title" style="color: #B8860B; border-bottom: none;">Match Winner</div>
        <div style="font-size: 1.5rem; font-weight: 700; margin: 15px 0; color: #B8860B;">
            <i class="fas fa-trophy" style="margin-right: 10px; color: #FFD700;"></i>
            ${winnerName}
        </div>
        <div style="font-size: 0.9rem; color: #6c757d;">This match has been completed.</div>
    `;
    
    return winnerCard;
}

// Show the start submatch modal
function startSubmatch(matchId, submatchKey, college1, college2, gender) {
    currentSubmatch = { matchId, submatchKey, college1, college2, gender };
    
    // Update the server select options with college names
    const serverSelect = document.getElementById('initialServer');
    serverSelect.innerHTML = `
        <option value="team1">${college1}</option>
        <option value="team2">${college2}</option>
    `;
    
    // Show the modal
    document.getElementById('startSubmatchModal').style.display = 'block';
}

// Confirm starting a submatch
function confirmSubmatch() {
    if (!currentSubmatch) return;
    
    const maxPoints = document.getElementById('maxPoints').value;
    const numberOfSets = document.getElementById('numberOfSets').value;
    const courtNumber = document.getElementById('courtNumber').value;
    const initialServer = document.getElementById('initialServer').value;
    
    // Show loading state in the modal
    document.getElementById('confirmSubmatch').disabled = true;
    document.getElementById('confirmSubmatch').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';
    
    // Call the API to start the submatch
    fetch(`${API_BASE_URL}/api/referee/matches/start-submatch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            matchId: currentSubmatch.matchId,
            submatchKey: currentSubmatch.submatchKey,
            maxPoints: parseInt(maxPoints),
            numberOfSets: parseInt(numberOfSets),
            courtNumber: courtNumber,
            initialServer: initialServer,
            gender: currentSubmatch.gender
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to start submatch');
        }
        return response.json();
    })
    .then(data => {
        // Hide the modal
        document.getElementById('startSubmatchModal').style.display = 'none';
        
        // Redirect to the scorecard page
        goToScorecard(currentSubmatch.matchId, currentSubmatch.submatchKey, currentSubmatch.gender);
    })
    .catch(error => {
        console.error('Error starting submatch:', error);
        alert('Failed to start submatch. Please try again.');
        
        // Reset button state
        document.getElementById('confirmSubmatch').disabled = false;
        document.getElementById('confirmSubmatch').innerHTML = 'Start';
    });
}

// Navigate to the scorecard page
function goToScorecard(matchId, submatchKey, gender) {
    window.location.href = `/scorecard?matchId=${matchId}&submatchKey=${submatchKey}&matchType=${gender}`;
}

// Navigate to match detail page
function goToMatchDetail(matchId) {
    // Store current section info in sessionStorage so we can return correctly
    sessionStorage.setItem('refereeReturnSection', 'completedMatches');
    window.location.href = `/match/${matchId}`;
}

// Helper function to get the data key for scorecard data (matches backend logic)
function getSubmatchDataKey(submatchKey) {
    // Map submatchKey to the data key used in scorecardData
    const keyMap = {
        'match1Singles': 'match1',
        'match2Singles': 'match2',
        'match3Doubles': 'match3',
        'match4Singles': 'match4',
        'match5Doubles': 'match5',
        'match2Doubles': 'match2', // For girls matches
        'match3Singles': 'match3'  // For girls matches
    };
    
    return keyMap[submatchKey] || submatchKey;
}

// Frontend function to check if match is complete based on college wins
function checkMatchCompletion(match) {
    const matchesNeededToWin = match.gender === 'girls' ? 2 : 3;
    
    // Calculate wins for each team
    let team1Wins = 0;
    let team2Wins = 0;
    
    // Check all submatches based on gender
    const submatchKeys = match.gender === 'girls' 
        ? ['match1Singles', 'match2Doubles', 'match3Singles'] 
        : ['match1Singles', 'match2Singles', 'match3Doubles', 'match4Singles', 'match5Doubles'];
    
    submatchKeys.forEach(key => {
        const submatch = match[key];
        if (submatch && submatch.isCompleted && submatch.winnerTeam) {
            if (submatch.winnerTeam === 'team1') {
                team1Wins++;
            } else if (submatch.winnerTeam === 'team2') {
                team2Wins++;
            }
        }
    });
    
    console.log('Frontend match completion check:', {
        gender: match.gender,
        matchesNeededToWin,
        team1Wins,
        team2Wins,
        college1Name: match.college1Name,
        college2Name: match.college2Name
    });
    
    return {
        isComplete: team1Wins >= matchesNeededToWin || team2Wins >= matchesNeededToWin,
        team1Wins,
        team2Wins,
        winner: team1Wins >= matchesNeededToWin ? match.college1Name : 
                team2Wins >= matchesNeededToWin ? match.college2Name : null
    };
}

// Show automatic match winner modal when a college wins majority of submatches
function showAutomaticMatchWinnerModal(match, college1Score, college2Score) {
    console.log('showAutomaticMatchWinnerModal called with:', { match, college1Score, college2Score });
    
    // Double-check modal elements exist
    const modal = document.getElementById('matchWinnerModal');
    const winnerSummaryEl = document.getElementById('winnerSummary');
    const endBtn = document.getElementById('finalEndMatchBtn');
    
    if (!modal || !winnerSummaryEl || !endBtn) {
        console.error('Modal elements not found:', { modal: !!modal, winnerSummary: !!winnerSummaryEl, endBtn: !!endBtn });
        return;
    }
    
    const winnerName = college1Score > college2Score ? match.college1Name : match.college2Name;
    const winnerScore = Math.max(college1Score, college2Score);
    const loserScore = Math.min(college1Score, college2Score);
    
    console.log('Winner details:', { winnerName, winnerScore, loserScore });
    
    // Build comprehensive summary with detailed set scores
    let summaryHTML = `
        <div class="winner-announcement">
            <h2 style="color: #28a745; text-align: center; margin-bottom: 20px;">
                <i class="fas fa-trophy" style="color: #FFD700;"></i> 
                ${winnerName} Wins!
            </h2>
        </div>
        
        <div class="match-header" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h3 style="margin: 0; color: #333;">${match.college1Name} vs ${match.college2Name}</h3>
            <div style="font-size: 2em; font-weight: bold; margin: 10px 0; color: #28a745;">
                ${college1Score} - ${college2Score}
            </div>
            <p style="margin: 0; color: #666; font-size: 0.9em;">Total Matches Won</p>
        </div>
        
        <div class="detailed-results">
            <h4 style="margin-bottom: 15px; color: #333; border-bottom: 2px solid #dee2e6; padding-bottom: 8px;">
                <i class="fas fa-list-alt"></i> Detailed Match Results
            </h4>
    `;
    
    // Get all submatch keys based on gender
    const submatchKeys = match.gender === 'girls' 
        ? ['match1Singles', 'match2Doubles', 'match3Singles']
        : ['match1Singles', 'match2Singles', 'match3Doubles', 'match4Singles', 'match5Doubles'];
    
    const submatchTitles = match.gender === 'girls'
        ? ['Singles 1', 'Doubles', 'Singles 2']
        : ['Singles 1', 'Singles 2', 'Doubles 1', 'Singles 3', 'Doubles 2'];
    
    submatchKeys.forEach((key, index) => {
        const submatch = match[key];
        const title = submatchTitles[index];
        
        if (submatch && submatch.isCompleted) {
            const winner = submatch.winnerTeam === 'team1' ? match.college1Name : match.college2Name;
            const dataKey = getSubmatchDataKey(key);
            const scoreData = match.scorecardData?.[dataKey];
            
            // Get winner player name(s) with college
            let winnerPlayerInfo = '';
            if (key.includes('Singles')) {
                const winnerPlayerName = submatch.winnerTeam === 'team1' ? 
                    (submatch.player1Name || 'Player 1') : 
                    (submatch.player2Name || 'Player 2');
                winnerPlayerInfo = `${winnerPlayerName} (${winner})`;
            } else if (key.includes('Doubles')) {
                const winnerPlayer1 = submatch.winnerTeam === 'team1' ? 
                    (submatch.team1Player1Name || 'Player 1') : 
                    (submatch.team2Player1Name || 'Player 1');
                const winnerPlayer2 = submatch.winnerTeam === 'team1' ? 
                    (submatch.team1Player2Name || 'Player 2') : 
                    (submatch.team2Player2Name || 'Player 2');
                winnerPlayerInfo = `${winnerPlayer1} / ${winnerPlayer2} (${winner})`;
            }
            
            summaryHTML += `
                <div class="submatch-detailed-result" style="border: 1px solid #dee2e6; border-radius: 6px; margin-bottom: 15px; padding: 15px; background: white;">
                    <div class="submatch-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h5 style="margin: 0; color: #495057; font-weight: 600;">${title}</h5>
                        <span class="winner-badge" style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 600;">
                            Winner: ${winnerPlayerInfo}
                        </span>
                    </div>
            `;
            
            // Show set scores if available
            if (scoreData && Array.isArray(scoreData.scores) && scoreData.scores.length > 0) {
                summaryHTML += `<div class="sets-breakdown" style="margin-top: 10px;">`;
                
                scoreData.scores.forEach((setScore, setIndex) => {
                    if (setScore.isComplete) {
                        const setWinner = setScore.player1Score > setScore.player2Score ? 
                            (submatch.winnerTeam === 'team1' ? match.college1Name : match.college2Name) :
                            (submatch.winnerTeam === 'team2' ? match.college1Name : match.college2Name);
                        
                        summaryHTML += `
                            <div class="set-score" style="display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; margin: 3px 0; background: #f8f9fa; border-radius: 4px; font-size: 0.9em;">
                                <span>Set ${setScore.setNumber}:</span>
                                <span style="font-weight: 600;">${setScore.player1Score} - ${setScore.player2Score}</span>
                            </div>
                        `;
                    }
                });
                
                summaryHTML += `</div>`;
            }
            
            // Show player names if available
            if (key.includes('Singles')) {
                const player1 = submatch.player1Name || 'Player 1';
                const player2 = submatch.player2Name || 'Player 2';
                summaryHTML += `
                    <div class="players-info" style="margin-top: 8px; font-size: 0.85em; color: #666;">
                        ${player1} (${match.college1Name}) vs ${player2} (${match.college2Name})
                    </div>
                `;
            } else if (key.includes('Doubles')) {
                const team1Player1 = submatch.team1Player1Name || 'Player 1';
                const team1Player2 = submatch.team1Player2Name || 'Player 2';
                const team2Player1 = submatch.team2Player1Name || 'Player 1';
                const team2Player2 = submatch.team2Player2Name || 'Player 2';
                summaryHTML += `
                    <div class="players-info" style="margin-top: 8px; font-size: 0.85em; color: #666;">
                        ${team1Player1} / ${team1Player2} (${match.college1Name}) vs ${team2Player1} / ${team2Player2} (${match.college2Name})
                    </div>
                `;
            }
            
            summaryHTML += `</div>`;
        }
    });
    
    summaryHTML += `
        </div>
        
        <div class="tournament-info" style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border-radius: 8px; border-left: 4px solid #2196f3;">
            <h5 style="margin: 0 0 10px 0; color: #1976d2;"><i class="fas fa-trophy"></i> Tournament Progression</h5>
            <div style="font-size: 0.9em; line-height: 1.6;">
                <p style="margin: 5px 0;"><strong>🏆 Winner:</strong> ${winnerName} advances to the next round</p>
                <p style="margin: 5px 0;"><strong>❌ Eliminated:</strong> ${college1Score > college2Score ? match.college2Name : match.college1Name} is eliminated</p>
                <p style="margin: 5px 0;"><strong>🎯 Next:</strong> New match will be assigned automatically</p>
            </div>
        </div>
    `;
    
    // Set the content
    console.log('winnerSummary element found:', winnerSummaryEl);
    winnerSummaryEl.innerHTML = summaryHTML;
    console.log('Summary HTML set successfully');
    
    // Store match data for the end match action
    console.log('finalEndMatchBtn element found:', endBtn);
    
    // Set dataset attributes with fallbacks
    const matchId = match._id || currentMatchId;
    const gender = match.gender || currentMatchGender || 'boys';
    
    endBtn.dataset.matchId = matchId;
    endBtn.dataset.gender = gender;
    
    // Also set as button attributes for extra safety
    endBtn.setAttribute('data-match-id', matchId);
    endBtn.setAttribute('data-gender', gender);
    
    console.log('End button dataset set:', { 
        matchId: matchId,
        gender: gender,
        datasetMatchId: endBtn.dataset.matchId,
        datasetGender: endBtn.dataset.gender
    });
    
    // Show the modal with additional styles to ensure visibility
    console.log('matchWinnerModal element found:', modal);
    modal.style.display = 'block';
    modal.style.opacity = '1';
    modal.style.zIndex = '9999';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.5)';
    console.log('Modal display set with force styles - winner modal should now be visible!');
}



// ===========================
// UTILITY FUNCTIONS
// ===========================

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// ===========================
// AUTHENTICATION
// ===========================

// Logout function
function logout() {
    fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST'
    })
    .then(() => {
        window.location.href = '/';
    })
    .catch(error => {
        console.error('Logout error:', error);
        window.location.href = '/';
    });
}

// Open the completed submatch summary modal
async function openCompletedModal(matchId, submatchKey, gender = 'boys') {
    try {
        const res = await fetch(`${API_BASE_URL}/api/referee/matches/${matchId}?gender=${gender}`);
        if (!res.ok) throw new Error('Failed to fetch match');
        const data = await res.json();
        const match = data.match;
        const sub = match[submatchKey];

        // Build short summary
        const summaryEl = document.getElementById('completedSummary');
        const matchTitle = `${match.college1Name} vs ${match.college2Name}`;
        let content = `<p><strong>${matchTitle}</strong></p>`;
        content += `<p><strong>Submatch:</strong> ${submatchKey}</p>`;
        if (sub.matchSettings) {
            content += `<p><strong>Court:</strong> ${sub.matchSettings.courtNumber || 'N/A'}</p>`;
            content += `<p><strong>Max Points:</strong> ${sub.matchSettings.maxPoints || 'N/A'}</p>`;
        }

        // Show sets summary from scorecardData
        const dataKey = getSubmatchDataKey(submatchKey);
        const scoreData = match.scorecardData?.[dataKey];
        if (scoreData && Array.isArray(scoreData.scores) && scoreData.scores.length) {
            content += `<div class="sets-summary"><strong>Sets:</strong><ul>`;
            scoreData.scores.forEach(s => {
                content += `<li>Set ${s.setNumber}: ${s.player1Score} - ${s.player2Score} ${s.isComplete ? '(Complete)' : ''}</li>`;
            });
            content += `</ul></div>`;
        }

        // Winner with player name(s)
        let winnerLabel = '';
        if (sub.winnerTeam === 'team1' || sub.winnerTeam === 'team2') {
            const winnerCollege = sub.winnerTeam === 'team1' ? match.college1Name : match.college2Name;
            
            if (submatchKey.includes('Singles')) {
                const winnerPlayerName = sub.winnerTeam === 'team1' ? 
                    (sub.player1Name || 'Player 1') : 
                    (sub.player2Name || 'Player 2');
                winnerLabel = `${winnerPlayerName} (${winnerCollege})`;
            } else if (submatchKey.includes('Doubles')) {
                const winnerPlayer1 = sub.winnerTeam === 'team1' ? 
                    (sub.team1Player1Name || 'Player 1') : 
                    (sub.team2Player1Name || 'Player 1');
                const winnerPlayer2 = sub.winnerTeam === 'team1' ? 
                    (sub.team1Player2Name || 'Player 2') : 
                    (sub.team2Player2Name || 'Player 2');
                winnerLabel = `${winnerPlayer1} / ${winnerPlayer2} (${winnerCollege})`;
            }
        } else {
            winnerLabel = sub.winnerEmail || 'N/A';
        }
        content += `<p><strong>Winner:</strong> ${winnerLabel}</p>`;

        summaryEl.innerHTML = content;

        // Cancel button (×) is always available at the top of the modal

        // Show modal
        document.getElementById('completedSubmatchModal').style.display = 'block';
    } catch (err) {
        console.error('Failed to open completed modal:', err);
        alert('Failed to load match summary');
    }
}

// Close modal handlers
document.addEventListener('DOMContentLoaded', () => {
    const closeX = document.getElementById('closeCompletedModal');
    if (closeX) closeX.addEventListener('click', () => document.getElementById('completedSubmatchModal').style.display = 'none');

    // Close winner modal button
    const closeWinnerModal = document.getElementById('closeWinnerModal');
    if (closeWinnerModal) {
        closeWinnerModal.addEventListener('click', () => {
            document.getElementById('matchWinnerModal').style.display = 'none';
        });
    }

    // DEBUG: Test modal button (remove after fixing)
    const testModalBtn = document.getElementById('testModalBtn');
    if (testModalBtn) {
        testModalBtn.addEventListener('click', () => {
            console.log('Test modal button clicked!');
            if (window.testWinnerModal) {
                window.testWinnerModal();
            } else {
                // Fallback direct modal show
                const modal = document.getElementById('matchWinnerModal');
                const summary = document.getElementById('winnerSummary');
                if (modal && summary) {
                    summary.innerHTML = '<h2 style="color: #28a745; text-align: center;">🏆 TEST MODAL WORKING! 🏆</h2><p>This is a test to verify the modal displays correctly.</p>';
                    modal.style.display = 'block';
                    modal.style.opacity = '1';
                    modal.style.zIndex = '9999';
                }
            }
        });
    }

    // Final End Match action (for automatic winner modal)
    const finalEndBtn = document.getElementById('finalEndMatchBtn');
    if (finalEndBtn) {
        finalEndBtn.addEventListener('click', async (e) => {
            // Get matchId and gender from dataset, attributes, or global fallbacks
            let matchId = e.target.dataset.matchId || 
                         e.target.getAttribute('data-match-id') || 
                         currentMatchId;
            let gender = e.target.dataset.gender || 
                        e.target.getAttribute('data-gender') || 
                        currentMatchGender || 'boys';
            
            console.log('End Match button clicked:', { 
                datasetMatchId: e.target.dataset.matchId,
                datasetGender: e.target.dataset.gender,
                fallbackMatchId: currentMatchId,
                fallbackGender: currentMatchGender,
                finalMatchId: matchId,
                finalGender: gender
            });
            
            // Validate we have required data
            if (!matchId) {
                console.error('No matchId available!', {
                    dataset: e.target.dataset,
                    currentMatchId: currentMatchId,
                    currentMatch: currentMatch
                });
                alert('Error: Match ID not found. Please refresh the page and try again.');
                e.target.disabled = false;
                e.target.innerHTML = '<i class="fas fa-flag-checkered"></i> End Match';
                return;
            }
            
            // Show loading state
            e.target.disabled = true;
            e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ending Match...';
            
            try {
                console.log('Sending end match request:', { matchId, gender });
                
                const resp = await fetch(`${API_BASE_URL}/api/referee/matches/end-match`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ matchId, gender })
                });
                
                console.log('End match response status:', resp.status);
                
                const result = await resp.json();
                console.log('End match result:', result);
                
                if (!resp.ok || !result.success) throw new Error(result.message || 'Failed to end match');

                // Close modal
                document.getElementById('matchWinnerModal').style.display = 'none';
                
                // Clear session storage to allow modal to show again if needed
                const modalKey = `winner_modal_${matchId}_`;
                Object.keys(sessionStorage).forEach(key => {
                    if (key.startsWith(modalKey)) {
                        sessionStorage.removeItem(key);
                    }
                });
                
                // Show success message with next match info
                let successMessage = '🏆 Match completed successfully!\n• Tournament brackets updated\n• Winner advanced to next round\n• Loser eliminated from tournament';
                
                if (result.nextMatchAssigned && result.nextMatchInfo) {
                    successMessage += `\n\n🎯 Next Match Assigned:\n${result.nextMatchInfo.college1} vs ${result.nextMatchInfo.college2}\nRound: ${result.nextMatchInfo.round} (${result.nextMatchInfo.gender})`;
                } else {
                    successMessage += '\n\n✅ No more matches to assign at this time.';
                }
                
                alert(successMessage);
                
                // Refresh to show next assigned match
                setTimeout(() => {
                    // Clear current match info
                    currentMatchId = null;
                    currentMatchGender = null;
                    
                    // Reload the page to ensure clean state
                    window.location.reload();
                }, 1000);
                
            } catch (err) {
                console.error('Failed to end match:', err);
                alert('Failed to end match: ' + err.message);
                
                // Reset button state
                e.target.disabled = false;
                e.target.innerHTML = 'End Match';
            }
        });
    }
});