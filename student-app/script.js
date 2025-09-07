// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentUser = null;
let authToken = null;
let currentEvents = [];
let currentFilter = 'all';
let selectedEventId = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const registerScreen = document.getElementById('registerScreen');
const appScreen = document.getElementById('appScreen');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing token
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            showApp();
        } else {
            showLogin();
        }
    } else {
        showLogin();
    }

    // Event listeners
    setupEventListeners();
    
    // Initialize PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
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
    
    // Search and filter
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFilter(btn.dataset.filter));
    });
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login-student`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.student;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showToast('Login successful!', 'success');
            showApp();
            loadEvents();
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
    const studentId = document.getElementById('regStudentId').value;
    const college = document.getElementById('regCollege').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register-student`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, studentId, college, phone, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.student;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showToast('Registration successful!', 'success');
            showApp();
            loadEvents();
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
    appScreen.classList.add('hidden');
}

function showRegister() {
    loginScreen.classList.add('hidden');
    registerScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
}

function showApp() {
    loginScreen.classList.add('hidden');
    registerScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    
    // Load user data
    if (currentUser) {
        document.getElementById('studentName').textContent = currentUser.name;
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileCollege').textContent = currentUser.college;
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
        case 'events':
            loadEvents();
            break;
        case 'my-events':
            loadMyEvents();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Events functions
async function loadEvents() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const data = await response.json();
        
        if (response.ok) {
            currentEvents = data.events || [];
            displayEvents(currentEvents);
        } else {
            showToast('Failed to load events', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function displayEvents(events) {
    const eventsList = document.getElementById('eventsList');
    
    if (events.length === 0) {
        eventsList.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-times"></i>
                <p>No events found</p>
            </div>
        `;
        return;
    }
    
    eventsList.innerHTML = events.map(event => `
        <div class="event-card" onclick="openEventModal(${event.id})">
            <div class="event-image">
                ${event.image_url ? 
                    `<img src="${event.image_url}" alt="${event.title}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<i class="fas fa-calendar-alt"></i>`
                }
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <span><i class="fas fa-tag"></i> ${event.event_type}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(event.start_date)}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                </div>
                <p class="event-description">${event.description}</p>
                <div class="event-footer">
                    <span class="event-type">${event.event_type}</span>
                    <span class="event-date">${formatDate(event.start_date)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function openEventModal(eventId) {
    selectedEventId = eventId;
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        const data = await response.json();
        
        if (response.ok) {
            displayEventModal(data.event);
        } else {
            showToast('Failed to load event details', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function displayEventModal(event) {
    document.getElementById('modalEventTitle').textContent = event.title;
    
    const modalContent = document.getElementById('modalEventContent');
    modalContent.innerHTML = `
        <div class="event-details">
            <div class="detail-item">
                <i class="fas fa-tag"></i>
                <span><strong>Type:</strong> ${event.event_type}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-calendar"></i>
                <span><strong>Start:</strong> ${formatDate(event.start_date)}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-calendar-check"></i>
                <span><strong>End:</strong> ${formatDate(event.end_date)}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <span><strong>Location:</strong> ${event.location}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-users"></i>
                <span><strong>Participants:</strong> ${event.registrations?.length || 0} / ${event.max_participants}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span><strong>Registration Deadline:</strong> ${formatDate(event.registration_deadline)}</span>
            </div>
        </div>
        <div class="event-description">
            <h4>Description</h4>
            <p>${event.description}</p>
        </div>
        ${event.requirements ? `
            <div class="event-requirements">
                <h4>Requirements</h4>
                <p>${event.requirements}</p>
            </div>
        ` : ''}
        ${event.prizes ? `
            <div class="event-prizes">
                <h4>Prizes & Rewards</h4>
                <p>${event.prizes}</p>
            </div>
        ` : ''}
        ${event.contact_info ? `
            <div class="event-contact">
                <h4>Contact Information</h4>
                <p>${event.contact_info}</p>
            </div>
        ` : ''}
    `;
    
    // Update register button
    const registerBtn = document.getElementById('registerBtn');
    const isRegistered = event.registrations?.some(reg => reg.student.id === currentUser?.id);
    
    if (isRegistered) {
        registerBtn.innerHTML = '<i class="fas fa-check"></i> Already Registered';
        registerBtn.disabled = true;
        registerBtn.classList.remove('btn-primary');
        registerBtn.classList.add('btn-secondary');
    } else {
        registerBtn.innerHTML = '<i class="fas fa-ticket-alt"></i> Register for Event';
        registerBtn.disabled = false;
        registerBtn.classList.remove('btn-secondary');
        registerBtn.classList.add('btn-primary');
    }
    
    document.getElementById('eventModal').classList.remove('hidden');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
    selectedEventId = null;
}

async function registerForEvent() {
    if (!selectedEventId) return;
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/students/register-event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ eventId: selectedEventId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Successfully registered for event!', 'success');
            closeEventModal();
            loadEvents();
            loadMyEvents();
        } else {
            showToast(data.error || 'Failed to register for event', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// My Events functions
async function loadMyEvents() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/students/my-events`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayMyEvents(data.registrations || []);
        } else {
            showToast('Failed to load your events', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function displayMyEvents(registrations) {
    const myEventsList = document.getElementById('myEventsList');
    
    if (registrations.length === 0) {
        myEventsList.innerHTML = `
            <div class="no-events">
                <i class="fas fa-ticket-alt"></i>
                <p>You haven't registered for any events yet</p>
            </div>
        `;
        return;
    }
    
    myEventsList.innerHTML = registrations.map(reg => `
        <div class="event-card">
            <div class="event-image">
                ${reg.event.image_url ? 
                    `<img src="${reg.event.image_url}" alt="${reg.event.title}" style="width: 100%; height: 100%; object-fit: cover;">` :
                    `<i class="fas fa-calendar-alt"></i>`
                }
            </div>
            <div class="event-content">
                <h3 class="event-title">${reg.event.title}</h3>
                <div class="event-meta">
                    <span><i class="fas fa-tag"></i> ${reg.event.event_type}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(reg.event.start_date)}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${reg.event.location}</span>
                </div>
                <p class="event-description">${reg.event.description}</p>
                <div class="event-footer">
                    <span class="event-type ${reg.status}">${reg.status.replace('_', ' ')}</span>
                    <span class="event-date">${formatDate(reg.event.start_date)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Profile functions
function loadProfile() {
    // Profile data is already loaded in showApp()
}

function editProfile() {
    showToast('Edit profile functionality coming soon!', 'info');
}

function changePassword() {
    showToast('Change password functionality coming soon!', 'info');
}

// Search and filter functions
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredEvents = currentEvents.filter(event => 
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.event_type.toLowerCase().includes(searchTerm)
    );
    displayEvents(filteredEvents);
}

function handleFilter(filter) {
    currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Filter events
    let filteredEvents = currentEvents;
    if (filter !== 'all') {
        filteredEvents = currentEvents.filter(event => event.event_type === filter);
    }
    
    displayEvents(filteredEvents);
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
