<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo isset($pageTitle) ? $pageTitle . ' - Student MS' : 'Student Management System'; ?></title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
    :root {
        --brand-1: #4f46e5;
        --brand-2: #7c3aed;
        --bg-soft: #f5f6fb;
    }
    body {
        font-family: 'Poppins', sans-serif;
        background: var(--bg-soft);
        color: #1f2333;
    }
    .navbar-brand {
        font-weight: 700;
        letter-spacing: .3px;
    }
    .navbar-gradient {
        background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
    }
    .page-wrap {
        max-width: 1140px;
        margin: 0 auto;
        padding: 2rem 1rem 4rem;
    }
    .card-soft {
        border: none;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(79, 70, 229, .08);
    }
    .stat-card {
        border-radius: 16px;
        border: none;
        color: #fff;
        background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
    }
    .table-modern thead {
        background: #eef0fc;
    }
    .table-modern th {
        font-weight: 600;
        color: #4b4f66;
        border: none;
    }
    .table-modern td {
        vertical-align: middle;
        border-color: #eef0f7;
    }
    .table-modern tbody tr {
        transition: background .15s ease;
    }
    .table-modern tbody tr:hover {
        background: #f8f8ff;
    }
    .avatar-circle {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: .85rem;
    }
    .btn-brand {
        background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
        border: none;
        color: #fff;
    }
    .btn-brand:hover {
        opacity: .92;
        color: #fff;
    }
    .btn-icon {
        width: 34px;
        height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
    }
    .form-label {
        font-weight: 500;
        color: #4b4f66;
    }
    .form-control:focus, .form-select:focus {
        border-color: var(--brand-1);
        box-shadow: 0 0 0 .2rem rgba(79, 70, 229, .15);
    }
    .badge-soft {
        background: #eef0fc;
        color: var(--brand-1);
        font-weight: 500;
    }
    .search-box {
        border-radius: 12px;
    }
    .empty-state {
        padding: 4rem 1rem;
        text-align: center;
        color: #8b8fa3;
    }
</style>
</head>
<body>

<nav class="navbar navbar-dark navbar-gradient shadow-sm">
    <div class="container page-wrap py-2 px-1">
        <a class="navbar-brand" href="index.php">
            <i class="fa-solid fa-graduation-cap me-2"></i>Student Management System
        </a>
    </div>
</nav>

<div class="page-wrap">
<?php $flash = get_flash(); ?>
<?php if ($flash): ?>
    <div class="alert alert-<?php echo $flash['type'] === 'error' ? 'danger' : 'success'; ?> alert-dismissible fade show shadow-sm border-0 rounded-3 mt-4" role="alert">
        <i class="fa-solid <?php echo $flash['type'] === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'; ?> me-2"></i>
        <?php echo htmlspecialchars($flash['message']); ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php endif; ?>
