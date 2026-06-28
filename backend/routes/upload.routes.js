const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadImage } = require('../controllers/upload.controller');

// ─── Admin (image upload) — JWT protected ────────────────────
router.post('/', auth, uploadImage);

module.exports = router;
