-- Database: student_crud
-- Import this file first (phpMyAdmin > Import, or `mysql -u root -p < database.sql`)

CREATE DATABASE IF NOT EXISTS student_crud CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_crud;

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll VARCHAR(30) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    department VARCHAR(100) NOT NULL,
    session VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Sample rows
INSERT INTO students (name, roll, email, phone, department, session) VALUES
('Rahim Uddin', '2021-01-045', 'rahim.uddin@example.com', '01711000001', 'Computer Science', '2020-21'),
('Karima Begum', '2021-02-112', 'karima.begum@example.com', '01711000002', 'B.Ed', '2020-21'),
('Sadia Islam', '2021-01-078', 'sadia.islam@example.com', '01711000003', 'English', '2021-22');
