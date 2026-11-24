// Admin Dashboard JavaScript
let currentUser = null;
let allTickets = [];
let allUsers = [];
let allCategories = [];
let staffMembers = [];

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
    
    if (currentUser.role !== 'admin') {
        if (window.showToast) {
            window.showToast('Access denied. This is an admin-only area.', 'error');
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
            'dashboard': 'Admin Dashboard',
            'tickets': 'All Tickets',
            'users': 'User Management',
            'categories': 'Category Management',
            'analytics': 'Analytics',
            'profile': 'My Profile'
        };
        document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
        
        // Load section-specific data
        if (sectionName === 'tickets') {
            loadAllTickets();
        } else if (sectionName === 'users') {
            loadUsers();
        } else if (sectionName === 'categories') {
            loadCategories();
        }
    }
}

async function loadDashboardData() {
    try {
        // Load tickets
        const ticketsResponse = await fetch('/api/tickets');
        allTickets = await ticketsResponse.json();
        
        // Load users
        const usersResponse = await fetch('/api/users');
        allUsers = await usersResponse.json();
        
        updateDashboardStatistics();
        displayRecentTickets(allTickets.slice(0, 10));
    } catch (error) {
        console.error('Error loading dashboard:', error);
        loadDemoData();
    }
}

function loadDemoData() {
    allTickets = [
        {
            ticket_id: 1,
            ticket_number: 'CC-1001',
            title: 'Broken projector in Room 301',
            student_name: 'Amit Patel',
            category_name: 'Classroom',
            status: 'in_progress',
            priority: 'high',
            assigned_staff_name: 'Rajesh Kumar',
            created_at: '2026-11-08T10:30:00'
        },
        {
            ticket_id: 2,
            ticket_number: 'CC-1002',
            title: 'WiFi not working in Library',
            student_name: 'Sneha Reddy',
            category_name: 'IT & Network',
            status: 'assigned',
            priority: 'medium',
            assigned_staff_name: 'Priya Sharma',
            created_at: '2026-11-07T14:20:00'
        },
        {
            ticket_id: 3,
            ticket_number: 'CC-1003',
            title: 'Water leakage in Hostel Block A',
            student_name: 'Rahul Verma',
            category_name: 'Plumbing',
            status: 'submitted',
            priority: 'urgent',
            assigned_staff_name: null,
            created_at: '2026-11-09T08:15:00'
        }
    ];
    
    allUsers = [
        { user_id: 1, full_name: 'System Administrator', username: 'admin', email: 'admin@campusconnect.edu', role: 'admin', department: 'IT', created_at: '2026-01-01' },
        { user_id: 2, full_name: 'Rajesh Kumar', username: 'staff1', email: 'staff1@campusconnect.edu', role: 'staff', department: 'Maintenance', created_at: '2026-01-15' },
        { user_id: 3, full_name: 'Priya Sharma', username: 'staff2', email: 'staff2@campusconnect.edu', role: 'staff', department: 'IT', created_at: '2026-01-20' },
        { user_id: 4, full_name: 'Amit Patel', username: 'student1', email: 'student1@campusconnect.edu', role: 'student', department: 'Computer Science', created_at: '2026-02-01' },
        { user_id: 5, full_name: 'Sneha Reddy', username: 'student2', email: 'student2@campusconnect.edu', role: 'student', department: 'Electronics', created_at: '2026-02-05' }
    ];
    
    allCategories = [
        { category_id: 1, category_name: 'Infrastructure', description: 'Building maintenance issues', assigned_team: 'Maintenance Team', is_active: true },
        { category_id: 2, category_name: 'Electrical', description: 'Power and electrical faults', assigned_team: 'Electrical Team', is_active: true },
        { category_id: 5, category_name: 'IT & Network', description: 'WiFi and lab equipment', assigned_team: 'IT Team', is_active: true }
    ];
    
    staffMembers = allUsers.filter(u => u.role === 'staff');
    
    updateDashboardStatistics();
    displayRecentTickets(allTickets);
}

function updateDashboardStatistics() {
    // Ticket stats
    const total = allTickets.length;
    const open = allTickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;
    const resolved = allTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;
    const urgent = allTickets.filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)).length;
    
    document.getElementById('totalTicketsCount').textContent = total;
    document.getElementById('openTicketsCount').textContent = open;
    document.getElementById('resolvedTicketsCount').textContent = resolved;
    document.getElementById('urgentTicketsCount').textContent = urgent;
    
    // User stats
    const totalUsers = allUsers.length;
    const students = allUsers.filter(u => u.role === 'student').length;
    const staff = allUsers.filter(u => u.role === 'staff').length;
    
    document.getElementById('totalUsersCount').textContent = totalUsers;
    document.getElementById('studentsCount').textContent = students;
    document.getElementById('staffCount').textContent = staff;
}

function displayRecentTickets(tickets) {
    const tbody = document.querySelector('#recentTicketsTable tbody');
    
    if (tickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i data-lucide="check-circle-2"></i>
                        </div>
                        <div class="empty-state-title">No recent campus tickets</div>
                        <div class="empty-state-text">All campus operations are currently running smoothly without open tickets.</div>
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
            <td>${ticket.assigned_staff_name || '<span style="color: #f59e0b;">Unassigned</span>'}</td>
            <td>${formatDate(ticket.created_at)}</td>
        </tr>
    `).join('');    if (window.lucide) lucide.createIcons();}

function loadAllTickets() {
    const tbody = document.querySelector('#allTicketsTable tbody');
    
    if (allTickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i data-lucide="ticket"></i>
                        </div>
                        <div class="empty-state-title">No tickets match criteria</div>
                        <div class="empty-state-text">No tickets were found matching your current filter or search parameters.</div>
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
            <td>${ticket.student_name || 'N/A'}</td>
            <td>${ticket.category_name}</td>
            <td><span class="badge badge-${ticket.priority}">${ticket.priority}</span></td>
            <td><span class="badge badge-${ticket.status}">${formatStatus(ticket.status)}</span></td>
            <td>${ticket.assigned_staff_name || '<span style="color: #f59e0b;">Unassigned</span>'}</td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                <div class="btn-group">
                    ${!ticket.assigned_staff_name ? 
                        `<button class="btn btn-secondary btn-sm" onclick="openAssignModal(${ticket.ticket_id})">Assign</button>` : 
                        `<button class="btn btn-primary btn-sm" onclick="viewTicketDetails(${ticket.ticket_id})">View</button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

function loadUsers() {
    const tbody = document.querySelector('#usersTable tbody');
    
    if (allUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                    No users found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allUsers.map(user => `
        <tr>
            <td>${user.user_id}</td>
            <td>${user.full_name}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-${user.role === 'admin' ? 'urgent' : user.role === 'staff' ? 'high' : 'medium'}">${user.role}</span></td>
            <td>${user.department}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewUser(${user.user_id})">View</button>
            </td>
        </tr>
    `).join('');
}

function loadCategories() {
    const tbody = document.querySelector('#categoriesTable tbody');
    
    if (allCategories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                    No categories found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allCategories.map(cat => `
        <tr>
            <td>${cat.category_id}</td>
            <td><strong>${cat.category_name}</strong></td>
            <td>${cat.description}</td>
            <td>${cat.assigned_team}</td>
            <td><span class="badge badge-${cat.is_active ? 'resolved' : 'closed'}">${cat.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editCategory(${cat.category_id})">Edit</button>
            </td>
        </tr>
    `).join('');
}

function setupEventListeners() {
    // Assign ticket form
    const assignForm = document.getElementById('assignTicketForm');
    if (assignForm) {
        assignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await assignTicket();
        });
    }
    
    // Search and filter
    const searchTickets = document.getElementById('searchTickets');
    const filterStatus = document.getElementById('filterStatus');
    
    if (searchTickets) searchTickets.addEventListener('input', searchAllTickets);
    if (filterStatus) filterStatus.addEventListener('change', filterTickets);
}

function openAssignModal(ticketId) {
    document.getElementById('assignTicketId').value = ticketId;
    
    // Load staff members from API
    fetch('/api/users/staff')
        .then(response => response.json())
        .then(staff => {
            const staffSelect = document.getElementById('assignStaff');
            staffSelect.innerHTML = '<option value="">Select Staff Member</option>';
            
            staff.forEach(member => {
                staffSelect.innerHTML += `<option value="${member.user_id}">${member.full_name} (${member.department})</option>`;
            });
            
            document.getElementById('assignModal').classList.add('active');
        })
        .catch(error => {
            console.error('Error loading staff:', error);
            // Fallback to demo data
            const staffSelect = document.getElementById('assignStaff');
            staffSelect.innerHTML = '<option value="">Select Staff Member</option>';
            
            staffMembers.forEach(staff => {
                staffSelect.innerHTML += `<option value="${staff.user_id}">${staff.full_name} (${staff.department})</option>`;
            });
            
            document.getElementById('assignModal').classList.add('active');
        });
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
                    <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Student</span><br>
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
                    <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase;">Created On</span><br>
                    <span style="font-size: 0.88rem; color: var(--text-secondary);">${formatDate(ticket.created_at)}</span>
                </div>
                ${ticket.assigned_staff_name ? `
                <div style="grid-column: span 2; background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); padding: 10px 14px; border-radius: var(--radius-md);">
                    <span style="font-size: 0.76rem; color: var(--primary-light); text-transform: uppercase; font-weight: 600;">Assigned Staff:</span>
                    <div style="color: var(--text-primary); font-weight: 600; margin-top: 2px;">${ticket.assigned_staff_name}</div>
                </div>
                ` : ''}
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong style="font-size: 0.85rem; color: var(--text-secondary);">Description:</strong>
                <p style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--card-border); padding: 12px 14px; border-radius: var(--radius-md); margin-top: 6px; font-size: 0.9rem; line-height: 1.5; color: var(--text-primary);">
                    ${ticket.description}
                </p>
            </div>
            
            ${ticket.photo_url ? `
                <div style="margin-bottom: 16px;">
                    <strong style="font-size: 0.85rem; color: var(--text-secondary);">Attached Photo:</strong>
                    <div style="margin-top: 8px;">
                        <img src="${ticket.photo_url}" alt="Issue photo" style="max-width: 100%; max-height: 260px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--card-border); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);">
                    </div>
                </div>
            ` : ''}
            
            ${ticket.resolution_notes ? `
                <div style="margin-bottom: 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 12px 14px; border-radius: var(--radius-md);">
                    <strong style="font-size: 0.82rem; color: #34d399; text-transform: uppercase;">Resolution Notes:</strong>
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
                                <span class="badge badge-${h.new_status}">${formatStatus(h.new_status)}</span>
                            </div>
                            ${h.notes ? `<p style="margin-top: 8px; color: var(--text-secondary);">${h.notes}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

function searchAllTickets() {
    const searchTerm = document.getElementById('searchTickets').value.toLowerCase();
    const filtered = allTickets.filter(ticket => 
        ticket.ticket_number.toLowerCase().includes(searchTerm) ||
        ticket.title.toLowerCase().includes(searchTerm) ||
        (ticket.student_name && ticket.student_name.toLowerCase().includes(searchTerm))
    );
    displayAllTicketsFiltered(filtered);
}

function filterTickets() {
    const status = document.getElementById('filterStatus').value;
    const filtered = status ? allTickets.filter(t => t.status === status) : allTickets;
    displayAllTicketsFiltered(filtered);
}

function displayAllTicketsFiltered(tickets) {
    const tbody = document.querySelector('#allTicketsTable tbody');
    
    if (tickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i data-lucide="filter"></i>
                        </div>
                        <div class="empty-state-title">No matching tickets</div>
                        <div class="empty-state-text">No tickets match your specific filter or search query.</div>
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
            <td>${ticket.assigned_staff_name || '<span style="color: #f59e0b;">Unassigned</span>'}</td>
            <td>${formatDate(ticket.created_at)}</td>
            <td>
                ${!ticket.assigned_staff_name ? 
                    `<button class="btn btn-secondary btn-sm" onclick="openAssignModal(${ticket.ticket_id})">Assign</button>` : 
                    `<button class="btn btn-primary btn-sm" onclick="viewTicketDetails(${ticket.ticket_id})">View</button>`
                }
            </td>
        </tr>
    `).join('');
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
