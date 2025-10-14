// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set up back button based on referrer
    setupBackButton();
    
    loadMatchDetail();
});

// Handle back navigation based on where user came from
function handleBackNavigation() {
    const refereeReturnSection = sessionStorage.getItem('refereeReturnSection');
    
    if (refereeReturnSection === 'completedMatches') {
        // Clear the session storage
        sessionStorage.removeItem('refereeReturnSection');
        // Navigate back to referee dashboard completed section
        window.location.href = '/referee?section=completedMatches';
    } else {
        // Default navigation to matches page
        window.location.href = '/matches';
    }
}

// Setup back button text based on referrer
function setupBackButton() {
    const refereeReturnSection = sessionStorage.getItem('refereeReturnSection');
    const backButtonText = document.getElementById('backButtonText');
    
    if (refereeReturnSection === 'completedMatches' && backButtonText) {
        backButtonText.textContent = 'Back to Referee Dashboard';
    }
}

// Load match details
async function loadMatchDetail() {
    const loading = document.getElementById('loading');
    
    try {
        console.log('Starting to load match detail...');
        
        // Use API to get real match data
        console.log('Fetching from API for matchId:', matchId);
        
        const response = await fetch(`/api/matches/${matchId}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`${errorData.message || 'Failed to load match'}`);
        }
        
        const rawMatchData = await response.json();
        console.log('API response:', rawMatchData);
        
        // Transform the match data to our internal format
        const matchData = transformMatchData(rawMatchData);
        
        // Populate match header
        populateMatchHeader(matchData);
        
        // Add match context info
        addMatchContextInfo(matchData);
        
        // Populate overall score
        populateOverallScore(matchData);
        
        // Populate referee info
        populateRefereeInfo(matchData);
        
        // Populate submatches
        populateSubmatches(matchData);
        
        console.log('Match details loaded successfully!');
        
    } catch (error) {
        console.error('Error loading match details:', error);
        
        // Show error message to user
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h2>🏸 Unable to Load Match</h2>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>Match ID:</strong> ${matchId}</p>
                    <div class="error-actions">
                        <button onclick="window.location.reload()" class="retry-btn">
                            🔄 Try Again
                        </button>
                        <button onclick="window.location.href='/matches'" class="back-btn">
                            ← Back to Matches
                        </button>
                    </div>
                </div>
            `;
        }
    } finally {
        // Hide loading spinner
        if (loading) {
            loading.classList.remove('active');
        }
    }
}

// Transform match data from schema to internal format
function transformMatchData(rawData) {
    console.log('Transforming match data:', rawData);
    
    // All matches now use the 5-match structure (best of 5)
    let structure = [
        { type: 'Singles', number: 1, key: 'match1Singles' },
        { type: 'Singles', number: 2, key: 'match2Singles' },
        { type: 'Doubles', number: 1, key: 'match3Doubles' },
        { type: 'Singles', number: 3, key: 'match4Singles' },
        { type: 'Doubles', number: 2, key: 'match5Doubles' }
    ];
    
    // Transform submatches
    const submatches = structure.map(struct => {
        const matchData = rawData[struct.key];
        if (!matchData) {
            return {
                type: struct.type,
                number: struct.number,
                isCompleted: false,
                winnerTeam: null,
                team1Player1: '-',
                team1Player2: struct.type === 'Doubles' ? '-' : null,
                team2Player1: '-',
                team2Player2: struct.type === 'Doubles' ? '-' : null,
                sets: []
            };
        }
        
        // Get scorecard data for this match
        const scorecardKey = struct.key.replace('match', 'match').replace('Singles', '').replace('Doubles', '');
        const scorecardData = rawData.scorecardData?.[scorecardKey] || {};
        
        const submatch = {
            type: struct.type,
            number: struct.number,
            isCompleted: matchData.isCompleted || false,
            winnerTeam: matchData.winnerTeam || null,
            team1Player1: struct.type === 'Doubles' ? matchData.team1Player1Name : matchData.player1Name,
            team1Player2: struct.type === 'Doubles' ? matchData.team1Player2Name : null,
            team2Player1: struct.type === 'Doubles' ? matchData.team2Player1Name : matchData.player2Name,
            team2Player2: struct.type === 'Doubles' ? matchData.team2Player2Name : null,
            sets: scorecardData.scores || []
        };
        
        return submatch;
    });
    
    // Calculate college scores
    let college1Score = 0;
    let college2Score = 0;
    
    submatches.forEach(submatch => {
        if (submatch.isCompleted && submatch.winnerTeam) {
            if (submatch.winnerTeam === 'team1') {
                college1Score++;
            } else if (submatch.winnerTeam === 'team2') {
                college2Score++;
            }
        }
    });
    
    return {
        _id: rawData._id,
        college1Name: rawData.college1Name,
        college2Name: rawData.college2Name,
        date: rawData.date,
        time: rawData.time,
        matchStatus: rawData.matchStatus,
        round: rawData.round,
        court: rawData.court,
        refreeName: rawData.refreeName,
        refreeEmail: rawData.refreeEmail,
        college1Score: college1Score,
        college2Score: college2Score,
        overallWinner: rawData.overallWinner,
        completedMatches: rawData.completedMatches || 0,
        submatches: submatches,
        structure: structure
    };
}

// Populate match header
function populateMatchHeader(matchData) {
    document.getElementById('college1Name').textContent = matchData.college1Name || '-';
    document.getElementById('college2Name').textContent = matchData.college2Name || '-';
    document.getElementById('matchDate').textContent = formatDate(matchData.date) || '-';
    document.getElementById('matchTime').textContent = matchData.time || '-';
    
    const statusElement = document.getElementById('matchStatus');
    const status = matchData.matchStatus || 'upcoming';
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    statusElement.innerHTML = `
        <span class="status-dot"></span>
        <span class="status-text">${statusText}</span>
    `;
    statusElement.className = `match-status ${status}`;
    
    // Set round and court info
    document.getElementById('matchRound').textContent = formatRoundName(matchData.round) || '-';
    document.getElementById('matchCourt').textContent = matchData.court || '-';
}

// Format round name for display
function formatRoundName(round) {
    if (!round) return 'N/A';
    
    const roundMap = {
        'round_1': 'Round 1',
        'round_2': 'Round 2', 
        'quater': 'Quarter Final',
        'semi': 'Semi Final',
        'final': 'Final'
    };
    
    return roundMap[round] || round;
}

// Add comprehensive match context information
function addMatchContextInfo(matchData) {
    const tournamentInfo = document.querySelector('.tournament-info');
    if (!tournamentInfo) return;
    
    const contextHtml = `
        <div class="tournament-context">
            <div class="context-header">
                <h3>🏆 Tournament Information</h3>
            </div>
            <div class="context-grid">
                <div class="context-item">
                    <span class="context-label">Round:</span>
                    <span class="context-value">${formatRoundName(matchData.round)}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Court:</span>
                    <span class="context-value">${matchData.court || 'TBD'}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Status:</span>
                    <span class="context-value status-${matchData.matchStatus}">${matchData.matchStatus?.toUpperCase()}</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Match Type:</span>
                    <span class="context-value">Tournament (5 Matches)</span>
                </div>
                <div class="context-item">
                    <span class="context-label">Completed:</span>
                    <span class="context-value">${matchData.completedMatches || 0}/${matchData.structure.length}</span>
                </div>
                ${matchData.overallWinner ? `
                <div class="context-item winner-info">
                    <span class="context-label">Winner:</span>
                    <span class="context-value winner-text">🏆 ${matchData.overallWinner === 'team1' ? matchData.college1Name : matchData.college2Name}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    tournamentInfo.innerHTML = contextHtml;
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return 'TBD';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

// Populate overall score
function populateOverallScore(matchData) {
    const container = document.getElementById('overallScoreContainer');
    if (!container) return;
    
    const college1Score = matchData.college1Score || 0;
    const college2Score = matchData.college2Score || 0;
    
    container.innerHTML = `
        <h2 class="section-title">Match Score</h2>
        <div class="score-display-wrapper">
            <div class="team-score-card ${college1Score > college2Score ? 'leading' : ''}">
                <div class="team-section ${college1Score > college2Score ? 'winner' : ''}">
                    <div class="college-name">${matchData.college1Name}</div>
                    <div class="team-score">${college1Score}</div>
                </div>
            </div>
            <div class="score-vs">VS</div>
            <div class="team-score-card ${college2Score > college1Score ? 'leading' : ''}">
                <div class="team-section ${college2Score > college1Score ? 'winner' : ''}">
                    <div class="college-name">${matchData.college2Name}</div>
                    <div class="team-score">${college2Score}</div>
                </div>
            </div>
        </div>
    `;
}

// Populate referee info
function populateRefereeInfo(matchData) {
    const refereeInfo = document.getElementById('refereeInfo');
    if (!refereeInfo) return;
    
    refereeInfo.innerHTML = `
        <div class="info-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        </div>
        <div class="info-content">
            <div class="info-label">Referee</div>
            <div class="info-value">${matchData.refreeName || 'TBD'}</div>
        </div>
    `;
}

// Populate submatches
function populateSubmatches(matchData) {
    const container = document.getElementById('matchesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!matchData.submatches || matchData.submatches.length === 0) {
        container.innerHTML = '<div class="no-matches">No submatches available</div>';
        return;
    }
    
    matchData.submatches.forEach((submatch, index) => {
        const structure = matchData.structure[index];
        const card = createSubmatchCard(submatch, structure, matchData);
        container.appendChild(card);
    });
}

// Create submatch card
function createSubmatchCard(submatch, structure, matchData) {
    const card = document.createElement('div');
    card.className = 'match-item';
    
    const isDoubles = structure.type === 'Doubles';
    const isCompleted = submatch.isCompleted || false;
    const winnerTeam = submatch.winnerTeam;
    
    // Get player information
    let team1Players = '';
    let team2Players = '';
    
    if (isDoubles) {
        // For doubles matches
        const t1p1 = submatch.team1Player1 || '-';
        const t1p2 = submatch.team1Player2 || '-';
        const t2p1 = submatch.team2Player1 || '-';
        const t2p2 = submatch.team2Player2 || '-';
        team1Players = `${t1p1} & ${t1p2}`;
        team2Players = `${t2p1} & ${t2p2}`;
    } else {
        // For singles matches
        team1Players = submatch.team1Player1 || '-';
        team2Players = submatch.team2Player1 || '-';
    }
    
    // Get sets information
    let setsDisplay = '';
    if (submatch.sets && submatch.sets.length > 0) {
        const setsInfo = submatch.sets.map(set => {
            const t1Score = set.player1Score || 0;
            const t2Score = set.player2Score || 0;
            return `${t1Score}-${t2Score}`;
        }).join(', ');
        setsDisplay = `<div class="match-sets">Sets: ${setsInfo}</div>`;
    }
    
    // Determine status and winner display
    let statusText = 'Not Started';
    let winnerDisplay = '';
    
    if (isCompleted) {
        statusText = 'Completed';
        if (winnerTeam === 'team1') {
            winnerDisplay = `<div class="match-winner">🏆 Winner: ${matchData.college1Name}</div>`;
        } else if (winnerTeam === 'team2') {
            winnerDisplay = `<div class="match-winner">🏆 Winner: ${matchData.college2Name}</div>`;
        }
    } else if (submatch.sets && submatch.sets.length > 0) {
        statusText = 'In Progress';
    }
    
    // Add winner highlight class
    let winnerClass = '';
    if (isCompleted && winnerTeam) {
        winnerClass = winnerTeam === 'team1' ? 'team1-winner' : 'team2-winner';
    }
    
    card.innerHTML = `
        <div class="match-item-header">
            <span class="match-type">
                ${structure.type === 'Singles' ? '👤' : '👥'} ${structure.type} ${structure.number}
            </span>
            <span class="match-item-status ${isCompleted ? 'completed' : (submatch.sets && submatch.sets.length > 0 ? 'in-progress' : 'not-started')}">${statusText}</span>
        </div>
        <div class="match-players ${winnerClass}">
            <div class="player-team">
                <span class="team-name">${matchData.college1Name}</span>
                <span class="player-name">${team1Players}</span>
                ${winnerTeam === 'team1' ? '<span class="winner-badge">🏆</span>' : ''}
            </div>
            <span class="vs-text">VS</span>
            <div class="player-team">
                <span class="team-name">${matchData.college2Name}</span>
                <span class="player-name">${team2Players}</span>
                ${winnerTeam === 'team2' ? '<span class="winner-badge">🏆</span>' : ''}
            </div>
        </div>
        ${setsDisplay}
        ${winnerDisplay}
    `;
    
    // Add click event for detailed view
    card.addEventListener('click', () => {
        showSubmatchDetails(submatch, structure, matchData);
    });
    
    return card;
}

// Show detailed submatch information
function showSubmatchDetails(submatch, structure, matchData) {
    // Determine winner information
    const isCompleted = submatch.isCompleted || false;
    const winnerTeam = submatch.winnerTeam;
    let winnerInfo = '';
    
    if (isCompleted && winnerTeam) {
        const winnerCollege = winnerTeam === 'team1' ? matchData.college1Name : matchData.college2Name;
        const winnerPlayers = winnerTeam === 'team1' ? 
            (structure.type === 'Doubles' ? 
                `${submatch.team1Player1 || '-'} & ${submatch.team1Player2 || '-'}` : 
                submatch.team1Player1 || '-') :
            (structure.type === 'Doubles' ? 
                `${submatch.team2Player1 || '-'} & ${submatch.team2Player2 || '-'}` : 
                submatch.team2Player1 || '-');
        
        winnerInfo = `
            <div class="winner-section">
                <h4>🏆 Match Winner</h4>
                <div class="winner-details">
                    <div class="winner-college">${winnerCollege}</div>
                    <div class="winner-players">${winnerPlayers}</div>
                </div>
            </div>
        `;
    }
    
    // Create modal or detailed view for submatch
    const detailsHtml = `
        <div class="submatch-details-modal">
            <div class="submatch-details-content">
                <div class="submatch-details-header">
                    <h3>${structure.type} Match ${structure.number}</h3>
                    <button onclick="closeSubmatchDetails()" class="close-btn">&times;</button>
                </div>
                <div class="submatch-details-body">
                    <div class="teams-info">
                        <div class="team-info ${winnerTeam === 'team1' ? 'winner-team' : ''}">
                            <h4>${matchData.college1Name}</h4>
                            <p>${structure.type === 'Doubles' ? 
                                `${submatch.team1Player1 || '-'} & ${submatch.team1Player2 || '-'}` : 
                                submatch.team1Player1 || '-'}</p>
                            ${winnerTeam === 'team1' ? '<div class="winner-badge">🏆 Winner</div>' : ''}
                        </div>
                        <div class="vs-divider">VS</div>
                        <div class="team-info ${winnerTeam === 'team2' ? 'winner-team' : ''}">
                            <h4>${matchData.college2Name}</h4>
                            <p>${structure.type === 'Doubles' ? 
                                `${submatch.team2Player1 || '-'} & ${submatch.team2Player2 || '-'}` : 
                                submatch.team2Player1 || '-'}</p>
                            ${winnerTeam === 'team2' ? '<div class="winner-badge">🏆 Winner</div>' : ''}
                        </div>
                    </div>
                    ${generateSetsDetails(submatch, matchData)}
                    ${winnerInfo}
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.querySelector('.submatch-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', detailsHtml);
    
    // Add click outside to close
    setTimeout(() => {
        const modal = document.querySelector('.submatch-details-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeSubmatchDetails();
                }
            });
        }
    }, 100);
}

// Generate sets details
function generateSetsDetails(submatch, matchData) {
    if (!submatch.sets || submatch.sets.length === 0) {
        return `
            <div class="sets-info">
                <h4>📊 Sets Information</h4>
                <div class="no-sets">
                    <p>No sets have been played yet</p>
                    <small>This match hasn't started or scores haven't been recorded</small>
                </div>
            </div>
        `;
    }
    
    let setsHtml = '<div class="sets-info"><h4>📊 Sets Information</h4>';
    
    // Calculate overall scores
    let team1SetsWon = 0;
    let team2SetsWon = 0;
    
    submatch.sets.forEach((set, index) => {
        const isSetCompleted = set.isComplete || false;
        const team1Score = set.player1Score || 0;
        const team2Score = set.player2Score || 0;
        
        // Count set wins
        if (isSetCompleted) {
            if (team1Score > team2Score) team1SetsWon++;
            else if (team2Score > team1Score) team2SetsWon++;
        }
        
        // Determine set winner text
        let setWinnerText = '';
        if (isSetCompleted) {
            if (team1Score > team2Score) {
                setWinnerText = `<div class="set-winner">🏆 ${matchData.college1Name} wins this set</div>`;
            } else if (team2Score > team1Score) {
                setWinnerText = `<div class="set-winner">🏆 ${matchData.college2Name} wins this set</div>`;
            } else {
                setWinnerText = `<div class="set-winner">🤝 Set tied</div>`;
            }
        }
        
        setsHtml += `
            <div class="set-detail ${isSetCompleted ? 'completed' : 'in-progress'}">
                <div class="set-header">
                    <span class="set-number">Set ${index + 1}</span>
                    <span class="set-score">${team1Score} - ${team2Score}</span>
                    ${isSetCompleted ? 
                        `<span class="set-status">✓ Completed</span>` : 
                        `<span class="set-status">⏳ ${team1Score === 0 && team2Score === 0 ? 'Not Started' : 'In Progress'}</span>`
                    }
                </div>
                <div class="set-details-breakdown">
                    <div class="score-breakdown">
                        <span class="team-score-detail">${matchData.college1Name}: <strong>${team1Score}</strong></span>
                        <span class="team-score-detail">${matchData.college2Name}: <strong>${team2Score}</strong></span>
                    </div>
                </div>
                ${setWinnerText}
            </div>
        `;
    });
    
    // Add overall match summary
    if (team1SetsWon > 0 || team2SetsWon > 0) {
        setsHtml += `
            <div class="match-summary">
                <h5>📈 Match Summary</h5>
                <div class="sets-won-breakdown">
                    <div class="team-sets-won">
                        <span class="college-name">${matchData.college1Name}</span>
                        <span class="sets-count">${team1SetsWon} ${team1SetsWon === 1 ? 'set' : 'sets'} won</span>
                    </div>
                    <div class="team-sets-won">
                        <span class="college-name">${matchData.college2Name}</span>
                        <span class="sets-count">${team2SetsWon} ${team2SetsWon === 1 ? 'set' : 'sets'} won</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    setsHtml += '</div>';
    
    return setsHtml;
}

// Close submatch details modal
function closeSubmatchDetails() {
    const modal = document.querySelector('.submatch-details-modal');
    if (modal) {
        modal.remove();
    }
}