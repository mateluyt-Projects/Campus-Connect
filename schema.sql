-- =======================================================
-- Campus Connect - Complete Database Schema & Seed Data
-- =======================================================

-- 1. Create and select the database
CREATE DATABASE IF NOT EXISTS campus_connect
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE campus_connect;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'staff', 'admin') NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    assigned_team VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    student_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(200) NOT NULL,
    photo_url VARCHAR(255) DEFAULT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('submitted', 'assigned', 'in_progress', 'resolved', 'closed') DEFAULT 'submitted',
    assigned_to INT DEFAULT NULL,
    resolution_notes TEXT DEFAULT NULL,
    student_feedback TEXT DEFAULT NULL,
    student_rating INT DEFAULT NULL CHECK (student_rating >= 1 AND student_rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_student (student_id),
    INDEX idx_tickets_assigned (assigned_to),
    INDEX idx_tickets_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Ticket History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS ticket_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    changed_by INT NOT NULL,
    old_status ENUM('submitted', 'assigned', 'in_progress', 'resolved', 'closed') DEFAULT NULL,
    new_status ENUM('submitted', 'assigned', 'in_progress', 'resolved', 'closed') NOT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_history_ticket (ticket_id),
    INDEX idx_history_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- Sample Seed Data
-- =======================================================

-- Categories Seed Data
INSERT INTO categories (category_id, category_name, description, assigned_team, is_active) VALUES
(1, 'Infrastructure', 'Building maintenance, structural issues, furniture repairs', 'Maintenance Team', 1),
(2, 'Electrical', 'Power outages, faulty sockets, lighting issues, generator support', 'Electrical Team', 1),
(3, 'Plumbing', 'Water leaks, broken taps, washroom issues, drainage blockage', 'Plumbing Team', 1),
(4, 'Cleanliness', 'Campus waste management, cleaning, washroom hygiene', 'Housekeeping Team', 1),
(5, 'IT & Network', 'WiFi outages, lab equipment, ethernet, smartboard issues', 'IT Support Team', 1),
(6, 'Safety & Security', 'Campus security concerns, access gate issues, emergency lights', 'Security Team', 1),
(7, 'Classroom', 'Classroom projectors, seating, whiteboards, air conditioning', 'Facilities Team', 1),
(8, 'Hostel', 'Hostel rooms, mess, laundry facilities, residential concerns', 'Hostel Management', 1),
(9, 'Transport', 'College bus schedule, parking lot management, driver assistance', 'Transport Team', 1),
(10, 'Other', 'General campus feedback, miscellaneous suggestions', 'Admin Support Team', 1)
ON DUPLICATE KEY UPDATE 
    category_name = VALUES(category_name),
    description = VALUES(description),
    assigned_team = VALUES(assigned_team);

-- Demo Accounts Seed Data
-- Passwords supported: plain-text fallback 'admin123', 'staff123', 'student123'
INSERT INTO users (user_id, username, email, password, full_name, role, department, phone) VALUES
(1, 'admin', 'admin@campusconnect.edu', 'admin123', 'System Administrator', 'admin', 'IT Department', '9876543200'),
(2, 'staff1', 'staff1@campusconnect.edu', 'staff123', 'Rajesh Kumar', 'staff', 'Maintenance Team', '9876543210'),
(3, 'staff2', 'staff2@campusconnect.edu', 'staff123', 'Priya Sharma', 'staff', 'IT Support', '9876543211'),
(4, 'student1', 'student1@campusconnect.edu', 'student123', 'Amit Patel', 'student', 'Computer Science', '9876543220'),
(5, 'student2', 'student2@campusconnect.edu', 'student123', 'Sneha Reddy', 'student', 'Electronics', '9876543221')
ON DUPLICATE KEY UPDATE 
    email = VALUES(email),
    full_name = VALUES(full_name),
    role = VALUES(role),
    department = VALUES(department);
