import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads folder exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File validation logic
const fileFilter = (req, file, cb) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.jfif', '.webp', '.bmp', '.svg', '.gif'];
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
  const documentExtensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv'];

  const ext = path.extname(file.originalname).toLowerCase();
  const fieldName = file.fieldname;
  const isImageField = ['profilePhoto', 'signatures', 'logos', 'poster', 'image'].includes(fieldName);

  if (isImageField) {
    if (imageExtensions.includes(ext) || (file.mimetype && file.mimetype.startsWith('image/'))) {
      return cb(null, true);
    }
    return cb(new Error(`Invalid image type: ${ext || file.mimetype} is not allowed for field ${fieldName}`), false);
  }

  const allowed = [...imageExtensions, ...videoExtensions, ...documentExtensions];
  if (allowed.includes(ext) || (file.mimetype && (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')))) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${ext} is not allowed for field ${fieldName}`), false);
  }
};

// Size limits setup
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // Set max limit (100MB for video) and filter inside route handlers
  }
});

export default upload;
