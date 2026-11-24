require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, PNG, GIF) and PDF files are allowed!'));
        }
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate unique ticket number
function generateTicketNumber() {
    return 'CC-' + Math.floor(1000 + Math.random() * 9000);
}

// Hash password using bcrypt
async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password using bcrypt
async function verifyPassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
}

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Campus Connect API is running',
        timestamp: new Date().toISOString()
    });
});

// Test database connection endpoint
app.get('/api/db-test', async (req, res) => {
    console.log('🧪 /api/db-test endpoint called');
    try {
        console.log('🧪 Testing database query...');
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        console.log('✅ Query successful:', rows);
        res.json({ 
            status: 'success', 
            message: 'Database connection working',
            result: rows[0].result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Query failed:', error.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ message: 'Username, password, and role are required' });
        }

        // Find user by username or email and role
        const [users] = await db.query(
            'SELECT * FROM users WHERE (username = ? OR email = ?) AND role = ?',
            [username, username, role]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password (handles both bcrypt and plain text for migration)
        let passwordMatch = false;
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            // bcrypt hashed password
            passwordMatch = await verifyPassword(password, user.password);
        } else {
            // Plain text password (for existing demo accounts)
            passwordMatch = (password === user.password);
        }

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Remove password from response
        delete user.password;

        res.json({
            message: 'Login successful',
            user: user,
            token: 'demo-token-' + user.user_id // In production, use JWT
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Register (Student only)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullName, username, email, phone, department, password } = req.body;

        if (!fullName || !username || !email || !department || !password) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        // Check if username or email already exists
        const [existing] = await db.query(
            'SELECT user_id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }

        // Hash password with bcrypt
        const hashedPassword = await hashPassword(password);

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, full_name, role, phone, department) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, fullName, 'student', phone, department]
        );

        res.status(201).json({
            message: 'Registration successful',
            user_id: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// ============================================
// TICKET ROUTES
// ============================================

// Get all tickets (Admin/Staff) or user's tickets (Student)
app.get('/api/tickets', async (req, res) => {
    try {
        const { role, user_id, status } = req.query;

        let query = `
            SELECT 
                t.*,
                c.category_name,
                c.assigned_team,
                s.full_name AS student_name,
                s.email AS student_email,
                s.department AS student_department,
                staff.full_name AS assigned_staff_name
            FROM tickets t
            LEFT JOIN users s ON t.student_id = s.user_id
            LEFT JOIN users staff ON t.assigned_to = staff.user_id
            LEFT JOIN categories c ON t.category_id = c.category_id
        `;

        const params = [];

        // Filter based on role
        if (role === 'student' && user_id) {
            query += ' WHERE t.student_id = ?';
            params.push(user_id);
        } else if (role === 'staff' && user_id) {
            query += ' WHERE t.assigned_to = ?';
            params.push(user_id);
        }

        // Additional status filter
        if (status) {
            query += params.length > 0 ? ' AND t.status = ?' : ' WHERE t.status = ?';
            params.push(status);
        }

        query += ' ORDER BY t.created_at DESC';

        const [tickets] = await db.query(query, params);
        res.json(tickets);
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ message: 'Error fetching tickets' });
    }
});

// Get single ticket by ID
app.get('/api/tickets/:id', async (req, res) => {
    try {
        const [tickets] = await db.query(
            `SELECT 
                t.*,
                c.category_name,
                c.assigned_team,
                s.full_name AS student_name,
                s.email AS student_email,
                s.phone AS student_phone,
                s.department AS student_department,
                staff.full_name AS assigned_staff_name,
                staff.email AS assigned_staff_email
            FROM tickets t
            LEFT JOIN users s ON t.student_id = s.user_id
            LEFT JOIN users staff ON t.assigned_to = staff.user_id
            LEFT JOIN categories c ON t.category_id = c.category_id
            WHERE t.ticket_id = ?`,
            [req.params.id]
        );

        if (tickets.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Get ticket history
        const [history] = await db.query(
            `SELECT 
                th.*,
                u.full_name AS changed_by_name
            FROM ticket_history th
            LEFT JOIN users u ON th.changed_by = u.user_id
            WHERE th.ticket_id = ?
            ORDER BY th.created_at DESC`,
            [req.params.id]
        );

        res.json({
            ticket: tickets[0],
            history: history
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ message: 'Error fetching ticket details' });
    }
});

// Create new ticket
app.post('/api/tickets', upload.single('photo'), async (req, res) => {
    try {
        const { student_id, title, category_id, priority, location, description } = req.body;

        if (!student_id || !title || !category_id || !location || !description) {
            return res.status(400).json({ message: 'All required fields must be filled' });
        }

        const ticketNumber = generateTicketNumber();
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const [result] = await db.query(
            `INSERT INTO tickets 
            (ticket_number, student_id, category_id, title, description, location, photo_url, priority, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ticketNumber, student_id, category_id, title, description, location, photoUrl, priority || 'medium', 'submitted']
        );

        // Add to history
        await db.query(
            'INSERT INTO ticket_history (ticket_id, changed_by, new_status, notes) VALUES (?, ?, ?, ?)',
            [result.insertId, student_id, 'submitted', 'Ticket created']
        );

        res.status(201).json({
            message: 'Ticket created successfully',
            ticket_id: result.insertId,
            ticket_number: ticketNumber
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ message: 'Error creating ticket' });
    }
});

// Update ticket status (Staff)
app.put('/api/tickets/:id/update', async (req, res) => {
    try {
        const { status, notes, resolution_notes, staff_id } = req.body;
        const ticketId = req.params.id;

        if (!status || !notes || !staff_id) {
            return res.status(400).json({ message: 'Status, notes, and staff_id are required' });
        }

        // Get old status
        const [oldTicket] = await db.query('SELECT status FROM tickets WHERE ticket_id = ?', [ticketId]);
        
        if (oldTicket.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Update ticket
        let updateQuery = 'UPDATE tickets SET status = ?, updated_at = NOW()';
        const params = [status];

        if (status === 'resolved') {
            updateQuery += ', resolution_notes = ?, resolved_at = NOW()';
            params.push(resolution_notes || notes);
        }

        updateQuery += ' WHERE ticket_id = ?';
        params.push(ticketId);

        await db.query(updateQuery, params);

        // Add to history
        await db.query(
            'INSERT INTO ticket_history (ticket_id, changed_by, old_status, new_status, notes) VALUES (?, ?, ?, ?, ?)',
            [ticketId, staff_id, oldTicket[0].status, status, notes]
        );

        res.json({ message: 'Ticket updated successfully' });
    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({ message: 'Error updating ticket' });
    }
});

// Assign ticket to staff (Admin)
app.put('/api/tickets/:id/assign', async (req, res) => {
    try {
        const { staff_id } = req.body;
        const ticketId = req.params.id;

        if (!staff_id) {
            return res.status(400).json({ message: 'Staff ID is required' });
        }

        // Get old status
        const [oldTicket] = await db.query('SELECT status, assigned_to FROM tickets WHERE ticket_id = ?', [ticketId]);
        
        if (oldTicket.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Update ticket
        await db.query(
            'UPDATE tickets SET assigned_to = ?, status = ?, updated_at = NOW() WHERE ticket_id = ?',
            [staff_id, 'assigned', ticketId]
        );

        // Add to history
        await db.query(
            'INSERT INTO ticket_history (ticket_id, changed_by, old_status, new_status, notes) VALUES (?, ?, ?, ?, ?)',
            [ticketId, staff_id, oldTicket[0].status, 'assigned', 'Ticket assigned to staff member']
        );

        res.json({ message: 'Ticket assigned successfully' });
    } catch (error) {
        console.error('Assign ticket error:', error);
        res.status(500).json({ message: 'Error assigning ticket' });
    }
});

// ============================================
// USER ROUTES
// ============================================

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
    try {
        const { role } = req.query;

        let query = 'SELECT user_id, username, email, full_name, role, phone, department, created_at FROM users';
        const params = [];

        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }

        query += ' ORDER BY created_at DESC';

        const [users] = await db.query(query, params);
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Get staff members (for assignment)
app.get('/api/users/staff', async (req, res) => {
    try {
        const [staff] = await db.query(
            'SELECT user_id, full_name, department FROM users WHERE role = ? ORDER BY full_name',
            ['staff']
        );
        res.json(staff);
    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({ message: 'Error fetching staff' });
    }
});

// ============================================
// CATEGORY ROUTES
// ============================================

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE is_active = 1 ORDER BY category_name'
        );
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

// ============================================
// STATISTICS ROUTES
// ============================================

// Get dashboard statistics
app.get('/api/stats/dashboard', async (req, res) => {
    try {
        const { role, user_id } = req.query;

        let stats = {};

        if (role === 'admin') {
            // Admin stats
            const [ticketStats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ('submitted', 'assigned', 'in_progress') THEN 1 ELSE 0 END) as open,
                    SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved,
                    SUM(CASE WHEN priority = 'urgent' AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as urgent
                FROM tickets
            `);

            const [userStats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
                    SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) as staff
                FROM users
            `);

            stats = {
                tickets: ticketStats[0],
                users: userStats[0]
            };
        } else if (role === 'staff' && user_id) {
            // Staff stats
            const [staffStats] = await db.query(`
                SELECT 
                    COUNT(*) as assigned,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'resolved' AND DATE(resolved_at) = CURDATE() THEN 1 ELSE 0 END) as resolved_today,
                    SUM(CASE WHEN priority = 'urgent' AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as urgent
                FROM tickets
                WHERE assigned_to = ?
            `, [user_id]);

            stats = staffStats[0];
        } else if (role === 'student' && user_id) {
            // Student stats
            const [studentStats] = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ('submitted', 'assigned', 'in_progress') THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
                FROM tickets
                WHERE student_id = ?
            `, [user_id]);

            stats = studentStats[0];
        }

        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
});

// Catch-all route - serve index.html for all non-API routes
// (Removed to avoid Express 5.x path pattern error - static files will be served directly)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Campus Connect server running on http://localhost:${PORT}`);
    console.log(`📡 Network access: http://YOUR_IP_ADDRESS:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
    console.log(`📂 Upload directory: ${path.join(__dirname, 'public/uploads')}`);
});
