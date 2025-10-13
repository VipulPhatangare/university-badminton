// Configuration

let currentCollegeEmail = '';
let currentUserData = null;
let currentGender = 'boys';
let currentFilter = 'all';
let currentPlayerGender = 'boys';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Hide both sections until authentication check completes
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'none';
    
    // Check session authentication
    try {
        const response = await fetch(`/api/auth/session`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user && data.user.type === 'player') {
                // User is authenticated, get their data
                currentUserData = data.user;
                currentCollegeEmail = data.user.email;
                
                // Update UI with user info
                const collegeName = data.user.collegeName || data.user.email;
                document.getElementById('collegeName').textContent = collegeName;
                
                // Also update profile popup if it exists
                const profileCollegeName = document.getElementById('profileCollegeName');
                if (profileCollegeName) {
                    profileCollegeName.textContent = collegeName;
                }
                
                showMainContent();
            } else {
                // Not authenticated or not a player, redirect to homepage
                window.location.href = '/?auth=required';
                return;
            }
        } else {
            // Session expired or not authenticated, redirect to homepage
            window.location.href = '/?auth=required';
            return;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        // On network error, redirect to homepage for re-authentication
        window.location.href = '/?auth=required';
        return;
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    // Profile popup functionality
    const profileButton = document.getElementById('profileButton');
    const profilePopup = document.getElementById('profilePopup');
    const closeProfile = document.getElementById('closeProfile');
    const logoutBtn = document.getElementById('logoutBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');

    // Open profile popup
    profileButton?.addEventListener('click', () => {
        profilePopup.style.display = 'flex';
        // Update profile college name
        const profileCollegeName = document.getElementById('profileCollegeName');
        const collegeName = document.getElementById('collegeName').textContent;
        profileCollegeName.textContent = collegeName;
    });

    // Close profile popup
    closeProfile?.addEventListener('click', () => {
        profilePopup.style.display = 'none';
    });

    // Close popup when clicking outside
    profilePopup?.addEventListener('click', (e) => {
        if (e.target === profilePopup) {
            profilePopup.style.display = 'none';
        }
    });

    // Logout button in profile
    logoutBtn?.addEventListener('click', handleLogout);

    // Change password button
    changePasswordBtn?.addEventListener('click', handlePasswordChange);
    
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

    // Modal click outside to close
    const modal = document.getElementById('addPlayerModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddPlayerModal();
            }
        });
    }
}

// Login
// Logout functionality
async function handleLogout() {
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
            localStorage.removeItem('collegeEmail');
            
            // Redirect to homepage
            window.location.href = '/';
        } else {
            console.error('Logout failed');
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout error. Please try again.');
    }
}

async function handlePasswordChange() {
    try {
        // Close the profile popup
        const profilePopup = document.getElementById('profilePopup');
        profilePopup.style.display = 'none';
        
        // Show loading/sending message
        showPasswordResetMessage('Sending password reset link...', 'info');
        
        // Send password reset request
        const response = await fetch(`/api/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: currentUserData.email
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showPasswordResetMessage(
                'Password reset link has been sent to your email address. Please check your email and click the link to reset your password.',
                'success'
            );
        } else {
            showPasswordResetMessage(
                data.message || 'Failed to send password reset link. Please try again.',
                'error'
            );
        }
    } catch (error) {
        console.error('Password reset request error:', error);
        showPasswordResetMessage(
            'Failed to send password reset link. Please check your internet connection and try again.',
            'error'
        );
    }
}

function showPasswordResetMessage(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.password-reset-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `password-reset-notification notification-${type}`;
    
    // Notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        animation: slideIn 0.3s ease-out;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    // Set colors based on type
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        notification.style.color = 'white';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        notification.style.color = 'white';
    } else {
        notification.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        notification.style.color = 'white';
    }
    
    // Add icon based on type
    let icon = '';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else icon = '📧';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <span style="font-size: 20px; flex-shrink: 0;">${icon}</span>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">
                    ${type === 'success' ? 'Success!' : type === 'error' ? 'Error!' : 'Sending...'}
                </div>
                <div>${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: rgba(255,255,255,0.2); border: none; color: inherit; 
                           border-radius: 50%; width: 24px; height: 24px; cursor: pointer; 
                           display: flex; align-items: center; justify-content: center; 
                           font-size: 16px; flex-shrink: 0;">×</button>
        </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    
    if (!document.querySelector('style[data-notification-styles]')) {
        style.setAttribute('data-notification-styles', 'true');
        document.head.appendChild(style);
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto remove after 8 seconds for success/error messages
    if (type !== 'info') {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 8000);
    }
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
        const response = await fetch(`/team/college/${currentCollegeEmail}`);
        const college = await response.json();
        const collegeName = college.collegeName || currentCollegeEmail;
        document.getElementById('collegeName').textContent = collegeName;
        
        // Also update profile popup if it exists
        const profileCollegeName = document.getElementById('profileCollegeName');
        if (profileCollegeName) {
            profileCollegeName.textContent = collegeName;
        }
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
            
        const response = await fetch(`${endpoint}`);
        
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
    
    // Format round and additional info
    const round = formatRoundName(match.round);
    const gender = match.gender === 'girls' ? 'Girls' : 'Boys';
    const matchNo = match.matchNo || '1';
    const court = match.court || 'TBD';
    
    card.innerHTML = `
        <div class="match-card-header">
            <span class="match-status ${status}">${status.toUpperCase()}</span>
            <span class="match-date-time">${formatMatchDate(match.date)} | ${match.time || '-'}</span>
        </div>
        <div class="match-context">
            <small class="match-details">
                <span><i class="fas fa-trophy"></i> ${gender} ${round}</span>
                <span><i class="fas fa-hashtag"></i> Match #${matchNo}</span>
                <span><i class="fas fa-map-marker-alt"></i> Court ${court}</span>
            </small>
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
        ${match.refreeName ? `<div class="match-referee"><small><i class="fas fa-user-tie"></i> Ref: ${match.refreeName}</small></div>` : ''}
    `;
    
    return card;
}

// Helper functions for formatting
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

function formatMatchDate(dateString) {
    if (!dateString) return '-';
    
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
        const response = await fetch(`/team/players/${currentCollegeEmail}`);
        
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
    
    // Determine player position based on gender and order
    const currentPlayers = currentPlayerGender === 'boys' ? allPlayers.boys : allPlayers.girls;
    const playerIndex = currentPlayers.findIndex(p => p._id === player._id);
    let position = '';
    
    if (currentPlayerGender === 'boys') {
        if (playerIndex < 3) position = `Singles ${playerIndex + 1}`;
        else if (playerIndex < 7) position = `Doubles ${playerIndex - 2}`;
    } else {
        if (playerIndex < 2) position = `Singles ${playerIndex + 1}`;
        else if (playerIndex < 5) position = `Doubles ${playerIndex - 1}`;
    }
    
    // Calculate some basic stats if needed
    const joinDate = player.createdAt ? new Date(player.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    }) : '-';
    
    card.innerHTML = `
        <div class="player-header">
            <div class="player-avatar">${initials}</div>
            <div class="player-info">
                <div class="player-name">${player.playerName || '-'}</div>
                <div class="player-email">${player.email || '-'}</div>
                ${position ? `<div class="player-position">${position}</div>` : ''}
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
            <div class="player-detail-item">
                <span class="player-detail-label">Joined:</span>
                <span class="player-detail-value">${joinDate}</span>
            </div>
            ${player.department ? `
                <div class="player-detail-item">
                    <span class="player-detail-label">Department:</span>
                    <span class="player-detail-value">${player.department}</span>
                </div>
            ` : ''}
        </div>
        <div class="player-actions">
            <button class="btn-delete" onclick="deletePlayer('${player._id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
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
    
    const modal = document.getElementById('addPlayerModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('addPlayerForm').reset();
    
    // Set default gender in modal
    const genderSelect = document.getElementById('playerGender');
    if (genderSelect) {
        genderSelect.value = currentPlayerGender === 'boys' ? 'male' : 'female';
    }
}

function closeAddPlayerModal() {
    const modal = document.getElementById('addPlayerModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
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
        const response = await fetch(`/team/players/${currentCollegeEmail}`, {
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
        const response = await fetch(`/team/players/${currentCollegeEmail}/${playerId}`, {
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
