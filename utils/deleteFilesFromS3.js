const { S3Client, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g., 'ap-south-1'
  credentials: {
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET
  }
});

/**
 * Extract S3 key from full URL.
 */
const getS3KeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return decodeURIComponent(urlObj.pathname).replace(/^\/+/, '');
  } catch (err) {
    console.error('Invalid S3 URL:', url);
    return null;
  }
};

/**
 * Delete multiple files from S3 given an array of file URLs.
 * @param {string[]} urls
 * @param {string} bucketName
 */
const deleteFilesFromS3 = async (urls = [], bucketName) => {
  const objectsToDelete = urls
    .map(getS3KeyFromUrl)
    .filter(Boolean)
    .map(key => ({ Key: key }));

  if (!objectsToDelete.length) return { deleted: [], skipped: true };

  const command = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: { Objects: objectsToDelete }
  });

  try {
    const result = await s3.send(command);
    return {
      deleted: result.Deleted.map(obj => obj.Key),
      skipped: false
    };
  } catch (err) {
    console.error('S3 deletion error:', err);
    throw err;
  }
};

module.exports = { deleteFilesFromS3, getS3KeyFromUrl };
