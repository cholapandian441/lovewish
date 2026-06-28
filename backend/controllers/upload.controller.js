const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// ─── Upload destination ──────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Make sure the folder exists at startup
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Map each allowed MIME type to the canonical extension we will store it under.
// The extension is derived from the (validated) MIME type, NOT from the
// client-supplied filename, so a request can never smuggle a ".html"/".svg"/".js"
// file onto disk.
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// ─── Multer storage ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.bin';
    const unique = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  if (MIME_TO_EXT[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed.'));
  }
}

// 5 MB limit, single file under field name "image"
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('image');

/**
 * POST /api/upload
 * Multipart form-data with field "image".
 * Returns the publicly accessible URL of the stored file.
 */
function uploadImage(req, res, next) {
  upload(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Image must be 5 MB or smaller.'
          : err.message || 'Upload failed.';
      return res.status(400).json({ success: false, message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(201).json({ success: true, url });
  });
}

module.exports = { uploadImage };
