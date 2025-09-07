// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentUser = null;
let authToken = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const registerScreen = document.getElementById('registerScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing token
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }

    // Event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Navigation
    document.getElementById('showRegister').addEventListener('click', showRegister);
    document.getElementById('showLogin').addEventListener('click', showLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });
    
    // Create event form
    document.getElementById('createEventForm').addEventListener('submit', handleCreateEvent);
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.admin;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showToast('Login successful!', 'success');
            showDashboard();
            loadDashboardData();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    showLoading();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const college = document.getElementById('regCollege').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, college, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.admin;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showToast('Registration successful!', 'success');
            showDashboard();
            loadDashboardData();
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showLogin();
    showToast('Logged out successfully', 'info');
}

// Screen management
function showLogin() {
    loginScreen.classList.remove('hidden');
    registerScreen.classList.add('hidden');
    dashboardScreen.classList.add('hidden');
}

function showRegister() {
    loginScreen.classList.add('hidden');
    registerScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
}

function showDashboard() {
    loginScreen.classList.add('hidden');
    registerScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    
    // Load user data
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('adminName').textContent = currentUser.name;
    }
}

// Tab management
function switchTab(tabName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load tab-specific data
    switch(tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'my-events':
            loadMyEvents();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/events/admin/my-events`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const events = data.events || [];
            updateDashboardStats(events);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(events) {
    const totalEvents = events.length;
    const activeEvents = events.filter(event => event.status === 'active').length;
    const upcomingEvents = events.filter(event => new Date(event.start_date) > new Date()).length;
    const totalRegistrations = events.reduce((sum, event) => sum + (event.registrations?.length || 0), 0);
    
    document.getElementById('totalEvents').textContent = totalEvents;
    document.getElementById('totalRegistrations').textContent = totalRegistrations;
    document.getElementById('activeEvents').textContent = activeEvents;
    document.getElementById('upcomingEvents').textContent = upcomingEvents;
}

// Event creation
async function handleCreateEvent(e) {
    e.preventDefault();
    showLoading();
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        eventType: document.getElementById('eventType').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        location: document.getElementById('location').value,
        maxParticipants: parseInt(document.getElementById('maxParticipants').value),
        registrationDeadline: document.getElementById('registrationDeadline').value,
        requirements: document.getElementById('requirements').value,
        prizes: document.getElementById('prizes').value,
        contactInfo: document.getElementById('contactInfo').value,
        imageUrl: document.getElementById('imageUrl').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Event created successfully!', 'success');
            document.getElementById('createEventForm').reset();
            loadDashboardData();
        } else {
            showToast(data.error || 'Failed to create event', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// My Events
async function loadMyEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events/admin/my-events`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayEvents(data.events || []);
        } else {
            showToast('Failed to load events', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

function displayEvents(events) {
    const eventsList = document.getElementById('eventsList');
    
    if (events.length === 0) {
        eventsList.innerHTML = '<div class="no-events"><p>No events created yet.</p></div>';
        return;
    }
    
    eventsList.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-header">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <span><i class="fas fa-tag"></i> ${event.event_type}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(event.start_date)}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                </div>
            </div>
            <div class="event-body">
                <p class="event-description">${event.description}</p>
                <div class="event-details">
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span>${event.registrations?.length || 0} / ${event.max_participants} participants</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>Registration deadline: ${formatDate(event.registration_deadline)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar-check"></i>
                        <span>Ends: ${formatDate(event.end_date)}</span>
                    </div>
                </div>
            </div>
            <div class="event-actions">
                <button class="btn btn-primary" onclick="editEvent(${event.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteEvent(${event.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Analytics
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE_URL}/events/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayAnalytics(data.stats || []);
        } else {
            showToast('Failed to load analytics', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    }
}

function displayAnalytics(stats) {
    const analyticsContent = document.getElementById('analyticsContent');
    
    if (stats.length === 0) {
        analyticsContent.innerHTML = '<div class="no-data"><p>No analytics data available.</p></div>';
        return;
    }
    
    analyticsContent.innerHTML = `
        <div class="analytics-card">
            <h3>Event Registration Statistics</h3>
            <div class="stats-table">
                <table>
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Max Participants</th>
                            <th>Current Registrations</th>
                            <th>Available Spots</th>
                            <th>Fill Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.map(stat => `
                            <tr>
                                <td>${stat.title}</td>
                                <td>${stat.maxParticipants}</td>
                                <td>${stat.currentRegistrations}</td>
                                <td>${stat.availableSpots}</td>
                                <td>${Math.round((stat.currentRegistrations / stat.maxParticipants) * 100)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Event actions
async function editEvent(eventId) {
    showToast('Edit functionality coming soon!', 'info');
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            showToast('Event deleted successfully!', 'success');
            loadMyEvents();
            loadDashboardData();
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to delete event', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}
