// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const tabBtns = document.querySelectorAll('.tab_btn');
const playerForm = document.getElementById('playerForm');
const refereeForm = document.getElementById('refereeForm');
const matchesBtn = document.querySelector('#hero_section .hero_left button');
const watchBtns = document.querySelectorAll('.watch_btn');
const modalOverlay = document.querySelector('.modal_overlay');


// Initialize homepage functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if redirected here for authentication
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'required') {
        setTimeout(() => {
            showInfo('Please login to access the team management page');
            openLoginModal();
        }, 500);
    }
    
    initializeHomepage();
});

function initializeHomepage() {
    console.log('Initializing homepage...');
    console.log('Login button:', loginBtn);
    console.log('Login modal:', loginModal);
    console.log('Close modal:', closeModal);
    console.log('Modal overlay:', modalOverlay);
    
    setupEventListeners();
    setupSmoothScrolling();
    checkUserSession();
    loadLiveMatches();
}

function setupEventListeners() {
    // Login modal events
    if (loginBtn) {
        console.log('Login button found, attaching event listener');
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Login button clicked');
            openLoginModal();
        });
    } else {
        console.error('Login button not found!');
    }
    
    if (closeModal) {
        console.log('Close button found, attaching event listener');
        closeModal.addEventListener('click', closeLoginModal);
    } else {
        console.error('Close modal button not found!');
    }
    
    if (modalOverlay) {
        console.log('Modal overlay found, attaching event listener');
        modalOverlay.addEventListener('click', closeLoginModal);
    } else {
        console.error('Modal overlay not found!');
    }
    
    // Tab switching events
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Form submission events
    if (playerForm) {
        playerForm.addEventListener('submit', handlePlayerLogin);
    }
    
    if (refereeForm) {
        refereeForm.addEventListener('submit', handleRefereeLogin);
    }
    
    // Navigation events
    if (matchesBtn) {
        matchesBtn.addEventListener('click', navigateToMatches);
    }
    
    // Watch live button events
    watchBtns.forEach(btn => {
        btn.addEventListener('click', handleWatchLive);
    });
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyPress);
}

function setupSmoothScrolling() {
    // Smooth scrolling for footer links
    const footerLinks = document.querySelectorAll('.footer_section a[href^="#"]');
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Modal Functions
function openLoginModal() {
    console.log('openLoginModal called');
    if (loginModal) {
        console.log('Modal element found, showing modal');
        loginModal.style.display = 'flex';
        loginModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        const firstInput = loginModal.querySelector('input[type="email"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    } else {
        console.error('Login modal element not found!');
    }
}

function closeLoginModal() {
    if (loginModal) {
        loginModal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Hide modal after animation
        setTimeout(() => {
            if (!loginModal.classList.contains('show')) {
                loginModal.style.display = 'none';
            }
        }, 300);
        
        // Clear form inputs
        clearLoginForms();
    }
}

function clearLoginForms() {
    if (playerForm) playerForm.reset();
    if (refereeForm) refereeForm.reset();
    
    // Clear any error messages
    const errorMessages = loginModal?.querySelectorAll('.error-message');
    errorMessages?.forEach(msg => msg.remove());
}

// Tab Switching
function switchTab(tabType) {
    // Update active tab button
    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabType) {
            btn.classList.add('active');
        }
    });
    
    // Show/hide forms
    if (tabType === 'player') {
        playerForm?.classList.remove('hidden');
        refereeForm?.classList.add('hidden');
    } else if (tabType === 'referee') {
        playerForm?.classList.add('hidden');
        refereeForm?.classList.remove('hidden');
    }
    
    // Clear forms when switching
    clearLoginForms();
}

// Login Handlers
async function handlePlayerLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('playerEmail').value.trim();
    const password = document.getElementById('playerPassword').value.trim();
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        showLoading(true);
        
        // Simulate API call for player login
        const response = await fetch(`/api/auth/player/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showSuccess('Login successful! Redirecting...');
                
                // Store user data in localStorage for client-side reference
                localStorage.setItem('userType', 'player');
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                // Redirect to team page
                setTimeout(() => {
                    window.location.href = '/team';
                }, 1500);
            } else {
                showError(data.message || 'Login failed');
            }
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
            showError(errorData.message || 'Login failed');
        }
        
    } catch (error) {
        console.error('Player login error:', error);
        showError('Network error. Please try again.');
    } finally {
        showLoading(false);
    }
}

async function handleRefereeLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('refereeEmail').value.trim();
    const password = document.getElementById('refereePassword').value.trim();
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    try {
        showLoading(true);
        
        // Simulate API call for referee login
        const response = await fetch(`/api/auth/referee/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showSuccess('Login successful! Redirecting...');
                
                // Store user data in localStorage for client-side reference
                localStorage.setItem('userType', 'referee');
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                // Redirect to referee dashboard
                setTimeout(() => {
                    window.location.href = '/referee';
                }, 1500);
            } else {
                showError(data.message || 'Login failed');
            }
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
            showError(errorData.message || 'Login failed');
        }
        
    } catch (error) {
        console.error('Referee login error:', error);
        showError('Network error. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Navigation Functions
function navigateToMatches() {
    window.location.href = '/matches';
}

function handleWatchLive(e) {
    const matchCard = e.target.closest('.match_card');
    if (matchCard) {
        const matchId = matchCard.getAttribute('data-match-id');
        const matchTitle = matchCard.querySelector('h2').textContent;
        
        if (matchId) {
            showInfo(`Opening live match: ${matchTitle}`);
            setTimeout(() => {
                window.location.href = `/match/${matchId}`;
            }, 500);
        } else {
            showError('Match ID not found');
        }
    }
}

// Global function for onclick handlers
window.watchLiveMatch = function(matchId) {
    if (matchId) {
        showInfo('Opening match details...');
        setTimeout(() => {
            window.location.href = `/match/${matchId}`;
        }, 500);
    } else {
        showError('Invalid match ID');
    }
};

// Session Management
function checkUserSession() {
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem('userData');
}

async function logout() {
    try {
        const response = await fetch(`/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            // Clear localStorage
            localStorage.removeItem('userType');
            localStorage.removeItem('userData');
            
            // Reload page to reset UI
            location.reload();
        } else {
            console.error('Logout failed');
            showError('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showError('Logout error. Please try again.');
    }
}

// Live Matches Functions
async function loadLiveMatches() {
    try {
        // First, try to fetch live matches
        console.log('Fetching live matches...');
        const liveResponse = await fetch(`/api/matches/status/live`);
        
        if (liveResponse.ok) {
            const liveMatches = await liveResponse.json();
            
            if (liveMatches && liveMatches.length > 0) {
                console.log(`Found ${liveMatches.length} live matches`);
                updateSectionTitle('Live Matches');
                renderLiveMatches(liveMatches, true);
                return;
            }
        }
        
        // If no live matches, fetch upcoming matches (limit to 5)
        console.log('No live matches found, fetching upcoming matches...');
        const upcomingResponse = await fetch(`/api/matches/status/upcoming`);
        
        if (upcomingResponse.ok) {
            const upcomingMatches = await upcomingResponse.json();
            
            if (upcomingMatches && upcomingMatches.length > 0) {
                // Limit to 5 upcoming matches
                const limitedMatches = upcomingMatches.slice(0, 5);
                console.log(`Found ${limitedMatches.length} upcoming matches`);
                updateSectionTitle('Upcoming Matches');
                renderLiveMatches(limitedMatches, false);
                return;
            }
        }
        
        // Fallback to static cards if no matches found
        console.log('No matches found, using static cards for display');
        updateSectionTitle('Match Schedule');
        addIdsToStaticCards();
        
    } catch (error) {
        console.error('Error loading matches:', error);
        // Fallback to static cards with IDs
        updateSectionTitle('Match Schedule');
        addIdsToStaticCards();
    }
}

// Update section title based on match type
function updateSectionTitle(title) {
    const sectionTitle = document.querySelector('.live_heading h1');
    if (sectionTitle) {
        sectionTitle.textContent = title;
    }
}

function renderLiveMatches(matches, isLive = true) {
    const container = document.querySelector('.match_cards_container');
    if (!container || !matches || matches.length === 0) {
        return;
    }

    container.innerHTML = '';
    
    matches.forEach(match => {
        const matchCard = createMatchCard(match, isLive);
        container.appendChild(matchCard);
    });
}

function createMatchCard(match, isLive = true) {
    const card = document.createElement('div');
    card.className = 'match_card';
    card.setAttribute('data-match-id', match._id);
    
    // Handle bye matches
    if (match.isBye) {
        const roundText = formatRoundName(match.round);
        
        card.innerHTML = `
            <div class="card_bg_image bye-bg"></div>
            <h2>${match.college1Name} (BYE)</h2>
            <div class="match-round">${roundText}</div>
            <div class="bye-info">Automatic Advancement</div>
            <div class="card_bottom">
                <div class="live_score">
                    <span class="score">🏆</span>
                    <span class="live_indicator bye">BYE</span>
                </div>
                <button class="watch_btn" onclick="watchLiveMatch('${match._id}')">View Details</button>
            </div>
        `;
        
        return card;
    }
    
    // Calculate college scores from completed matches
    const collegeScores = calculateCollegeScores(match);
    
    // Determine team names
    let teamNames = '';
    if (match.college1Name && match.college2Name) {
        teamNames = `${match.college1Name} vs ${match.college2Name}`;
    } else {
        teamNames = 'Match Loading...';
    }
    
    // Format score display
    let score = `${collegeScores.college1Score}-${collegeScores.college2Score}`;
    
    // Determine status display
    let statusText = '';
    let buttonText = '';
    
    if (isLive && match.matchStatus === 'live') {
        statusText = 'LIVE';
        buttonText = 'Watch Live';
    } else if (match.matchStatus === 'scheduled' || match.matchStatus === 'upcoming') {
        statusText = 'UPCOMING';
        buttonText = 'View Details';
        // For upcoming matches, show scheduled time if available
        if (match.scheduledTime) {
            const time = new Date(match.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            statusText = `${time}`;
        }
    } else {
        statusText = match.matchStatus ? match.matchStatus.toUpperCase() : 'SCHEDULED';
        buttonText = 'View Details';
    }
    
    card.innerHTML = `
        <div class="card_bg_image"></div>
        <h2>${teamNames}</h2>
        <div class="card_bottom">
            <div class="live_score">
                <span class="score">${score}</span>
                <span class="live_indicator ${isLive && match.matchStatus === 'live' ? 'live' : 'upcoming'}">${statusText}</span>
            </div>
            <button class="watch_btn" onclick="watchLiveMatch('${match._id}')">${buttonText}</button>
        </div>
    `;
    
    return card;
}

function addIdsToStaticCards() {
    const matchCards = document.querySelectorAll('.match_card');
    const sampleIds = [
        '64f7b123456789abcdef0001',
        '64f7b123456789abcdef0002', 
        '64f7b123456789abcdef0003',
        '64f7b123456789abcdef0004',
        '64f7b123456789abcdef0005',
        '64f7b123456789abcdef0006'
    ];
    
    matchCards.forEach((card, index) => {
        const matchId = sampleIds[index] || `64f7b123456789abcdef000${index + 1}`;
        card.setAttribute('data-match-id', matchId);
        
        // Update the watch button with onclick
        const watchBtn = card.querySelector('.watch_btn');
        if (watchBtn) {
            watchBtn.setAttribute('onclick', `watchLiveMatch('${matchId}')`);
        }
    });
}

function updateLiveScores() {
    const matchCards = document.querySelectorAll('.match_card');
    
    matchCards.forEach(card => {
        const scoreElement = card.querySelector('.score');
        if (scoreElement && Math.random() > 0.7) { // 30% chance to update each score
            const currentScore = scoreElement.textContent.split('-');
            let score1 = parseInt(currentScore[0]);
            let score2 = parseInt(currentScore[1]);
            
            // Randomly increment one of the scores
            if (Math.random() > 0.5) {
                score1 = Math.min(score1 + 1, 21);
            } else {
                score2 = Math.min(score2 + 1, 21);
            }
            
            scoreElement.textContent = `${score1}-${score2}`;
            
            // Add animation for score update
            scoreElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                scoreElement.style.transform = 'scale(1)';
            }, 200);
        }
    });
}

// Utility Functions
function showError(message) {
    showMessage(message, 'error');
}

function showSuccess(message) {
    showMessage(message, 'success');
}

function showInfo(message) {
    showMessage(message, 'info');
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.toast-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageElement = document.createElement('div');
    messageElement.className = `toast-message ${type}`;
    messageElement.textContent = message;
    
    // Style the message
    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'error':
            messageElement.style.backgroundColor = '#f44336';
            break;
        case 'success':
            messageElement.style.backgroundColor = '#4caf50';
            break;
        case 'info':
            messageElement.style.backgroundColor = '#2196f3';
            break;
        default:
            messageElement.style.backgroundColor = '#333';
    }
    
    document.body.appendChild(messageElement);
    
    // Animate in
    setTimeout(() => {
        messageElement.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 300);
    }, 3000);
}

function showLoading(show) {
    const submitBtns = document.querySelectorAll('.submit_btn');
    submitBtns.forEach(btn => {
        if (show) {
            btn.disabled = true;
            btn.textContent = 'Logging in...';
        } else {
            btn.disabled = false;
            btn.textContent = btn.id === 'playerForm' ? 'Login as Player' : 'Login as Referee';
        }
    });
}

// Keyboard Event Handler
function handleKeyPress(e) {
    // Close modal on Escape key
    if (e.key === 'Escape' && loginModal?.classList.contains('show')) {
        closeLoginModal();
    }
    
    // Open modal on Ctrl+L
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        openLoginModal();
    }
}

// Calculate college scores from individual match results
function calculateCollegeScores(match) {
    let college1Score = 0;
    let college2Score = 0;
    
    // Check boys matches (5-match format)
    if (match.match1Singles || match.match2Singles || match.match3Doubles || match.match4Singles || match.match5Doubles) {
        const matches = [
            match.match1Singles,
            match.match2Singles,
            match.match3Doubles,
            match.match4Singles,
            match.match5Doubles
        ];
        
        matches.forEach(submatch => {
            if (submatch && submatch.isCompleted && submatch.winnerTeam) {
                if (submatch.winnerTeam === 'team1') {
                    college1Score++;
                } else if (submatch.winnerTeam === 'team2') {
                    college2Score++;
                }
            }
        });
    }
    // Check girls matches (3-match format)
    else if (match.match1Singles || match.match2Doubles || match.match3Singles) {
        const matches = [
            match.match1Singles,
            match.match2Doubles,
            match.match3Singles
        ];
        
        matches.forEach(submatch => {
            if (submatch && submatch.isCompleted && submatch.winnerTeam) {
                if (submatch.winnerTeam === 'team1') {
                    college1Score++;
                } else if (submatch.winnerTeam === 'team2') {
                    college2Score++;
                }
            }
        });
    }
    // Fallback to existing score array or completedMatches
    else if (match.score && Array.isArray(match.score) && match.score.length > 0) {
        const latestScore = match.score[match.score.length - 1];
        college1Score = latestScore.team1Score || 0;
        college2Score = latestScore.team2Score || 0;
    }
    else if (match.completedMatches) {
        // If we know the overall winner, assign scores accordingly
        if (match.overallWinner === 'team1') {
            college1Score = Math.ceil(match.completedMatches / 2);
            college2Score = match.completedMatches - college1Score;
        } else if (match.overallWinner === 'team2') {
            college2Score = Math.ceil(match.completedMatches / 2);
            college1Score = match.completedMatches - college2Score;
        } else {
            // Split evenly if no clear winner yet
            college1Score = Math.floor(match.completedMatches / 2);
            college2Score = match.completedMatches - college1Score;
        }
    }
    
    return { college1Score, college2Score };
}

// Format round name for display
function formatRoundName(round) {
    if (!round) return '';
    
    const roundMap = {
        'round_1': 'Round 1',
        'round_2': 'Round 2', 
        'quarter': 'Quarter Final',
        'quater': 'Quarter Final',
        'semi': 'Semi Final',
        'final': 'Final'
    };
    
    return roundMap[round] || round.replace('_', ' ').toUpperCase();
}

// Export functions for potential use by other scripts
window.HomepageApp = {
    openLoginModal,
    closeLoginModal,
    switchTab,
    navigateToMatches,
    showMessage,
    showError,
    showSuccess,
    showInfo
};

console.log('Homepage functionality loaded successfully!');
