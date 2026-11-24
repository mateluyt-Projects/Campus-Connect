// Authentication JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === targetTab + 'Form') {
                    form.classList.add('active');
                }
            });
        });
    });

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const role = document.getElementById('loginRole').value;
        const messageDiv = document.getElementById('loginMessage');

        if (!role) {
            showMessage(messageDiv, 'Please select a role', 'error');
            return;
        }

        try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(messageDiv, 'Login successful! Redirecting...', 'success');
                
                // Store user data
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                
                // Redirect based on role
                setTimeout(() => {
                    switch (role) {
                        case 'student':
                            window.location.href = 'student-dashboard.html';
                            break;
                        case 'staff':
                            window.location.href = 'staff-dashboard.html';
                            break;
                        case 'admin':
                            window.location.href = 'admin-dashboard.html';
                            break;
                    }
                }, 1000);
            } else {
                showMessage(messageDiv, data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage(messageDiv, 'Connection error. Using demo mode...', 'error');
            
            // Demo mode - for testing without backend
            if (username === 'admin' && password === 'admin123' && role === 'admin') {
                demoLogin('admin', role);
            } else if (username === 'staff1' && password === 'staff123' && role === 'staff') {
                demoLogin('staff1', role);
            } else if (username === 'student1' && password === 'student123' && role === 'student') {
                demoLogin('student1', role);
            } else {
                showMessage(messageDiv, 'Invalid credentials. Check demo credentials below.', 'error');
            }
        }
    });

    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('regFullName').value;
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const phone = document.getElementById('regPhone').value;
        const department = document.getElementById('regDepartment').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const messageDiv = document.getElementById('registerMessage');

        // Validation
        if (password !== confirmPassword) {
            showMessage(messageDiv, 'Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage(messageDiv, 'Password must be at least 6 characters', 'error');
            return;
        }

        try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    username,
                    email,
                    phone,
                    department,
                    password,
                    role: 'student'
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage(messageDiv, 'Registration successful! Please login.', 'success');
                registerForm.reset();
                
                // Switch to login tab
                setTimeout(() => {
                    document.querySelector('[data-tab="login"]').click();
                }, 2000);
            } else {
                showMessage(messageDiv, data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage(messageDiv, 'Connection error. Backend not connected yet.', 'error');
        }
    });
});

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

function demoLogin(username, role) {
    const demoUsers = {
        admin: {
            user_id: 1,
            username: 'admin',
            full_name: 'System Administrator',
            email: 'admin@campusconnect.edu',
            role: 'admin',
            department: 'IT Department'
        },
        staff1: {
            user_id: 2,
            username: 'staff1',
            full_name: 'Rajesh Kumar',
            email: 'staff1@campusconnect.edu',
            role: 'staff',
            department: 'Maintenance'
        },
        student1: {
            user_id: 4,
            username: 'student1',
            full_name: 'Amit Patel',
            email: 'student1@campusconnect.edu',
            role: 'student',
            department: 'Computer Science'
        }
    };

    const user = demoUsers[username];
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('demoMode', 'true');
    
    const messageDiv = document.getElementById('loginMessage');
    showMessage(messageDiv, '🎭 Demo Mode: Login successful!', 'success');
    
    setTimeout(() => {
        switch (role) {
            case 'student':
                window.location.href = 'student-dashboard.html';
                break;
            case 'staff':
                window.location.href = 'staff-dashboard.html';
                break;
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
        }
    }, 1000);
}
