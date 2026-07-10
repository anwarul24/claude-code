/**
 * ==========================================================================
 * config.js — GitHub REST API connection settings
 * ==========================================================================
 * Replace YOUR_GITHUB_PAT below with a GitHub Personal Access Token that has
 * "repo" (or fine-grained "Contents: Read and write") permission on the
 * target repository.
 *
 * SECURITY NOTE: this app runs entirely in the browser, so the token is
 * visible to anyone who can open dev tools on this page. Only use this on
 * a private repo / trusted machine, use a fine-grained token scoped to this
 * one repository only, and rotate the token periodically. Never commit a
 * real token to a public repository.
 * ==========================================================================
 */

const CONFIG = {
  // GitHub account / organization that owns the repository
  OWNER: "anwarul24",

  // Repository name used as the data store
  REPO: "claude-code",

  // Branch to read from and write to
  BRANCH: "main",

  // Personal Access Token — replace with your own token
  TOKEN: "YOUR_GITHUB_PAT",

  // Paths inside the repository
  DATA_PATH: "students-management/students/database.json",
  PHOTOS_PATH: "students-management/photos",

  // Upload constraints
  MAX_PHOTO_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
  ALLOWED_PHOTO_TYPES: ["image/jpeg", "image/png", "image/jpg"],

  // GitHub API base
  API_BASE: "https://api.github.com",
};
