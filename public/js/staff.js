// Staff Dashboard JavaScript
let currentUser = null;
let allTickets = [];
let assignedTickets = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    setupNavigation();
    loadDashboardData();
    setupEventListeners();
});

function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(user);
    
    if (currentUser.role !== 'staff') {
        if (window.showToast) {
            window.showToast('Access denied. This is a staff-only area.', 'error');
        }
        window.location.href = 'index.html';
    }
}

function loadUserData() {
    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('userDept').textContent = currentUser.department;
    document.getElementById('userAvatar').textContent = currentUser.full_name.charAt(0).toUpperCase();
    
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
        
        const titles = {
            'dashboard': 'Dashboard',
            'assigned': 'My Assigned Tickets',
            'all': 'All Tickets',
            'profile': 'My Profile'
        };
        document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
        
        if (sectionName === 'assigned') {
            loadAssignedTickets();
        } else if (sectionName === 'all') {
            loadAllTickets();
        }
    }
}

async function loadDashboardData() {
    try {
        const response = await fetch(`/api/tickets?role=staff&user_id=${currentUser.user_id}`);
        const data = await response.json();
        
        assignedTickets = Array.isArray(data) ? data : (data.tickets || []);
        updateStatistics(assignedTickets);
        displayDashboardTickets(assignedTickets.slice(0, 5));
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
            student_name: 'Amit Patel',
            category_name: 'Classroom',
            status: 'assigned',
            priority: 'high',
            created_at: '2026-11-08T10:30:00'
        },
        {
            ticket_id: 3,
            ticket_number: 'CC-1003',
            title: 'AC not cooling in Room 205',
            student_name: 'Sneha Reddy',
            category_name: 'Classroom',
            status: 'in_progress',
            priority: 'medium',
            created_at: '2026-11-07T09:15:00'
        }
    ];
    
    assignedTickets = demoTickets;
    updateStatistics(demoTickets);
    displayDashboardTickets(demoTickets);
}

function updateStatistics(tickets) {
    const assigned = tickets.filter(t => t.status === 'assigned').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => {
        const today = new Date().toDateString();
        return t.status === 'resolved' && new Date(t.resolved_at).toDateString() === today;
    }).length;
    const urgent = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;
    
    document.getElementById('assignedCount').textContent = assigned;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('resolvedCount').textContent = resolved;
    document.getElementById('urgentCount').textContent = urgent;
}

function displayDashboardTickets(tickets) {
    const tbody = document.querySelector('#dashboardTicketsTable tbody');
    
    if (tickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i data-lucide="inbox"></i>
                        </div>
                        <div class="empty-state-title">No tickets assigned to you</div>
                        <div class="empty-state-text">You currently have no pending tasks. Check back when the administration assigns new issues.</div>
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
            <td>${ticket.student_name || 'N/A'}</td>
            <td>${ticket.category_name}</td>
            <td><span class="badge badge-${ticket.priority}">${ticket.priority}</span></td>
            <td><span class="badge badge-${ticket.status}">${formatStatus(ticket.status)}</span></td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="openUpdateModal(${ticket.ticket_id}, '${ticket.status}')">Update</button>
            </td>
        </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function loadAssignedTickets() {
    const tbody = document.querySelector('#assignedTicketsTable tbody');
    
    if (assignedTickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i data-lucide="check-check"></i>
                        </div>
                        <div class="empty-state-title">All tasks cleared</div>
                        <div class="empty-state-text">No active tickets under this filter. Great job keeping campus operations smooth!</div>
                    </div>
                </td>
            </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    tbody.innerHTML = assignedTickets.map(ticket => `
        <tr>
            <td><strong>${ticket.ticket_number}</strong></td>
            <td>${ticket.title}</td>
            <td>${ticket.student_name || 'N/A'}</td>
            <td>${ticket.category_name}</td>
            <td><span class="badge badge-${ticket.priority}">${ticket.priority}</span></td>
            <td><span class="badge badge-${ticket.status}">${formatStatus(ticket.status)}</span></td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" onclick="viewTicketDetails(${ticket.ticket_id})">View</button>
                    <button class="btn btn-secondary btn-sm" onclick="openUpdateModal(${ticket.ticket_id}, '${ticket.status}')">Update</button>
                </div>
            </td>
        </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

async function loadAllTickets() {
    try {
        const response = await fetch('/api/tickets');
        const tickets = await response.json();
        allTickets = tickets;
        displayAllTickets(tickets);
    } catch (error) {
        console.error('Error loading all tickets:', error);
        displayAllTickets(assignedTickets);
    }
}

function displayAllTickets(tickets) {
    const tbody = document.querySelector('#allTicketsTable tbody');
    
    if (tickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i data-lucide="search"></i>
                        </div>
                        <div class="empty-state-title">No campus tickets found</div>
                        <div class="empty-state-text">No tickets match your search or filter keywords.</div>
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
            <td>${ticket.student_name || 'N/A'}</td>
            <td>${ticket.category_name}</td>
            <td><span class="badge badge-${ticket.priority}">${ticket.priority}</span></td>
            <td><span class="badge badge-${ticket.status}">${formatStatus(ticket.status)}</span></td>
            <td>${ticket.assigned_staff_name || 'Unassigned'}</td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewTicketDetails(${ticket.ticket_id})">View</button>
            </td>
        </tr>
    `).join('');
}

function setupEventListeners() {
    // Update form status change
    const updateStatus = document.getElementById('updateStatus');
    if (updateStatus) {
        updateStatus.addEventListener('change', (e) => {
            const resolutionGroup = document.getElementById('resolutionGroup');
            if (e.target.value === 'resolved') {
                resolutionGroup.style.display = 'block';
                document.getElementById('resolutionNotes').required = true;
            } else {
                resolutionGroup.style.display = 'none';
                document.getElementById('resolutionNotes').required = false;
            }
        });
    }
    
    // Update ticket form submission
    const updateForm = document.getElementById('updateTicketForm');
    if (updateForm) {
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateTicket();
        });
    }
    
    // Filter listeners
    const filterAssignedStatus = document.getElementById('filterAssignedStatus');
    const filterPriority = document.getElementById('filterPriority');
    const searchTickets = document.getElementById('searchTickets');
    
    if (filterAssignedStatus) filterAssignedStatus.addEventListener('change', filterAssignedTickets);
    if (filterPriority) filterPriority.addEventListener('change', filterAssignedTickets);
    if (searchTickets) searchTickets.addEventListener('input', searchAllTickets);
}

function openUpdateModal(ticketId, currentStatus) {
    document.getElementById('updateTicketId').value = ticketId;
    document.getElementById('updateStatus').value = currentStatus;
    document.getElementById('updateModal').classList.add('active');
    
    // Show/hide resolution field
    const resolutionGroup = document.getElementById('resolutionGroup');
    if (currentStatus === 'resolved') {
        resolutionGroup.style.display = 'block';
    } else {
        resolutionGroup.style.display = 'none';
    }
}

function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('active');
    document.getElementById('updateTicketForm').reset();
    document.getElementById('updateMessage').style.display = 'none';
}

async function updateTicket() {
    const ticketId = document.getElementById('updateTicketId').value;
    const status = document.getElementById('updateStatus').value;
    const notes = document.getElementById('updateNotes').value;
    const resolutionNotes = document.getElementById('resolutionNotes').value;
    const messageDiv = document.getElementById('updateMessage');
    
    try {
        const response = await fetch(`/api/tickets/${ticketId}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status,
                notes,
                resolution_notes: resolutionNotes,
                staff_id: currentUser.user_id
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageDiv, '✅ Ticket updated successfully!', 'success');
            setTimeout(() => {
                closeUpdateModal();
                loadDashboardData();
            }, 1500);
        } else {
            showMessage(messageDiv, data.message || 'Failed to update ticket', 'error');
        }
    } catch (error) {
        console.error('Error updating ticket:', error);
        showMessage(messageDiv, '🎭 Demo Mode: Ticket would be updated', 'success');
        setTimeout(() => {
            closeUpdateModal();
        }, 1500);
    }
}

function viewTicketDetails(ticketId) {
    fetch(`/api/tickets/${ticketId}`)
        .then(response => response.json())
        .then(data => {
            displayTicketDetailsModal(data);
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

function displayTicketDetailsModal(data) {
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
                    <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Reporting Student</span><br>
                    <span style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">${ticket.student_name}</span><br>
                    <small style="color: var(--text-muted);">${ticket.student_email}</small>
                </div>
                <div>
                    <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Department</span><br>
                    <span style="font-size: 0.88rem; color: var(--text-secondary);">${ticket.student_department}</span>
                </div>
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
                    <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Submitted On</span><br>
                    <span style="font-size: 0.88rem; color: var(--text-secondary);">${formatDate(ticket.created_at)}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong style="font-size: 0.85rem; color: var(--text-secondary);">Issue Description:</strong>
                <p style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--card-border); padding: 12px 14px; border-radius: var(--radius-md); margin-top: 6px; font-size: 0.9rem; line-height: 1.5; color: var(--text-primary);">
                    ${ticket.description}
                </p>
            </div>
            
            ${ticket.photo_url ? `
                <div style="margin-bottom: 16px;">
                    <strong style="font-size: 0.85rem; color: var(--text-secondary);">Attached Student Photo:</strong>
                    <div style="margin-top: 8px;">
                        <img src="${ticket.photo_url}" alt="Issue photo" style="max-width: 100%; max-height: 260px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--card-border); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);">
                    </div>
                </div>
            ` : ''}
            
            ${ticket.resolution_notes ? `
                <div style="margin-bottom: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 12px 14px; border-radius: var(--radius-md);">
                    <strong style="font-size: 0.82rem; color: #34d399; text-transform: uppercase;">Resolution Log:</strong>
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
        
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-subtle);">
            <button class="btn btn-primary" onclick="closeTicketModal(); openUpdateModal(${ticket.ticket_id}, '${ticket.status}')">
                <i data-lucide="edit-3"></i> Update Status & Notes
            </button>
        </div>
    `;

    if (window.lucide) {
        lucide.createIcons();
    }
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('active');
}

function filterAssignedTickets() {
    const statusFilter = document.getElementById('filterAssignedStatus').value;
    const priorityFilter = document.getElementById('filterPriority').value;
    
    let filtered = [...assignedTickets];
    
    if (statusFilter) {
        filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (priorityFilter) {
        filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    
    const tbody = document.querySelector('#assignedTicketsTable tbody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    No tickets match your filters
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(ticket => `
        <tr>
            <td><strong>${ticket.ticket_number}</strong></td>
            <td>${ticket.title}</td>
            <td>${ticket.student_name || 'N/A'}</td>
            <td>${ticket.category_name}</td>
            <td><span class="badge badge-${ticket.priority}">${ticket.priority}</span></td>
            <td><span class="badge badge-${ticket.status}">${formatStatus(ticket.status)}</span></td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" onclick="viewTicketDetails(${ticket.ticket_id})">View</button>
                    <button class="btn btn-secondary btn-sm" onclick="openUpdateModal(${ticket.ticket_id}, '${ticket.status}')">Update</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function searchAllTickets() {
    const searchTerm = document.getElementById('searchTickets').value.toLowerCase();
    
    const filtered = allTickets.filter(ticket => 
        ticket.ticket_number.toLowerCase().includes(searchTerm) ||
        ticket.title.toLowerCase().includes(searchTerm) ||
        (ticket.student_name && ticket.student_name.toLowerCase().includes(searchTerm)) ||
        ticket.category_name.toLowerCase().includes(searchTerm)
    );
    
    displayAllTickets(filtered);
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
            }, 3000);
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
