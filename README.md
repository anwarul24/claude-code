# Student Management System — PHP + MySQL + Bootstrap 5 CRUD

A stylish, ready-to-run CRUD app: Create, Read, Update, Delete student records.

## Setup (XAMPP / local server)

1. Copy the `php-crud-app` folder into `htdocs` (XAMPP) or your PHP server's web root.
2. Start Apache and MySQL from your control panel.
3. Import the database:
   - Open phpMyAdmin → **Import** → choose `database.sql` → Go
   - OR via terminal: `mysql -u root -p < database.sql`
4. Check `config.php` — default XAMPP credentials (`root` / no password) are already set.
   If your MySQL user/password differ, update `DB_USER` and `DB_PASS` there.
5. Visit `http://localhost/php-crud-app/` in your browser.

## Features

- Add, edit, delete, and list students
- Live search by name / roll / email / department
- Form validation with error messages
- Flash success/error alerts
- Responsive, gradient-themed Bootstrap 5 UI with Font Awesome icons
- Prepared statements (mysqli) throughout — protected against SQL injection

## File structure

```
php-crud-app/
├── config.php          # DB connection + session/flash helpers
├── database.sql        # Schema + sample data
├── index.php           # List + search (Read)
├── create.php           # Add student (Create)
├── edit.php             # Edit student (Update)
├── delete.php            # Delete student (Delete)
└── includes/
    ├── header.php       # Navbar + shared styles
    └── footer.php
```

## Notes

- Table: `students` (name, roll, email, phone, department, session)
- To rename the entity (e.g. "Products" instead of "Students"), rename the table/columns in `database.sql` and update field names across the PHP files.
