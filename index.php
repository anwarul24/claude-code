<?php
require 'config.php';
$pageTitle = 'All Students';

// Search
$search = isset($_GET['q']) ? trim($_GET['q']) : '';
$where = '';
$params = [];
$types = '';

if ($search !== '') {
    $where = "WHERE name LIKE ? OR roll LIKE ? OR email LIKE ? OR department LIKE ?";
    $like = "%$search%";
    $params = [$like, $like, $like, $like];
    $types = 'ssss';
}

$sql = "SELECT * FROM students $where ORDER BY id DESC";
$stmt = $conn->prepare($sql);
if ($params) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();
$students = $result->fetch_all(MYSQLI_ASSOC);

$total = $conn->query("SELECT COUNT(*) c FROM students")->fetch_assoc()['c'];
$deptCount = $conn->query("SELECT COUNT(DISTINCT department) c FROM students")->fetch_assoc()['c'];

require 'includes/header.php';
?>

<div class="row g-3 mt-1 mb-4">
    <div class="col-md-4">
        <div class="card stat-card p-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="small opacity-75">Total Students</div>
                    <div class="fs-3 fw-bold"><?php echo $total; ?></div>
                </div>
                <i class="fa-solid fa-users fa-2x opacity-75"></i>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card card-soft p-3">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <div class="small text-muted">Departments</div>
                    <div class="fs-3 fw-bold text-dark"><?php echo $deptCount; ?></div>
                </div>
                <i class="fa-solid fa-building-columns fa-2x text-secondary opacity-50"></i>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card card-soft p-3 d-flex justify-content-center">
            <a href="create.php" class="btn btn-brand w-100 py-2 fw-semibold">
                <i class="fa-solid fa-plus me-1"></i> Add New Student
            </a>
        </div>
    </div>
</div>

<div class="card card-soft p-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h5 class="mb-0 fw-semibold"><i class="fa-solid fa-list me-2 text-primary"></i>Student Records</h5>
        <form class="d-flex" method="GET" action="index.php">
            <input type="text" name="q" class="form-control search-box me-2" placeholder="Search name, roll, email..." value="<?php echo htmlspecialchars($search); ?>">
            <button class="btn btn-outline-secondary" type="submit"><i class="fa-solid fa-search"></i></button>
        </form>
    </div>

    <?php if (empty($students)): ?>
        <div class="empty-state">
            <i class="fa-solid fa-inbox fa-3x mb-3"></i>
            <p class="mb-0">No students found<?php echo $search ? ' for "' . htmlspecialchars($search) . '"' : ''; ?>.</p>
        </div>
    <?php else: ?>
    <div class="table-responsive">
        <table class="table table-modern align-middle mb-0">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Roll</th>
                    <th>Department</th>
                    <th>Contact</th>
                    <th>Session</th>
                    <th class="text-end">Actions</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($students as $i => $s): ?>
                <tr>
                    <td class="text-muted"><?php echo $i + 1; ?></td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <div class="avatar-circle"><?php echo strtoupper(substr($s['name'], 0, 1)); ?></div>
                            <div>
                                <div class="fw-semibold"><?php echo htmlspecialchars($s['name']); ?></div>
                                <div class="small text-muted"><?php echo htmlspecialchars($s['email']); ?></div>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge badge-soft px-2 py-1"><?php echo htmlspecialchars($s['roll']); ?></span></td>
                    <td><?php echo htmlspecialchars($s['department']); ?></td>
                    <td><?php echo htmlspecialchars($s['phone'] ?: '—'); ?></td>
                    <td><?php echo htmlspecialchars($s['session'] ?: '—'); ?></td>
                    <td class="text-end">
                        <a href="edit.php?id=<?php echo $s['id']; ?>" class="btn btn-sm btn-icon btn-outline-primary" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </a>
                        <a href="delete.php?id=<?php echo $s['id']; ?>" class="btn btn-sm btn-icon btn-outline-danger confirm-delete" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </a>
                    </td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<script>
document.querySelectorAll('.confirm-delete').forEach(function (link) {
    link.addEventListener('click', function (e) {
        if (!confirm('Are you sure you want to delete this student? This cannot be undone.')) {
            e.preventDefault();
        }
    });
});
</script>

<?php require 'includes/footer.php'; ?>
