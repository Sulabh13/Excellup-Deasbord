const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

const allowedFormats = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'png', 'jpeg'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'excellup/materials';
    let resource_type = 'auto';

    if (file.mimetype.startsWith('image/')) {
      folder = 'excellup/images';
      resource_type = 'image';
    }

    return {
      folder,
      resource_type,
      allowed_formats: allowedFormats,
      use_filename: true,
      unique_filename: true,
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// For avatar uploads — image only, stored in avatars folder
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'excellup/avatars',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    use_filename: true,
    unique_filename: true,
  },
});

const avatarFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Avatar must be JPG or PNG'), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

module.exports = { upload, uploadAvatar };
