-- Campus Connect Database Schema
-- Run this in phpMyAdmin SQL tab after selecting campus_connect database

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS ticket_history;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 1. Users Table (Students, Staff, Admin)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'staff', 'admin') NOT NULL,
    phone VARCHAR(15),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Categories Table (Issue Types)
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    assigned_team VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tickets Table (Issue Reports)
CREATE TABLE tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    student_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(200),
    photo_url VARCHAR(255),
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('submitted', 'assigned', 'in_progress', 'resolved', 'closed') DEFAULT 'submitted',
    assigned_to INT,
    resolution_notes TEXT,
    student_feedback TEXT,
    student_rating INT CHECK (student_rating >= 1 AND student_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_student (student_id),
    INDEX idx_assigned (assigned_to),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Ticket History Table (Status Change Tracking)
CREATE TABLE ticket_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    changed_by INT NOT NULL,
    old_status ENUM('submitted', 'assigned', 'in_progress', 'resolved', 'closed'),
    new_status ENUM('submitted', 'assigned', 'in_progress', 'resolved', 'closed') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Default Admin User (password: admin123)
-- Password is hashed using bcrypt - you'll implement proper hashing in Node.js
INSERT INTO users (username, email, password, full_name, role, department) VALUES
('admin', 'admin@campusconnect.edu', 'admin123', 'System Administrator', 'admin', 'IT Department');

-- Insert Sample Categories
INSERT INTO categories (category_name, description, assigned_team) VALUES
('Infrastructure', 'Building maintenance, structural issues', 'Maintenance Team'),
('Electrical', 'Power outages, electrical faults', 'Electrical Team'),
('Plumbing', 'Water leaks, drainage issues', 'Plumbing Team'),
('Cleanliness', 'Cleaning, waste management', 'Housekeeping Team'),
('IT & Network', 'WiFi issues, lab equipment', 'IT Team'),
('Safety & Security', 'Security concerns, access issues', 'Security Team'),
('Classroom', 'Furniture, projectors, AC/fans', 'Facilities Team'),
('Hostel', 'Hostel-related issues', 'Hostel Management'),
('Transport', 'Bus service, parking issues', 'Transport Team'),
('Other', 'General issues and suggestions', 'Admin Team');

-- Insert Sample Staff Users for Testing
INSERT INTO users (username, email, password, full_name, role, department, phone) VALUES
('staff1', 'staff1@campusconnect.edu', 'staff123', 'Rajesh Kumar', 'staff', 'Maintenance', '9876543210'),
('staff2', 'staff2@campusconnect.edu', 'staff123', 'Priya Sharma', 'staff', 'IT', '9876543211');

-- Insert Sample Student Users for Testing
INSERT INTO users (username, email, password, full_name, role, department, phone) VALUES
('student1', 'student1@campusconnect.edu', 'student123', 'Amit Patel', 'student', 'Computer Science', '9876543220'),
('student2', 'student2@campusconnect.edu', 'student123', 'Sneha Reddy', 'student', 'Electronics', '9876543221');

-- Create a view for ticket overview with user details
CREATE VIEW ticket_overview AS
SELECT 
    t.ticket_id,
    t.ticket_number,
    t.title,
    t.description,
    t.location,
    t.photo_url,
    t.priority,
    t.status,
    t.created_at,
    t.updated_at,
    t.resolved_at,
    c.category_name,
    c.assigned_team,
    s.full_name AS student_name,
    s.email AS student_email,
    s.phone AS student_phone,
    s.department AS student_department,
    staff.full_name AS assigned_staff_name,
    staff.email AS assigned_staff_email,
    t.resolution_notes,
    t.student_feedback,
    t.student_rating
FROM tickets t
LEFT JOIN users s ON t.student_id = s.user_id
LEFT JOIN users staff ON t.assigned_to = staff.user_id
LEFT JOIN categories c ON t.category_id = c.category_id;

-- Success message
SELECT '✅ Database schema created successfully!' AS message;
SELECT '📊 Sample data inserted: 1 admin, 2 staff, 2 students, 10 categories' AS info;
SELECT '🔐 Default Login: username=admin, password=admin123' AS credentials;
