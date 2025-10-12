// Configuration
const API_BASE_URL = 'http://localhost:8080/api';
let currentCollegeEmail = localStorage.getItem('collegeEmail') || '';
let currentGender = 'boys';
let currentFilter = 'all';
let currentPlayerGender = 'boys';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Hide both sections until authentication check completes
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    
    if (!currentCollegeEmail) {
        showLoginSection();
        setupEventListeners();
        return;
    }

    // Validate stored email with server before showing main content
    try {
        const response = await fetch(`${API_BASE_URL}/team/college/${encodeURIComponent(currentCollegeEmail)}`);
        if (response.ok) {
            // Server confirms email is valid
            showMainContent();
        } else {
            // Invalid on server: clear localStorage and show login
            localStorage.removeItem('collegeEmail');
            currentCollegeEmail = '';
            showLoginSection();
        }
    } catch (error) {
        // On network error, prefer showing login so user can re-auth
        console.error('Auth validation error:', error);
        localStorage.removeItem('collegeEmail');
        currentCollegeEmail = '';
        showLoginSection();
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadMatches();
        });
    });
    
    // Match gender tabs with smooth transition
    document.querySelectorAll('.match-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const newGender = btn.dataset.gender;
            if (newGender === currentGender) return; // Don't reload if same tab
            
            // Add loading animation to button
            btn.style.opacity = '0.7';
            
            currentGender = newGender;
            document.querySelectorAll('.match-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Smooth transition effect
            const container = document.getElementById('matchesContainer');
            container.style.opacity = '0.5';
            container.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                loadMatches();
                btn.style.opacity = '1';
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 150);
        });
    });
    
    // Player gender tabs with smooth transition
    document.querySelectorAll('.player-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const newPlayerGender = btn.dataset.gender;
            if (newPlayerGender === currentPlayerGender) return; // Don't reload if same tab
            
            // Add loading animation to button
            btn.style.opacity = '0.7';
            
            currentPlayerGender = newPlayerGender;
            document.querySelectorAll('.player-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Smooth transition effect
            const container = document.getElementById('playersContainer');
            container.style.opacity = '0.5';
            container.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                displayPlayers();
                btn.style.opacity = '1';
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 150);
        });
    });
    
    // Add player form
    document.getElementById('addPlayerForm')?.addEventListener('submit', handleAddPlayer);
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        alert('Please enter college email');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/college/${email}`);
        if (!response.ok) {
            throw new Error('College not found. Please check your email.');
        }
        
        const college = await response.json();
        currentCollegeEmail = email;
        localStorage.setItem('collegeEmail', email);
        
        document.getElementById('collegeName').textContent = college.collegeName || email;
        showMainContent();
        
    } catch (error) {
        alert(error.message);
        console.error('Login error:', error);
    }
}

function showLoginSection() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    
    // Hide logout button during login
    const logoutBtn = document.querySelector('.btn-logout-top');
    if (logoutBtn) logoutBtn.style.display = 'none';
}

function showMainContent() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Show logout button after login
    const logoutBtn = document.querySelector('.btn-logout-top');
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    loadCollegeInfo();
    loadMatches();
}

// Load college info
async function loadCollegeInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/team/college/${currentCollegeEmail}`);
        const college = await response.json();
        document.getElementById('collegeName').textContent = college.collegeName || currentCollegeEmail;
    } catch (error) {
        console.error('Error loading college info:', error);
    }
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'matches') {
        document.getElementById('matchesTab').classList.add('active');
        loadMatches();
    } else if (tabName === 'players') {
        document.getElementById('playersTab').classList.add('active');
        loadPlayers();
    }
}



// Load matches
async function loadMatches() {
    const loading = document.getElementById('matchesLoading');
    const container = document.getElementById('matchesContainer');
    const noMatches = document.getElementById('noMatches');
    
    loading.style.display = 'block';
    container.innerHTML = '';
    noMatches.style.display = 'none';
    
    try {
        const endpoint = currentFilter === 'all' 
            ? `/team/matches/${currentCollegeEmail}`
            : `/team/matches/${currentCollegeEmail}/${currentFilter}`;
            
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        
        if (!response.ok) {
            throw new Error('Failed to load matches');
        }
        
        let matches = await response.json();
        console.log('Fetched matches:', matches);
        
        // Sort matches
        matches.sort((a, b) => {
            const statusOrder = { 'live': 1, 'upcoming': 2, 'complete': 3 };
            return (statusOrder[a.matchStatus] || 999) - (statusOrder[b.matchStatus] || 999);
        });
        
        loading.style.display = 'none';
        
        if (matches.length === 0) {
            noMatches.style.display = 'block';
        } else {
            displayMatches(matches);
        }
        
    } catch (error) {
        console.error('Error loading matches:', error);
        loading.style.display = 'none';
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <h3>❌ Error Loading Matches</h3>
                <p>${error.message}</p>
                <button onclick="loadMatches()" style="margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

// Display matches with smooth transitions
function displayMatches(matches) {
    const container = document.getElementById('matchesContainer');
    
    // Add fade-out animation to existing cards
    const existingCards = container.querySelectorAll('.match-card');
    existingCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(-10px)';
        }, index * 50);
    });
    
    // Clear container after animation
    setTimeout(() => {
        container.innerHTML = '';
        
        // Add new cards with fade-in animation
        matches.forEach((match, index) => {
            const card = createMatchCard(match);
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            container.appendChild(card);
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100 + 50);
        });
    }, existingCards.length * 50 + 100);
}

// Create match card
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.onclick = () => window.open(`/match/${match._id}`, '_blank');
    
    const status = match.matchStatus || 'upcoming';
    const score = match.score || [0, 0];
    const isMyTeam1 = match.email1 === currentCollegeEmail;
    const isMyTeam2 = match.email2 === currentCollegeEmail;
    
    card.innerHTML = `
        <div class="match-card-header">
            <span class="match-status ${status}">${status.toUpperCase()}</span>
            <span class="match-date-time">${match.date || '-'} | ${match.time || '-'}</span>
        </div>
        <div class="match-teams">
            <div class="team">
                <div class="team-name" style="${isMyTeam1 ? 'color: #2563eb; font-weight: 800;' : ''}">
                    ${isMyTeam1 ? '🏆 ' : ''}${match.college1Name || '-'}
                </div>
                <div class="team-score">${score[0] !== undefined ? score[0] : '-'}</div>
            </div>
            <div class="vs">VS</div>
            <div class="team">
                <div class="team-name" style="${isMyTeam2 ? 'color: #2563eb; font-weight: 800;' : ''}">
                    ${isMyTeam2 ? '🏆 ' : ''}${match.college2Name || '-'}
                </div>
                <div class="team-score">${score[1] !== undefined ? score[1] : '-'}</div>
            </div>
        </div>
    `;
    
    return card;
}

// Load players
let allPlayers = { boys: [], girls: [] };

async function loadPlayers() {
    const loading = document.getElementById('playersLoading');
    const container = document.getElementById('playersContainer');
    const noPlayers = document.getElementById('noPlayers');
    
    loading.style.display = 'block';
    container.innerHTML = '';
    noPlayers.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/players/${currentCollegeEmail}`);
        
        if (!response.ok) {
            throw new Error('Failed to load players');
        }
        
        allPlayers = await response.json();
        console.log('Fetched players:', allPlayers);
        
        loading.style.display = 'none';
        displayPlayers();
        
    } catch (error) {
        console.error('Error loading players:', error);
        loading.style.display = 'none';
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <h3>❌ Error Loading Players</h3>
                <p>${error.message}</p>
                <button onclick="loadPlayers()" style="margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

// Display players with smooth transitions
function displayPlayers() {
    const container = document.getElementById('playersContainer');
    const noPlayers = document.getElementById('noPlayers');
    
    const players = currentPlayerGender === 'boys' ? allPlayers.boys : allPlayers.girls;
    const maxPlayers = currentPlayerGender === 'boys' ? 7 : 5;
    const remainingSlots = maxPlayers - players.length;
    
    // Update player count display
    updatePlayerCountDisplay(players.length, maxPlayers, remainingSlots);
    
    // Update add player button state
    updateAddPlayerButton(remainingSlots);
    
    // Add fade-out animation to existing cards
    const existingCards = container.querySelectorAll('.player-card');
    existingCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(-10px)';
        }, index * 30);
    });
    
    // Clear and update after animation
    setTimeout(() => {
        container.innerHTML = '';
        
        if (players.length === 0) {
            noPlayers.style.display = 'block';
            container.style.display = 'none';
        } else {
            noPlayers.style.display = 'none';
            container.style.display = 'grid';
            
            // Add new cards with fade-in animation
            players.forEach((player, index) => {
                const card = createPlayerCard(player);
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                container.appendChild(card);
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 80 + 50);
            });
        }
    }, existingCards.length * 30 + 100);
}

// Update player count display
function updatePlayerCountDisplay(current, max, remaining) {
    // Find or create the count display element
    let countDisplay = document.getElementById('playerCountDisplay');
    if (!countDisplay) {
        countDisplay = document.createElement('div');
        countDisplay.id = 'playerCountDisplay';
        countDisplay.style.cssText = `
            margin: 15px 0;
            padding: 10px 15px;
            background: ${remaining === 0 ? '#fef2f2' : '#f0f9ff'};
            border: 1px solid ${remaining === 0 ? '#fecaca' : '#bae6fd'};
            border-radius: 8px;
            font-weight: 600;
            color: ${remaining === 0 ? '#dc2626' : '#0369a1'};
        `;
        
        // Insert before players container
        const playersContainer = document.getElementById('playersContainer');
        playersContainer.parentNode.insertBefore(countDisplay, playersContainer);
    }
    
    const genderText = currentPlayerGender === 'boys' ? 'Boys' : 'Girls';
    countDisplay.innerHTML = `
        ${genderText} Team: ${current}/${max} players 
        ${remaining > 0 ? `(${remaining} slots remaining)` : '(Team Full!)'}
    `;
}

// Update add player button state
function updateAddPlayerButton(remainingSlots) {
    // Find all add player buttons
    const addButtons = document.querySelectorAll('button[onclick="openAddPlayerModal()"]');
    
    addButtons.forEach(button => {
        if (remainingSlots === 0) {
            button.disabled = true;
            button.style.cssText = `
                background-color: #9ca3af !important;
                cursor: not-allowed !important;
                opacity: 0.6;
            `;
            button.textContent = '+ Team Full';
        } else {
            button.disabled = false;
            button.style.cssText = '';
            button.textContent = `+ Add Player (${remainingSlots} left)`;
        }
    });
}

// Create player card
function createPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'player-card';
    
    const initials = player.playerName ? player.playerName.charAt(0).toUpperCase() : '?';
    const genderIcon = player.gender?.toLowerCase() === 'female' ? '♀' : '♂';
    
    card.innerHTML = `
        <div class="player-header">
            <div class="player-avatar">${initials}</div>
            <div class="player-info">
                <div class="player-name">${player.playerName || '-'}</div>
                <div class="player-email">${player.email || '-'}</div>
            </div>
        </div>
        <div class="player-details">
            <div class="player-detail-item">
                <span class="player-detail-label">Gender:</span>
                <span class="player-detail-value">${genderIcon} ${player.gender || '-'}</span>
            </div>
            <div class="player-detail-item">
                <span class="player-detail-label">Phone:</span>
                <span class="player-detail-value">${player.phone || '-'}</span>
            </div>
        </div>
        <div class="player-actions">
            <button class="btn-delete" onclick="deletePlayer('${player._id}')">Delete</button>
        </div>
    `;
    
    return card;
}

// Add player modal
function openAddPlayerModal() {
    const players = currentPlayerGender === 'boys' ? allPlayers.boys : allPlayers.girls;
    const maxPlayers = currentPlayerGender === 'boys' ? 7 : 5;
    
    if (players.length >= maxPlayers) {
        const genderText = currentPlayerGender === 'boys' ? 'Boys' : 'Girls';
        alert(`${genderText} team is full! Maximum ${maxPlayers} players allowed.`);
        return;
    }
    
    document.getElementById('addPlayerModal').style.display = 'block';
    document.getElementById('addPlayerForm').reset();
    
    // Set default gender in modal
    const genderSelect = document.getElementById('playerGender');
    if (genderSelect) {
        genderSelect.value = currentPlayerGender === 'boys' ? 'male' : 'female';
    }
}

function closeAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
}

// Handle add player
async function handleAddPlayer(e) {
    e.preventDefault();
    
    const playerData = {
        playerName: document.getElementById('playerName').value.trim(),
        email: document.getElementById('playerEmail').value.trim(),
        gender: document.getElementById('playerGender').value,
        phone: document.getElementById('playerPhone').value.trim()
    };
    
    if (!playerData.playerName || !playerData.email || !playerData.gender) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/players/${currentCollegeEmail}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add player');
        }
        
        alert('Player added successfully!');
        closeAddPlayerModal();
        loadPlayers();
        
    } catch (error) {
        alert(error.message);
        console.error('Error adding player:', error);
    }
}

// Delete player
async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/players/${currentCollegeEmail}/${playerId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete player');
        }
        
        alert('Player deleted successfully!');
        loadPlayers();
        
    } catch (error) {
        alert(error.message);
        console.error('Error deleting player:', error);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addPlayerModal');
    if (event.target === modal) {
        closeAddPlayerModal();
    }
}

// Navigation functions
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear stored credentials
        localStorage.removeItem('collegeEmail');
        currentCollegeEmail = '';
        
        // Show login section
        showLoginSection();
        
        // Optional: Redirect to home page
        // window.location.href = '/';
        
        alert('Logged out successfully!');
    }
}
