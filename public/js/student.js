// Student Dashboard JavaScript
let currentUser = null;
let allTickets = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Load user data
    loadUserData();
    
    // Setup navigation
    setupNavigation();
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
});

function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(user);
    
    if (currentUser.role !== 'student') {
        if (window.showToast) {
            window.showToast('Access denied. This is a student-only area.', 'error');
        }
        window.location.href = 'index.html';
    }
}

function loadUserData() {
    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('userDept').textContent = currentUser.department;
    document.getElementById('userAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
    
    // Profile section
    document.getElementById('profileName').value = currentUser.full_name;
    document.getElementById('profileUsername').value = currentUser.username;
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = currentUser.phone || 'Not provided';
    document.getElementById('profileDepartment').value = currentUser.department;
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            if (link.id === 'logoutBtn') {
                logout();
                return;
            }
            
            const section = link.dataset.section;
            if (section) {
                showSection(section);
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
}

function showSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.style.display = 'none');
    
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'report': 'Report New Issue',
            'tickets': 'My Tickets',
            'profile': 'My Profile'
        };
        document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
        
        // Load section-specific data
        if (sectionName === 'tickets') {
            loadAllTickets();
        } else if (sectionName === 'dashboard') {
            loadDashboardData();
        }
    }
}

async function loadDashboardData() {
    try {
        const response = await fetch(`/api/tickets?role=student&user_id=${currentUser.user_id}`);
        const tickets = await response.json();
        
        allTickets = tickets;
        updateStatistics(tickets);
        displayRecentTickets(tickets.slice(0, 5));
    } catch (error) {
        console.error('Error loading dashboard:', error);
        loadDemoData();
    }
}

function loadDemoData() {
    const demoTickets = [
        {
            ticket_id: 1,
            ticket_number: 'CC-1001',
            title: 'Broken projector in Room 301',
            category_name: 'Classroom',
            status: 'in_progress',
            priority: 'high',
            created_at: '2026-11-08T10:30:00',
            location: 'Main Building, 3rd Floor, Room 301'
        },
        {
            ticket_id: 2,
            ticket_number: 'CC-1002',
            title: 'WiFi not working in Library',
            category_name: 'IT & Network',
            status: 'assigned',
            priority: 'medium',
            created_at: '2026-11-07T14:20:00',
            location: 'Central Library'
        }
    ];
    
    updateStatistics(demoTickets);
    displayRecentTickets(demoTickets);
    allTickets = demoTickets;
}

function updateStatistics(tickets) {
    const total = tickets.length;
    const pending = tickets.filter(t => ['submitted', 'assigned', 'in_progress'].includes(t.status)).length;
    const resolved = tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;
    
    document.getElementById('totalTickets').textContent = total;
    document.getElementById('pendingTickets').textContent = pending;
    document.getElementById('resolvedTickets').textContent = resolved;
}

function displayRecentTickets(tickets) {
    const tbody = document.querySelector('#recentTicketsTable tbody');
    
    if (tickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i data-lucide="clipboard-list"></i>
                        </div>
                        <div class="empty-state-title">No tickets reported yet</div>
                        <div class="empty-state-text">Found an issue on campus? Report it right now and track its resolution in real-time.</div>
                        <button class="btn btn-primary btn-sm" onclick="showSection('report')">
                            <i data-lucide="plus"></i> Report Your First Issue
                        </button>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    tbody.innerHTML = tickets.map(ticket => `
        <tr>
            <td><strong>${ticket.ticket_number}</strong></td>
            <td>${ticket.title}</td>
            <td>${ticket.category_name}</td>
            <td><span class="badge badge-${ticket.status}">${formatStatus(ticket.status)}</span></td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewTicket(${ticket.ticket_id})">View</button>
            </td>
        </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function loadAllTickets() {
    const tbody = document.querySelector('#allTicketsTable tbody');
    
    if (allTickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i data-lucide="ticket"></i>
                        </div>
                        <div class="empty-state-title">No tickets match your filter</div>
                        <div class="empty-state-text">You have no tickets currently under this criteria or haven't submitted any yet.</div>
                        <button class="btn btn-primary btn-sm" onclick="showSection('report')">
                            <i data-lucide="plus"></i> New Ticket
                        </button>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    tbody.innerHTML = allTickets.map(ticket => `
        <tr>
            <td><strong>${ticket.ticket_number}</strong></td>
            <td>${ticket.title}</td>
            <td>${ticket.category_name}</td>
            <td><span class="badge badge-${ticket.priority}">${ticket.priority}</span></td>
            <td><span class="badge badge-${ticket.status}">${formatStatus(ticket.status)}</span></td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewTicket(${ticket.ticket_id})">View Details</button>
            </td>
        </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function setupEventListeners() {
    // Report Issue Form
    const reportForm = document.getElementById('reportIssueForm');
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitIssue();
    });
    
    // Filter tickets
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', filterTickets);
    }

    // Drag-and-drop photo upload zone with instant preview
    setupPhotoDropzone();
}

function setupPhotoDropzone() {
    const dropzone = document.getElementById('uploadDropzone');
    const photoInput = document.getElementById('issuePhoto');
    const previewContainer = document.getElementById('uploadPreviewContainer');
    const thumbnail = document.getElementById('uploadThumbnail');
    const previewName = document.getElementById('uploadPreviewName');
    const previewMeta = document.getElementById('uploadPreviewMeta');
    const removeBtn = document.getElementById('btnRemovePreview');

    if (!dropzone || !photoInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            photoInput.files = dt.files;
            handleFileSelection(dt.files[0]);
        }
    });

    photoInput.addEventListener('change', () => {
        if (photoInput.files && photoInput.files[0]) {
            handleFileSelection(photoInput.files[0]);
        }
    });

    function handleFileSelection(file) {
        if (!file) return;

        // Validation: 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            if (window.showToast) {
                window.showToast('Selected image exceeds 5MB limit. Please choose a smaller photo.', 'warning');
            }
            clearPreview();
            return;
        }

        if (!file.type.match('image.*')) {
            if (window.showToast) {
                window.showToast('Only image files (JPEG, PNG, GIF) are allowed.', 'warning');
            }
            clearPreview();
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            thumbnail.src = e.target.result;
            previewName.textContent = file.name;
            const sizeInKb = (file.size / 1024).toFixed(1);
            previewMeta.textContent = `${sizeInKb} KB • ${file.type}`;
            previewContainer.classList.add('active');
            if (window.lucide) lucide.createIcons({ root: previewContainer });
            if (window.showToast) {
                window.showToast(`Photo "${file.name}" attached successfully!`, 'info');
            }
        };
        reader.readAsDataURL(file);
    }

    function clearPreview() {
        photoInput.value = '';
        thumbnail.src = '';
        previewName.textContent = '';
        previewMeta.textContent = '';
        previewContainer.classList.remove('active');
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearPreview();
            if (window.showToast) {
                window.showToast('Attached photo removed.', 'info');
            }
        });
    }

    // Attach to reset button
    const clearFormBtn = document.querySelector('#reportIssueForm button[type="button"]');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearPreview);
    }
}

async function submitIssue() {
    const formData = new FormData();
    formData.append('student_id', currentUser.user_id);
    formData.append('title', document.getElementById('issueTitle').value);
    formData.append('category_id', document.getElementById('issueCategory').value);
    formData.append('priority', document.getElementById('issuePriority').value);
    formData.append('location', document.getElementById('issueLocation').value);
    formData.append('description', document.getElementById('issueDescription').value);
    
    const photoFile = document.getElementById('issuePhoto').files[0];
    if (photoFile) {
        formData.append('photo', photoFile);
    }
    
    const messageDiv = document.getElementById('reportMessage');
    
    try {
        // TODO: Replace with actual API call
        const response = await fetch('/api/tickets', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageDiv, `✅ Issue reported successfully! Ticket ID: ${data.ticket_number}`, 'success');
            document.getElementById('reportIssueForm').reset();
            const previewContainer = document.getElementById('uploadPreviewContainer');
            if (previewContainer) previewContainer.classList.remove('active');
            
            setTimeout(() => {
                loadDashboardData();
                showSection('dashboard');
            }, 2000);
        } else {
            showMessage(messageDiv, data.message || 'Failed to submit issue', 'error');
        }
    } catch (error) {
        console.error('Error submitting issue:', error);
        showMessage(messageDiv, '🎭 Demo Mode: Issue would be submitted to backend', 'success');
        
        setTimeout(() => {
            document.getElementById('reportIssueForm').reset();
            const previewContainer = document.getElementById('uploadPreviewContainer');
            if (previewContainer) previewContainer.classList.remove('active');
            showSection('dashboard');
        }, 2000);
    }
}

function viewTicket(ticketId) {
    // Fetch ticket details
    fetch(`/api/tickets/${ticketId}`)
        .then(response => response.json())
        .then(data => {
            displayTicketDetails(data);
            document.getElementById('ticketModal').classList.add('active');
        })
        .catch(error => {
            console.error('Error loading ticket:', error);
            if (window.showToast) {
                window.showToast('Error loading ticket details.', 'error');
            }
        });
}

function renderStatusTracker(currentStatus) {
    const steps = [
        { key: 'submitted', label: 'Submitted', icon: 'file-text' },
        { key: 'assigned', label: 'Assigned', icon: 'user-check' },
        { key: 'in_progress', label: 'In Progress', icon: 'clock' },
        { key: 'resolved', label: 'Resolved', icon: 'check-circle-2' }
    ];

    const statusWeights = {
        'submitted': 1,
        'assigned': 2,
        'in_progress': 3,
        'resolved': 4,
        'closed': 4
    };

    const currentWeight = statusWeights[currentStatus] || 1;
    const fillPercent = Math.max(0, Math.min(100, ((currentWeight - 1) / (steps.length - 1)) * 100));

    const stepsHtml = steps.map((step, idx) => {
        const stepNum = idx + 1;
        let stateClass = '';
        if (stepNum < currentWeight) {
            stateClass = 'completed';
        } else if (stepNum === currentWeight) {
            stateClass = 'active';
        }

        const iconMarkup = stateClass === 'completed'
            ? '<i data-lucide="check"></i>'
            : `<i data-lucide="${step.icon}"></i>`;

        return `
            <div class="tracker-step ${stateClass}">
                <div class="tracker-node">
                    ${iconMarkup}
                </div>
                <div class="tracker-label">${step.label}</div>
            </div>
        `;
    }).join('');

    return `
        <div class="status-tracker-card">
            <div class="status-tracker">
                <div class="tracker-connector">
                    <div class="tracker-connector-fill" style="width: ${fillPercent}%;"></div>
                </div>
                ${stepsHtml}
            </div>
        </div>
    `;
}

function displayTicketDetails(data) {
    const ticket = data.ticket;
    const history = data.history || [];
    
    const detailsDiv = document.getElementById('ticketDetails');
    
    detailsDiv.innerHTML = `
        ${renderStatusTracker(ticket.status)}
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <h3 style="color: var(--primary-light); font-weight: 700;">${ticket.ticket_number}</h3>
                <span class="badge badge-${ticket.status}">${formatStatus(ticket.status)}</span>
            </div>
            <h4 style="margin-bottom: 16px; font-size: 1.15rem; color: var(--text-primary);">${ticket.title}</h4>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px; background: rgba(15, 23, 42, 0.4); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
                <div>
                    <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Category</span><br>
                    <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${ticket.category_name}</span>
                </div>
                <div>
                    <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Priority</span><br>
                    <span class="badge badge-${ticket.priority}">${ticket.priority}</span>
                </div>
                <div>
                    <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Location</span><br>
                    <span style="font-size: 0.88rem; color: var(--text-secondary);">${ticket.location}</span>
                </div>
                <div>
                    <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Reported On</span><br>
                    <span style="font-size: 0.88rem; color: var(--text-secondary);">${formatDate(ticket.created_at)}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong style="font-size: 0.85rem; color: var(--text-secondary);">Description:</strong>
                <p style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--card-border); padding: 12px 14px; border-radius: var(--radius-md); margin-top: 6px; font-size: 0.9rem; line-height: 1.5; color: var(--text-primary);">
                    ${ticket.description}
                </p>
            </div>
            
            ${ticket.photo_url ? `
                <div style="margin-bottom: 16px;">
                    <strong style="font-size: 0.85rem; color: var(--text-secondary);">Attached Evidence Photo:</strong>
                    <div style="margin-top: 8px;">
                        <img src="${ticket.photo_url}" alt="Issue photo" style="max-width: 100%; max-height: 260px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--card-border); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);">
                    </div>
                </div>
            ` : ''}
            
            ${ticket.assigned_staff_name ? `
                <div style="margin-bottom: 16px; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); padding: 10px 14px; border-radius: var(--radius-md);">
                    <strong style="font-size: 0.82rem; color: var(--primary-light); text-transform: uppercase;">Assigned Resolver:</strong>
                    <div style="color: var(--text-primary); font-weight: 600; margin-top: 2px;">${ticket.assigned_staff_name}</div>
                </div>
            ` : ''}
            
            ${ticket.resolution_notes ? `
                <div style="margin-bottom: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 12px 14px; border-radius: var(--radius-md);">
                    <strong style="font-size: 0.82rem; color: #34d399; text-transform: uppercase;">Resolution Summary:</strong>
                    <p style="color: var(--text-primary); margin-top: 4px; font-size: 0.9rem;">
                        ${ticket.resolution_notes}
                    </p>
                </div>
            ` : ''}
        </div>
        
        ${history.length > 0 ? `
            <div style="border-top: 1px solid var(--border-subtle); padding-top: 20px;">
                <h4 style="margin-bottom: 14px; font-size: 0.95rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="history"></i> Timeline Activity
                </h4>
                <div style="max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                    ${history.map(h => `
                        <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--card-border); padding: 12px 14px; border-radius: var(--radius-md);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span style="font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">${h.changed_by_name}</span>
                                <span style="color: var(--text-muted); font-size: 0.78rem;">${formatDate(h.created_at)}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem;">
                                ${h.old_status ? `
                                    <span class="badge badge-${h.old_status}">${formatStatus(h.old_status)}</span>
                                    <span style="color: var(--text-muted);">&rarr;</span>
                                ` : ''}
                                <span class="badge badge-${h.new_status}">${formatStatus(h.new_status)}</span>
                            </div>
                            ${h.notes ? `<p style="margin-top: 6px; color: var(--text-secondary); font-size: 0.82rem;">${h.notes}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    if (window.lucide) {
        lucide.createIcons();
    }
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('active');
}

function filterTickets() {
    const filterValue = document.getElementById('filterStatus').value;
    // TODO: Implement filtering
    console.log('Filtering by:', filterValue);
}

function formatStatus(status) {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        element.className = 'message ' + type;
        element.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
    
    if (window.showToast) {
        window.showToast(message, type);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('demoMode');
        window.location.href = 'index.html';
    }
}
