<?php
require 'config.php';
$pageTitle = 'Add Student';

$errors = [];
$old = ['name' => '', 'roll' => '', 'email' => '', 'phone' => '', 'department' => '', 'session' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $old['name'] = trim($_POST['name'] ?? '');
    $old['roll'] = trim($_POST['roll'] ?? '');
    $old['email'] = trim($_POST['email'] ?? '');
    $old['phone'] = trim($_POST['phone'] ?? '');
    $old['department'] = trim($_POST['department'] ?? '');
    $old['session'] = trim($_POST['session'] ?? '');

    if ($old['name'] === '') $errors[] = 'Name is required.';
    if ($old['roll'] === '') $errors[] = 'Roll number is required.';
    if ($old['email'] === '' || !filter_var($old['email'], FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email is required.';
    if ($old['department'] === '') $errors[] = 'Department is required.';

    if (empty($errors)) {
        $stmt = $conn->prepare("INSERT INTO students (name, roll, email, phone, department, session) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param('ssssss', $old['name'], $old['roll'], $old['email'], $old['phone'], $old['department'], $old['session']);
        if ($stmt->execute()) {
            flash('success', 'Student added successfully.');
            header('Location: index.php');
            exit;
        } else {
            $errors[] = 'Database error: ' . $conn->error;
        }
    }
}

require 'includes/header.php';
?>

<div class="d-flex align-items-center gap-2 mb-3">
    <a href="index.php" class="btn btn-icon btn-outline-secondary"><i class="fa-solid fa-arrow-left"></i></a>
    <h5 class="mb-0 fw-semibold">Add New Student</h5>
</div>

<div class="card card-soft p-4">
    <?php if (!empty($errors)): ?>
        <div class="alert alert-danger border-0 rounded-3">
            <ul class="mb-0 ps-3">
                <?php foreach ($errors as $e): ?><li><?php echo htmlspecialchars($e); ?></li><?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <form method="POST" action="create.php" novalidate>
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Full Name</label>
                <input type="text" name="name" class="form-control" value="<?php echo htmlspecialchars($old['name']); ?>" placeholder="e.g. Rahim Uddin">
            </div>
            <div class="col-md-6">
                <label class="form-label">Roll Number</label>
                <input type="text" name="roll" class="form-control" value="<?php echo htmlspecialchars($old['roll']); ?>" placeholder="e.g. 2021-01-045">
            </div>
            <div class="col-md-6">
                <label class="form-label">Email</label>
                <input type="email" name="email" class="form-control" value="<?php echo htmlspecialchars($old['email']); ?>" placeholder="name@example.com">
            </div>
            <div class="col-md-6">
                <label class="form-label">Phone</label>
                <input type="text" name="phone" class="form-control" value="<?php echo htmlspecialchars($old['phone']); ?>" placeholder="01XXXXXXXXX">
            </div>
            <div class="col-md-6">
                <label class="form-label">Department</label>
                <input type="text" name="department" class="form-control" value="<?php echo htmlspecialchars($old['department']); ?>" placeholder="e.g. Computer Science">
            </div>
            <div class="col-md-6">
                <label class="form-label">Session</label>
                <input type="text" name="session" class="form-control" value="<?php echo htmlspecialchars($old['session']); ?>" placeholder="e.g. 2020-21">
            </div>
        </div>

        <div class="mt-4 d-flex gap-2">
            <button type="submit" class="btn btn-brand px-4"><i class="fa-solid fa-check me-1"></i> Save Student</button>
            <a href="index.php" class="btn btn-outline-secondary px-4">Cancel</a>
        </div>
    </form>
</div>

<?php require 'includes/footer.php'; ?>
