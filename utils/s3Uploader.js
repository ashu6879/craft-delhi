const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET
  }
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => cb(null, true)
});

// Map fieldname to S3 folder and short prefix
const fieldMap = {
  main_image: { folder: 'main_image', prefix: 'mi' },
  gallery_images: { folder: 'gallery_images', prefix: 'gi' },
  product_video: { folder: 'product_video', prefix: 'vd' }, // ✅ Fix here
  product_reel: { folder: 'product_reel', prefix: 'rl' }     // ✅ And here
};

// Custom upload handler
const uploadToS3 = async (file, fieldname) => {
  const { folder, prefix } = fieldMap[fieldname] || { folder: 'others', prefix: 'ot' };
  const timestamp = Date.now();
  const ext = path.extname(file.originalname);
  const filename = `${prefix}-${timestamp}${ext}`;
  const key = `${folder}/${filename}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  await s3.send(new PutObjectCommand(params));
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = { upload, uploadToS3 };
