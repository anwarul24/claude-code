/**
 * ==========================================================================
 * app.js — Students Management CRUD (GitHub REST API as database)
 * Vanilla ES6, Fetch API, Bootstrap 5 UI. No frameworks.
 * ==========================================================================
 */

"use strict";

/* ----------------------------------------------------------------------
 * State
 * ---------------------------------------------------------------------- */
const state = {
  students: [],       // full list loaded from database.json
  dbSha: null,         // current sha of students/database.json (null if file doesn't exist yet)
  filtered: [],         // list currently rendered (after search filter)
  editingRoll: null,     // roll of the student being edited (null when adding)
  pendingPhotoFile: null,  // File object selected in the form, or null
  photoRemoved: false,    // true if user is clearing the photo on edit
  deleteTarget: null,     // student object queued for deletion
};

/* ----------------------------------------------------------------------
 * DOM references
 * ---------------------------------------------------------------------- */
const els = {
  tableBody: document.getElementById("studentsTableBody"),
  emptyState: document.getElementById("emptyState"),
  noResultsState: document.getElementById("noResultsState"),
  searchInput: document.getElementById("searchInput"),
  statTotal: document.getElementById("statTotal"),
  syncDot: document.querySelector(".sync-dot"),
  syncText: document.getElementById("syncStatusText"),
  btnRefresh: document.getElementById("btnRefresh"),

  loadingOverlay: document.getElementById("loadingOverlay"),
  loadingText: document.getElementById("loadingText"),
  toastContainer: document.getElementById("toastContainer"),

  studentModalEl: document.getElementById("studentModal"),
  studentModalTitle: document.getElementById("studentModalTitle"),
  studentForm: document.getElementById("studentForm"),
  originalRoll: document.getElementById("originalRoll"),
  existingPhotoPath: document.getElementById("existingPhotoPath"),
  nameInput: document.getElementById("nameInput"),
  rollInput: document.getElementById("rollInput"),
  classInput: document.getElementById("classInput"),
  photoInput: document.getElementById("photoInput"),
  photoPreview: document.getElementById("photoPreview"),
  photoPreviewPlaceholder: document.getElementById("photoPreviewPlaceholder"),
  photoError: document.getElementById("photoError"),
  btnSaveStudent: document.getElementById("btnSaveStudent"),
  btnAddStudent: document.getElementById("btnAddStudent"),

  deleteModalEl: document.getElementById("deleteModal"),
  deleteStudentName: document.getElementById("deleteStudentName"),
  deleteStudentRoll: document.getElementById("deleteStudentRoll"),
  btnConfirmDelete: document.getElementById("btnConfirmDelete"),
};

const studentModal = new bootstrap.Modal(els.studentModalEl);
const deleteModal = new bootstrap.Modal(els.deleteModalEl);

/* ----------------------------------------------------------------------
 * GitHub REST API helpers
 * ---------------------------------------------------------------------- */

/**
 * Low level wrapper around fetch() for the GitHub Contents API.
 * Adds auth headers and normalizes error handling.
 */
async function githubFetch(url, options = {}) {
  const headers = {
    Authorization: `Bearer ${CONFIG.TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkErr) {
    throw new Error("Network error: could not reach GitHub API. Check your internet connection.");
  }

  if (response.status === 401) {
    throw new Error("GitHub authentication failed. Check the token in config.js.");
  }
  if (response.status === 403) {
    const body = await safeJson(response);
    throw new Error(body?.message || "GitHub API rate limit or permission denied.");
  }

  return response;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Get a file's content + sha from the repo. Returns null if the file
 * does not exist (404), so callers can distinguish "empty" from "error".
 */
async function getFile(path) {
  const url = `${CONFIG.API_BASE}/repos/${CONFIG.OWNER}/${CONFIG.REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${CONFIG.BRANCH}`;
  const res = await githubFetch(url, { method: "GET" });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.message || `Failed to fetch ${path} (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    sha: data.sha,
    // GitHub returns base64 content, possibly with embedded newlines
    contentBase64: (data.content || "").replace(/\n/g, ""),
  };
}

/**
 * Create or update a file's content in the repo.
 * @param {string} path - repo path
 * @param {string} base64Content - base64-encoded file content
 * @param {string} message - commit message
 * @param {string|null} sha - existing file's sha (omit for new files)
 */
async function putFile(path, base64Content, message, sha = null) {
  const url = `${CONFIG.API_BASE}/repos/${CONFIG.OWNER}/${CONFIG.REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  const payload = {
    message,
    content: base64Content,
    branch: CONFIG.BRANCH,
  };
  if (sha) payload.sha = sha;

  const res = await githubFetch(url, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await safeJson(res);
    throw new Error(body?.message || `Failed to save ${path} (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Delete a file from the repo. Silently ignores 404 (already gone).
 */
async function deleteFile(path, sha, message) {
  const url = `${CONFIG.API_BASE}/repos/${CONFIG.OWNER}/${CONFIG.REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  const res = await githubFetch(url, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch: CONFIG.BRANCH }),
  });

  if (!res.ok && res.status !== 404) {
    const body = await safeJson(res);
    throw new Error(body?.message || `Failed to delete ${path} (HTTP ${res.status})`);
  }
}

/* ----------------------------------------------------------------------
 * Base64 / text helpers (UTF-8 safe)
 * ---------------------------------------------------------------------- */
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

/** Read a File object as a base64 string (no data: prefix). */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read the selected image file."));
    reader.readAsDataURL(file);
  });
}

function rawImageUrl(path) {
  return `https://raw.githubusercontent.com/${CONFIG.OWNER}/${CONFIG.REPO}/${CONFIG.BRANCH}/${path}?t=${Date.now()}`;
}

/* ----------------------------------------------------------------------
 * Database (students/database.json) load / save
 * ---------------------------------------------------------------------- */

async function loadStudents() {
  setLoading(true, "Loading students from GitHub…");
  try {
    const file = await getFile(CONFIG.DATA_PATH);
    if (file === null) {
      // Database file doesn't exist yet — treat as empty registry.
      state.students = [];
      state.dbSha = null;
    } else {
      const jsonText = base64ToUtf8(file.contentBase64).trim();
      state.students = jsonText ? JSON.parse(jsonText) : [];
      state.dbSha = file.sha;
    }
    setSyncStatus(true);
    applySearchFilter();
  } catch (err) {
    setSyncStatus(false);
    showToast("error", "Failed to load registry", err.message);
  } finally {
    setLoading(false);
  }
}

/**
 * Persist the current state.students array back to database.json.
 * Updates state.dbSha with the new sha returned by GitHub.
 */
async function saveDatabase(commitMessage) {
  const jsonText = JSON.stringify(state.students, null, 2);
  const base64Content = utf8ToBase64(jsonText);
  const result = await putFile(CONFIG.DATA_PATH, base64Content, commitMessage, state.dbSha);
  state.dbSha = result?.content?.sha || state.dbSha;
}

/* ----------------------------------------------------------------------
 * Rendering
 * ---------------------------------------------------------------------- */

function renderTable(list) {
  els.tableBody.innerHTML = "";

  const hasAnyStudents = state.students.length > 0;
  els.emptyState.classList.toggle("d-none", hasAnyStudents);
  els.noResultsState.classList.toggle("d-none", !hasAnyStudents || list.length > 0);
  els.tableBody.parentElement.parentElement.classList.toggle("d-none", !hasAnyStudents || list.length === 0);

  els.statTotal.textContent = state.students.length;

  for (const student of list) {
    const tr = document.createElement("tr");

    // Photo cell
    const tdPhoto = document.createElement("td");
    if (student.photo) {
      const img = document.createElement("img");
      img.src = rawImageUrl(student.photo);
      img.alt = student.name;
      img.className = "id-avatar";
      img.onerror = () => { img.replaceWith(makeAvatarPlaceholder()); };
      tdPhoto.appendChild(img);
    } else {
      tdPhoto.appendChild(makeAvatarPlaceholder());
    }
    tr.appendChild(tdPhoto);

    // Name
    const tdName = document.createElement("td");
    tdName.innerHTML = `<span class="student-name">${escapeHtml(student.name)}</span>`;
    tr.appendChild(tdName);

    // Roll
    const tdRoll = document.createElement("td");
    tdRoll.innerHTML = `<span class="roll-badge">${escapeHtml(student.roll)}</span>`;
    tr.appendChild(tdRoll);

    // Class
    const tdClass = document.createElement("td");
    tdClass.innerHTML = `<span class="class-tag">${escapeHtml(student.class)}</span>`;
    tr.appendChild(tdClass);

    // Actions
    const tdActions = document.createElement("td");
    tdActions.className = "text-end";
    tdActions.innerHTML = `
      <button class="action-btn btn-edit" title="Edit"><i class="bi bi-pencil-fill"></i></button>
      <button class="action-btn danger btn-delete" title="Delete"><i class="bi bi-trash3-fill"></i></button>
    `;
    tdActions.querySelector(".btn-edit").addEventListener("click", () => openEditModal(student));
    tdActions.querySelector(".btn-delete").addEventListener("click", () => openDeleteModal(student));
    tr.appendChild(tdActions);

    els.tableBody.appendChild(tr);
  }
}

function makeAvatarPlaceholder() {
  const div = document.createElement("div");
  div.className = "id-avatar-placeholder";
  div.innerHTML = '<i class="bi bi-person-fill"></i>';
  return div;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

/* ----------------------------------------------------------------------
 * Search
 * ---------------------------------------------------------------------- */

function applySearchFilter() {
  const q = els.searchInput.value.trim().toLowerCase();
  state.filtered = !q
    ? state.students
    : state.students.filter((s) =>
        String(s.name).toLowerCase().includes(q) ||
        String(s.roll).toLowerCase().includes(q) ||
        String(s.class).toLowerCase().includes(q)
      );
  renderTable(state.filtered);
}

els.searchInput.addEventListener("input", applySearchFilter);
els.btnRefresh.addEventListener("click", loadStudents);

/* ----------------------------------------------------------------------
 * Add / Edit modal
 * ---------------------------------------------------------------------- */

els.btnAddStudent.addEventListener("click", () => openAddModal());

function resetForm() {
  els.studentForm.reset();
  els.studentForm.classList.remove("was-validated");
  [els.nameInput, els.rollInput, els.classInput].forEach((el) => el.classList.remove("is-invalid"));
  els.photoError.textContent = "";
  els.photoPreview.classList.add("d-none");
  els.photoPreviewPlaceholder.classList.remove("d-none");
  els.rollInput.disabled = false;
  state.pendingPhotoFile = null;
  state.photoRemoved = false;
  state.editingRoll = null;
  els.originalRoll.value = "";
  els.existingPhotoPath.value = "";
}

function openAddModal() {
  resetForm();
  els.studentModalTitle.textContent = "Add Student";
  studentModal.show();
}

function openEditModal(student) {
  resetForm();
  els.studentModalTitle.textContent = "Edit Student";
  state.editingRoll = student.roll;
  els.originalRoll.value = student.roll;
  els.existingPhotoPath.value = student.photo || "";

  els.nameInput.value = student.name;
  els.rollInput.value = student.roll;
  els.classInput.value = student.class;

  if (student.photo) {
    els.photoPreview.src = rawImageUrl(student.photo);
    els.photoPreview.classList.remove("d-none");
    els.photoPreviewPlaceholder.classList.add("d-none");
  }

  studentModal.show();
}

/* Live photo preview + client-side validation */
els.photoInput.addEventListener("change", () => {
  const file = els.photoInput.files[0];
  els.photoError.textContent = "";

  if (!file) {
    state.pendingPhotoFile = null;
    return;
  }

  if (!CONFIG.ALLOWED_PHOTO_TYPES.includes(file.type)) {
    els.photoError.textContent = "Only JPG or PNG images are allowed.";
    els.photoInput.value = "";
    state.pendingPhotoFile = null;
    return;
  }

  if (file.size > CONFIG.MAX_PHOTO_SIZE_BYTES) {
    els.photoError.textContent = "Image must be 2MB or smaller.";
    els.photoInput.value = "";
    state.pendingPhotoFile = null;
    return;
  }

  state.pendingPhotoFile = file;
  state.photoRemoved = false;

  const reader = new FileReader();
  reader.onload = (e) => {
    els.photoPreview.src = e.target.result;
    els.photoPreview.classList.remove("d-none");
    els.photoPreviewPlaceholder.classList.add("d-none");
  };
  reader.readAsDataURL(file);
});

/* ----------------------------------------------------------------------
 * Form validation
 * ---------------------------------------------------------------------- */

function isRollTaken(roll, excludeRoll) {
  return state.students.some(
    (s) => String(s.roll).toLowerCase() === String(roll).toLowerCase() && String(s.roll) !== String(excludeRoll)
  );
}

function validateForm() {
  let valid = true;

  const name = els.nameInput.value.trim();
  const roll = els.rollInput.value.trim();
  const klass = els.classInput.value.trim();

  els.nameInput.classList.toggle("is-invalid", !name);
  if (!name) valid = false;

  els.rollInput.classList.remove("is-invalid");
  if (!roll) {
    els.rollError.textContent = "Roll is required.";
    els.rollInput.classList.add("is-invalid");
    valid = false;
  } else if (isRollTaken(roll, state.editingRoll)) {
    els.rollError.textContent = "This roll number is already in use.";
    els.rollInput.classList.add("is-invalid");
    valid = false;
  }

  els.classInput.classList.toggle("is-invalid", !klass);
  if (!klass) valid = false;

  return valid;
}
const rollErrorEl = document.getElementById("rollError");
els.rollError = rollErrorEl;

/* ----------------------------------------------------------------------
 * Save (Create / Update)
 * ---------------------------------------------------------------------- */

els.studentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const isEdit = Boolean(state.editingRoll);
  const name = els.nameInput.value.trim();
  const roll = els.rollInput.value.trim();
  const klass = els.classInput.value.trim();
  const oldPhotoPath = els.existingPhotoPath.value || null;

  els.btnSaveStudent.disabled = true;
  setLoading(true, isEdit ? "Updating student…" : "Adding student…");

  try {
    let photoPath = oldPhotoPath;

    // Upload new photo if one was selected
    if (state.pendingPhotoFile) {
      const ext = state.pendingPhotoFile.type === "image/png" ? "jpg" : "jpg"; // normalize to .jpg per spec
      const newPhotoPath = `${CONFIG.PHOTOS_PATH}/${roll}.jpg`;
      const base64 = await fileToBase64(state.pendingPhotoFile);

      // If a differently-named old photo exists (roll changed), remove it after upload
      let existingSha = null;
      const existingAtNewPath = await getFile(newPhotoPath);
      if (existingAtNewPath) existingSha = existingAtNewPath.sha;

      await putFile(newPhotoPath, base64, `${isEdit ? "Update" : "Add"} photo for roll ${roll}`, existingSha);
      photoPath = newPhotoPath;

      if (oldPhotoPath && oldPhotoPath !== newPhotoPath) {
        const oldFile = await getFile(oldPhotoPath);
        if (oldFile) await deleteFile(oldPhotoPath, oldFile.sha, `Remove stale photo for roll ${roll}`);
      }
    } else if (isEdit && oldPhotoPath && roll !== state.editingRoll) {
      // Roll changed but no new photo chosen — rename existing photo to match new roll
      const newPhotoPath = `${CONFIG.PHOTOS_PATH}/${roll}.jpg`;
      const oldFile = await getFile(oldPhotoPath);
      if (oldFile) {
        await putFile(newPhotoPath, oldFile.contentBase64, `Rename photo for roll ${roll}`, null);
        await deleteFile(oldPhotoPath, oldFile.sha, `Remove old photo for roll ${state.editingRoll}`);
        photoPath = newPhotoPath;
      }
    }

    if (isEdit) {
      const idx = state.students.findIndex((s) => String(s.roll) === String(state.editingRoll));
      if (idx !== -1) {
        state.students[idx] = { name, roll, class: klass, photo: photoPath };
      }
      await saveDatabase(`Update student ${roll} — ${name}`);
      showToast("success", "Student updated", `${name} was updated successfully.`);
    } else {
      state.students.push({ name, roll, class: klass, photo: photoPath });
      await saveDatabase(`Add student ${roll} — ${name}`);
      showToast("success", "Student added", `${name} was added to the registry.`);
    }

    studentModal.hide();
    applySearchFilter();
  } catch (err) {
    showToast("error", "Save failed", err.message);
  } finally {
    els.btnSaveStudent.disabled = false;
    setLoading(false);
  }
});

/* ----------------------------------------------------------------------
 * Delete
 * ---------------------------------------------------------------------- */

function openDeleteModal(student) {
  state.deleteTarget = student;
  els.deleteStudentName.textContent = student.name;
  els.deleteStudentRoll.textContent = student.roll;
  deleteModal.show();
}

els.btnConfirmDelete.addEventListener("click", async () => {
  const student = state.deleteTarget;
  if (!student) return;

  els.btnConfirmDelete.disabled = true;
  setLoading(true, "Deleting student…");

  try {
    // Delete photo file from GitHub if present
    if (student.photo) {
      const photoFile = await getFile(student.photo);
      if (photoFile) {
        await deleteFile(student.photo, photoFile.sha, `Remove photo for roll ${student.roll}`);
      }
    }

    state.students = state.students.filter((s) => String(s.roll) !== String(student.roll));
    await saveDatabase(`Delete student ${student.roll} — ${student.name}`);

    showToast("success", "Student removed", `${student.name} was removed from the registry.`);
    deleteModal.hide();
    applySearchFilter();
  } catch (err) {
    showToast("error", "Delete failed", err.message);
  } finally {
    state.deleteTarget = null;
    els.btnConfirmDelete.disabled = false;
    setLoading(false);
  }
});

/* ----------------------------------------------------------------------
 * Loading overlay / sync status / toasts
 * ---------------------------------------------------------------------- */

function setLoading(isLoading, text = "Working…") {
  els.loadingText.textContent = text;
  els.loadingOverlay.classList.toggle("d-none", !isLoading);
}

function setSyncStatus(connected) {
  els.syncDot.classList.toggle("offline", !connected);
  els.syncText.textContent = connected ? "Connected to GitHub" : "Connection issue";
}

function showToast(type, title, message) {
  const iconMap = {
    success: "bi-check-circle-fill text-success",
    error: "bi-x-circle-fill text-danger",
    info: "bi-info-circle-fill text-primary",
  };
  const toastEl = document.createElement("div");
  toastEl.className = "toast align-items-center border-0";
  toastEl.setAttribute("role", "alert");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${iconMap[type] || iconMap.info} me-2"></i>
        <strong>${escapeHtml(title)}</strong><br>
        <span class="small">${escapeHtml(message || "")}</span>
      </div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  els.toastContainer.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 4500 });
  toast.show();
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}

/* ----------------------------------------------------------------------
 * Init
 * ---------------------------------------------------------------------- */

(function init() {
  if (!CONFIG.TOKEN || CONFIG.TOKEN === "YOUR_GITHUB_PAT") {
    setSyncStatus(false);
    showToast("error", "Missing GitHub token", "Set your Personal Access Token in config.js to enable the registry.");
    return;
  }
  loadStudents();
})();
