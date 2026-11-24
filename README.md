# College Management System

A web-based college management system with role-based dashboards for Admin, Staff, and Students.

## Features
- User authentication and authorization
- Admin dashboard for system management
- Staff dashboard for faculty operations
- Student dashboard for student activities
- File upload functionality

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit the `.env` file with your database credentials:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME

### 3. Setup Database
Create a MySQL database named `college_management` and run the SQL schema (to be added).

### 4. Run the Application
```bash
npm start
```

The server will run on `http://localhost:3000`

## Tech Stack
- Backend: Node.js, Express.js
- Database: MySQL
- Frontend: HTML, CSS, JavaScript
- File Upload: Multer

## Project Structure
```
├── server.js           # Main server file
├── db.js              # Database connection
├── public/            # Static files
│   ├── index.html
│   ├── admin-dashboard.html
│   ├── staff-dashboard.html
│   ├── student-dashboard.html
│   ├── css/
│   ├── js/
│   └── uploads/
└── package.json
```

## Default Users
(To be added after database setup)

## License
ISC
