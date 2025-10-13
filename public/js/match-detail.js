
// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, matchId:', matchId);
    console.log('USE_DUMMY_DATA:', typeof USE_DUMMY_DATA !== 'undefined' ? USE_DUMMY_DATA : 'undefined');
    console.log('DUMMY_MATCHES_BOYS available:', typeof DUMMY_MATCHES_BOYS !== 'undefined');
    loadMatchDetail();
});

// Load match details
async function loadMatchDetail() {
    const loading = document.getElementById('loading');
    
    try {
        // Don't show loading spinner
        // loading.classList.add('active');
        
        console.log('Starting to load match detail...');
        
        let matchData;
        // Check if USE_DUMMY_DATA exists, default to true if not
        const useDummy = typeof USE_DUMMY_DATA !== 'undefined' ? USE_DUMMY_DATA : true;
        
        if (useDummy) {
            console.log('Fetching dummy data for matchId:', matchId);
            matchData = await fetchDummyMatchData(matchId);
            console.log('Match data loaded:', matchData);
        } else {
            console.log('Fetching from API for matchId:', matchId);
        
            const response = await fetch(`/api/matches/${matchId}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`${errorData.message || 'Failed to load match'}`);
            }
            
            matchData = await response.json();
            console.log('API response:', matchData);
        }
        
        // Populate match header
        populateMatchHeader(matchData);
        
        // Populate overall score
        populateOverallScore(matchData);
        
        // Populate referee info
        populateRefereeInfo(matchData);
        
        // Populate submatches
        populateSubmatches(matchData);
        
        // loading.classList.remove('active');
        console.log('Match details loaded successfully!');
        
    } catch (error) {
        console.error('Error loading match details:', error);
        console.error('Error stack:', error.stack);
        // loading.classList.remove('active');
        document.querySelector('.container').innerHTML = `
            <div style="text-align: center; padding: 40px; color: red;">
                <h2>Error loading match details</h2>
                <p>${error.message}</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Populate match header
function populateMatchHeader(matchData) {
    document.getElementById('college1Name').textContent = matchData.college1Name || '-';
    document.getElementById('college2Name').textContent = matchData.college2Name || '-';
    document.getElementById('matchDate').textContent = matchData.date || '-';
    document.getElementById('matchTime').textContent = matchData.time || '-';
    
    const statusElement = document.getElementById('matchStatus');
    const status = matchData.matchStatus || 'upcoming';
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    statusElement.innerHTML = `
        <span class="status-dot"></span>
        <span class="status-text">${statusText}</span>
    `;
    statusElement.className = `meta-item status-badge ${status}`;
}

// Populate overall score
function populateOverallScore(matchData) {
    document.getElementById('team1Name').textContent = matchData.college1Name || '-';
    document.getElementById('team2Name').textContent = matchData.college2Name || '-';
    const score = matchData.score || [0, 0];
    document.getElementById('team1Score').textContent = score[0] !== undefined ? score[0] : '-';
    document.getElementById('team2Score').textContent = score[1] !== undefined ? score[1] : '-';
}

// Populate referee info
function populateRefereeInfo(matchData) {
    document.getElementById('refereeName').textContent = matchData.refreeName || '-';
}

// Populate submatches
function populateSubmatches(matchData) {
    const matchesList = document.getElementById('matchesList');
    matchesList.innerHTML = '';
    
    // Add singles matches
    if (matchData.singlesMatches && matchData.singlesMatches.length > 0) {
        matchData.singlesMatches.forEach((match, index) => {
            const matchCard = createSubmatchCard(match, 'Singles', index + 1);
            matchesList.appendChild(matchCard);
        });
    }
    
    // Add doubles matches
    if (matchData.doublesMatches && matchData.doublesMatches.length > 0) {
        matchData.doublesMatches.forEach((match, index) => {
            const matchCard = createSubmatchCard(match, 'Doubles', index + 1);
            matchesList.appendChild(matchCard);
        });
    }
}

// Create submatch card
function createSubmatchCard(match, type, number) {
    const card = document.createElement('div');
    card.className = 'match-item';
    
    const isDoubles = type === 'Doubles';
    
    let player1Display, player2Display;
    if (isDoubles) {
        const t1p1 = match.team1Player1Name || '-';
        const t1p2 = match.team1Player2Name || '-';
        const t2p1 = match.team2Player1Name || '-';
        const t2p2 = match.team2Player2Name || '-';
        player1Display = `${t1p1} & ${t1p2}`;
        player2Display = `${t2p1} & ${t2p2}`;
    } else {
        player1Display = match.player1Name || '-';
        player2Display = match.player2Name || '-';
    }
    
    const status = match.singlesMatchStatus || match.doublesMatchStatus || 'upcoming';
    const winnerName = match.singlesMatchWinnerName || match.doublesMatchWinnerName1 || '';
    
    card.innerHTML = `
        <div class="match-item-header">
            <span class="match-type">
                ${type === 'Singles' ? '👤' : '👥'} ${type} ${number}
            </span>
            <span class="match-item-status ${status}">${status}</span>
        </div>
        <div class="match-players">
            <span class="player-name">${player1Display}</span>
            <span class="vs-text">VS</span>
            <span class="player-name">${player2Display}</span>
        </div>
        ${winnerName ? `<div class="match-score">🏆 <strong>Winner:</strong> ${winnerName}</div>` : '<div class="match-score">Match pending</div>'}
    `;
    
    // Add click event to open popup
    card.addEventListener('click', () => {
        openMatchPopup(match, type, number);
    });
    
    return card;
}

// Open match popup
async function openMatchPopup(match, type, number) {
    const modal = document.getElementById('matchPopup');
    modal.classList.add('active');
    
    // Set header
    document.getElementById('popupMatchTitle').textContent = `${type} Match ${number}`;
    document.getElementById('popupMatchType').textContent = type;
    
    // Set players
    populatePopupPlayers(match, type);
    
    // Load match details with sets
    await loadSubmatchDetails(match._id, type);
}

// Close popup
function closePopup() {
    const modal = document.getElementById('matchPopup');
    modal.classList.remove('active');
}

// Populate popup players
function populatePopupPlayers(match, type) {
    const playersContainer = document.getElementById('popupPlayers');
    
    if (type === 'Doubles') {
        playersContainer.innerHTML = `
            <div class="popup-player">
                <div class="popup-player-name">${match.team1Player1Name}</div>
                <div class="popup-player-name">${match.team1Player2Name}</div>
                <div class="popup-player-team">Team 1</div>
            </div>
            <div class="popup-vs">VS</div>
            <div class="popup-player">
                <div class="popup-player-name">${match.team2Player1Name}</div>
                <div class="popup-player-name">${match.team2Player2Name}</div>
                <div class="popup-player-team">Team 2</div>
            </div>
        `;
    } else {
        playersContainer.innerHTML = `
            <div class="popup-player">
                <div class="popup-player-name">${match.player1Name}</div>
                <div class="popup-player-team">Player 1</div>
            </div>
            <div class="popup-vs">VS</div>
            <div class="popup-player">
                <div class="popup-player-name">${match.player2Name}</div>
                <div class="popup-player-team">Player 2</div>
            </div>
        `;
    }
}

// Load submatch details
async function loadSubmatchDetails(submatchId, type) {
    try {
        let matchData;
        if (USE_DUMMY_DATA) {
            matchData = await fetchDummySubmatchData(submatchId, type);
        } else {
            const endpoint = type === 'Singles' ? 'singles' : 'doubles';
            const response = await fetch(`/api/matches/${endpoint}/${submatchId}`);
            matchData = await response.json();
        }
        
        // Populate score section
        populatePopupScores(matchData);
        
        // Populate summary tab
        populatePopupSummary(matchData);
        
        // Populate history tab
        populatePopupHistory(matchData);
        
    } catch (error) {
        console.error('Error loading submatch details:', error);
    }
}

// Close popup when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('matchPopup');
    if (event.target === modal) {
        closePopup();
    }
}

// Populate popup scores
function populatePopupScores(matchData) {
    const scoreSection = document.getElementById('popupScoreSection');
    scoreSection.innerHTML = '';
    
    if (matchData.setsData && matchData.setsData.length > 0) {
        matchData.setsData.forEach((set, index) => {
            const setCard = document.createElement('div');
            setCard.className = 'popup-set-score';
            setCard.innerHTML = `
                <div class="popup-set-label">Set ${index + 1}</div>
                <div class="popup-score-display">${set.player1point} - ${set.player2point}</div>
            `;
            scoreSection.appendChild(setCard);
        });
    }
}

// Populate popup summary
function populatePopupSummary(matchData) {
    const scoreTable = document.getElementById('popupScoreTable');
    scoreTable.innerHTML = `
        <div class="popup-score-row header">
            <span>Set</span>
            <span>Player 1</span>
            <span>Player 2</span>
            <span>Winner</span>
        </div>
    `;
    
    if (matchData.setsData && matchData.setsData.length > 0) {
        matchData.setsData.forEach((set, index) => {
            const row = document.createElement('div');
            row.className = 'popup-score-row';
            
            const winner = set.player1point > set.player2point ? 'Player 1' : 'Player 2';
            
            row.innerHTML = `
                <span>Set ${index + 1}</span>
                <span>${set.player1point}</span>
                <span>${set.player2point}</span>
                <span>${winner}</span>
            `;
            scoreTable.appendChild(row);
        });
    }
}

// Populate popup history
function populatePopupHistory(matchData) {
    const historyContainer = document.getElementById('popupPointHistory');
    
    // Try to get point history from sets data
    if (matchData.setsData && matchData.setsData.length > 0) {
        let hasHistory = false;
        let historyHTML = '';
        
        matchData.setsData.forEach((set, setIndex) => {
            if (set.pointHistory && set.pointHistory.length > 0) {
                hasHistory = true;
                historyHTML += `<div style="padding: 10px; font-weight: bold; background: var(--bg-tertiary);">Set ${setIndex + 1} Point History</div>`;
                set.pointHistory.forEach((point) => {
                    historyHTML += `
                        <div class="popup-history-item">
                            <span class="popup-history-point">Point ${point.pointNumber}</span>
                            <span class="popup-history-scorer">${point.winner} - Score: ${point.player1Score}-${point.player2Score}</span>
                        </div>
                    `;
                });
            }
        });
        
        if (hasHistory) {
            historyContainer.innerHTML = historyHTML;
        } else {
            historyContainer.innerHTML = `
                <div class="popup-history-item" style="text-align: center; color: var(--text-secondary);">
                    <span>No detailed point history available for this match</span>
                </div>
            `;
        }
    } else {
        historyContainer.innerHTML = `
            <div class="popup-history-item" style="text-align: center; color: var(--text-secondary);">
                <span>Match data not available</span>
            </div>
        `;
    }
}

// Close popup
function closePopup() {
    const modal = document.getElementById('matchPopup');
    modal.classList.remove('active');
}

// Close popup when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('matchPopup');
    if (event.target === modal) {
        closePopup();
    }
}

// Fetch dummy match data - Using data from matches.js
async function fetchDummyMatchData(matchId) {
    console.log('fetchDummyMatchData called with matchId:', matchId);
    
    // Check if data is available
    if (typeof DUMMY_MATCHES_BOYS === 'undefined' && typeof DUMMY_MATCHES_GIRLS === 'undefined') {
        throw new Error('Match data not loaded from matches.js. Please ensure matches.js is loaded before match-detail.js');
    }
    
    // Search in both boys and girls matches (data loaded from matches.js)
    const allMatches = [...(typeof DUMMY_MATCHES_BOYS !== 'undefined' ? DUMMY_MATCHES_BOYS : []), 
                        ...(typeof DUMMY_MATCHES_GIRLS !== 'undefined' ? DUMMY_MATCHES_GIRLS : [])];
    
    console.log('Total matches available:', allMatches.length);
    console.log('Match IDs:', allMatches.map(m => m._id));
    
    const match = allMatches.find(m => m._id === matchId);
    if (!match) {
        throw new Error(`Match with ID "${matchId}" not found. Available IDs: ${allMatches.map(m => m._id).join(', ')}`);
    }
    
    console.log('Match found:', match.college1Name, 'vs', match.college2Name);
    
    // Determine which singles/doubles data to use based on gender
    const singlesData = match.gender === 'girls' ? 
                        (typeof DUMMY_SINGLES_GIRLS !== 'undefined' ? DUMMY_SINGLES_GIRLS : {}) : 
                        (typeof DUMMY_SINGLES !== 'undefined' ? DUMMY_SINGLES : {});
    const doublesData = match.gender === 'girls' ? 
                        (typeof DUMMY_DOUBLES_GIRLS !== 'undefined' ? DUMMY_DOUBLES_GIRLS : {}) : 
                        (typeof DUMMY_DOUBLES !== 'undefined' ? DUMMY_DOUBLES : {});
    
    console.log('Singles match IDs:', match.singlesMatchId);
    console.log('Doubles match IDs:', match.doublesMatchId);
    
    // Build match data with populated singles and doubles matches
    const matchData = {
        ...match,
        singlesMatches: match.singlesMatchId.map(id => singlesData[id]).filter(Boolean),
        doublesMatches: match.doublesMatchId.map(id => doublesData[id]).filter(Boolean)
    };
    
    console.log('Singles matches populated:', matchData.singlesMatches.length);
    console.log('Doubles matches populated:', matchData.doublesMatches.length);
    
    return matchData;
}

// Fetch dummy submatch data - Using data from matches.js
async function fetchDummySubmatchData(submatchId, type) {
    // Get the appropriate sets data (loaded from matches.js)
    const setsData = typeof DUMMY_SETS !== 'undefined' ? DUMMY_SETS : {};
    const setsDataGirls = typeof DUMMY_SETS_GIRLS !== 'undefined' ? DUMMY_SETS_GIRLS : {};
    const allSets = { ...setsData, ...setsDataGirls };
    
    // Find the submatch to get its set IDs
    let submatch = null;
    let setIds = [];
    
    // Search in singles
    if (typeof DUMMY_SINGLES !== 'undefined') {
        submatch = DUMMY_SINGLES[submatchId];
    }
    if (!submatch && typeof DUMMY_SINGLES_GIRLS !== 'undefined') {
        submatch = DUMMY_SINGLES_GIRLS[submatchId];
    }
    
    // Search in doubles if not found in singles
    if (!submatch && typeof DUMMY_DOUBLES !== 'undefined') {
        submatch = DUMMY_DOUBLES[submatchId];
    }
    if (!submatch && typeof DUMMY_DOUBLES_GIRLS !== 'undefined') {
        submatch = DUMMY_DOUBLES_GIRLS[submatchId];
    }
    
    // Get set IDs from submatch
    if (submatch && submatch.sets) {
        setIds = submatch.sets;
    }
    
    // Map set IDs to actual set data
    const sets = setIds.map(setId => allSets[setId]).filter(Boolean);
    
    return {
        _id: submatchId,
        setsData: sets
    };
}
