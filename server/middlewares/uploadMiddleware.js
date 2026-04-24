/**
 * Centralized media upload middleware for LMSGRAVE LMS.
 * Usage:
 *   const { createUpload } = require('./uploadMiddleware');
 *   const upload = createUpload('questions'); // => saves to /uploads/questions/
 *   router.post('/upload', upload.single('image'), handler);
 *
 * Allowed types: jpg, jpeg, png, webp, pdf
 * Max size: 5MB
 * Naming: category_timestamp_random.ext
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_MIMES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Create a multer upload middleware for a specific folder/category.
 * @param {string} folder - Sub-folder inside /uploads (e.g. 'questions', 'notes')
 */
const createUpload = (folder = 'resources') => {
    const destPath = path.join(__dirname, '..', 'uploads', folder);

    // Ensure folder exists
    if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, destPath);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase() || ALLOWED_MIMES[file.mimetype] || '';
            const uniqueName = `${folder}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
            cb(null, uniqueName);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (ALLOWED_MIMES[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed: jpg, jpeg, png, webp, pdf`), false);
        }
    };

    return multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
};

// Default export: image-only upload (for backward compat with existing code that does require('./uploadMiddleware'))
const defaultUpload = createUpload('resources');

module.exports = defaultUpload;
module.exports.createUpload = createUpload;
