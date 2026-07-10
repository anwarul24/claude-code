<?php
require 'config.php';

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id > 0) {
    $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
    $stmt->bind_param('i', $id);
    if ($stmt->execute()) {
        flash('success', 'Student deleted successfully.');
    } else {
        flash('error', 'Could not delete student: ' . $conn->error);
    }
} else {
    flash('error', 'Invalid student ID.');
}

header('Location: index.php');
exit;
