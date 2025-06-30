const productModel = require('../models/productModel');
const slugify = require('slugify');
const { uploadToS3, getS3KeyFromUrl  } = require('../utils/s3Uploader');
const authorizeAction = require('../utils/authorizeAction');
const { deleteFilesFromS3 } = require('../utils/deleteFilesFromS3');
const bucketName = process.env.AWS_BUCKET_NAME;

exports.deleteProduct = (req, res) => {
  const { product_id } = req.params;
  const userId = req.user?.id;

  if (!product_id) {
    return res.status(400).json({ status: false, message: 'Product ID is required' });
  }

  authorizeAction(productModel, product_id, userId, {
    getMethod: 'getProductbyID',
    ownerField: 'seller_id'
  }, async (authError, product) => {
    if (authError) {
      return res.status(authError.code).json({ status: false, message: authError.message });
    }
    const mediaUrls = [];

    if (product.main_image_url) mediaUrls.push(product.main_image_url);
    if (product.video_url) mediaUrls.push(product.video_url);
    if (product.reel_url) mediaUrls.push(product.reel_url);

    if (product.gallery_images) {
      try {
        const gallery = JSON.parse(product.gallery_images);
        if (Array.isArray(gallery)) mediaUrls.push(...gallery);
      } catch (err) {
        console.error('Failed to parse gallery_images:', err);
      }
    }

    const deleteFromDB = () => {
      productModel.deleteProductID(product_id, (err, result) => {
        if (err) {
          return res.status(500).json({ status: false, message: 'Error deleting product', error: err });
        }

        if (result.affectedRows > 0) {
          return res.status(200).json({ status: true, message: 'Product and media deleted successfully' });
        } else {
          return res.status(400).json({ status: false, message: 'Product deletion failed' });
        }
      });
    };

    try {
      const result = await deleteFilesFromS3(mediaUrls, bucketName);
      console.log('S3 deletion result:', result);
      deleteFromDB(); // proceed after deletion
    } catch (err) {
      console.error('S3 deletion failed, proceeding with DB delete anyway');
      deleteFromDB(); // still proceed
    }
  });
};



exports.addProduct = async (req, res) => {
  try {
    const {
      name, description, price, category_id,
      stock, dimension, package_weight,
      weight_type, warranty_type, seller_id
    } = req.body;

    if (!name || !price || !category_id || !seller_id) {
      return res.status(400).json({ status: false,error: 'Name, price, seller_id, and category_id are required.' });
    }

    // Generate SKU: clean + no hyphens + alphanumeric only
    const timestamp = Date.now();
    const rawSlug = slugify(name, { lower: true });
    const cleanSlug = rawSlug.replace(/[^a-zA-Z0-9]/g, '');
    const product_sku = `SKU${cleanSlug}${timestamp}`;

    // Upload assets to S3
    let mainImage = null;
    let galleryImages = [];
    let videoUrl = null;
    let reelUrl = null;

    if (req.files['main_image']?.[0]) {
      mainImage = await uploadToS3(req.files['main_image'][0], 'main_image');
    }

    if (req.files['gallery_images']) {
      galleryImages = await Promise.all(
        req.files['gallery_images'].map(file => uploadToS3(file, 'gallery_images'))
      );
    }

    if (req.files['product_video']?.[0]) {
      videoUrl = await uploadToS3(req.files['product_video'][0], 'product_video');
    }

    if (req.files['product_reel']?.[0]) {
      reelUrl = await uploadToS3(req.files['product_reel'][0], 'product_reel');
    }

    const productData = {
      name,
      product_sku,
      description,
      price,
      category_id,
      stock,
      dimension,
      package_weight,
      weight_type,
      warranty_type,
      main_image_url: mainImage,
      gallery_images: JSON.stringify(galleryImages),
      video_url: videoUrl,
      reel_url: reelUrl,
      seller_id
    };

    await productModel.insert(productData);
    res.status(200).json({ status: true,message: 'Product added successfully', product_sku });

  } catch (error) {
    console.error(error);
    res.status(500).json({status: false, error: 'Something went wrong' });
  }
};

exports.getProducts = (req, res) => {
  productModel.getallProducts((err, products) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({status: false, message: 'Server error' });
    }

    // Return all products
    return res.status(200).json({
      status: true,
      message: 'products fetched successfully',
      data: products
    });
  });
};

exports.getProductsbyID = (req, res) => {
  const { product_id } = req.params;

  if (!product_id) {
    return res.status(400).json({ status: false, message: 'Product ID is required' });
  }

  productModel.getProductbyID(product_id, (err, product) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ status: false, message: 'Server error' });
    }

    if (!product) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }

    return res.status(200).json({
      status: true,
      message: 'Product fetched successfully',
      data: product
    });
  });
};


exports.deleteProduct = (req, res) => {
  const { product_id } = req.params;
  const userId = req.user?.id;

  if (!product_id) {
    return res.status(400).json({ status: false, message: 'Product ID is required' });
  }

  authorizeAction(productModel, product_id, userId, {
    getMethod: 'getProductbyID',
    ownerField: 'seller_id'
  }, async (authError, product) => {
    if (authError) {
      return res.status(authError.code).json({ status: false, message: authError.message });
    }
    const mediaUrls = [];

    if (product.main_image_url) mediaUrls.push(product.main_image_url);
    if (product.video_url) mediaUrls.push(product.video_url);
    if (product.reel_url) mediaUrls.push(product.reel_url);

    if (product.gallery_images) {
      try {
        const gallery = JSON.parse(product.gallery_images);
        if (Array.isArray(gallery)) mediaUrls.push(...gallery);
      } catch (err) {
        console.error('Failed to parse gallery_images:', err);
      }
    }

    const deleteFromDB = () => {
      productModel.deleteProductID(product_id, (err, result) => {
        if (err) {
          return res.status(500).json({ status: false, message: 'Error deleting product', error: err });
        }

        if (result.affectedRows > 0) {
          return res.status(200).json({ status: true, message: 'Product and media deleted successfully' });
        } else {
          return res.status(400).json({ status: false, message: 'Product deletion failed' });
        }
      });
    };

    try {
      const result = await deleteFilesFromS3(mediaUrls, bucketName);
      // console.log('S3 deletion result:', result);
      deleteFromDB(); // proceed after deletion
    } catch (err) {
      console.error('S3 deletion failed, proceeding with DB delete anyway');
      deleteFromDB(); // still proceed
    }
  });
};

// UPDATE Category
exports.updateProduct = async (req, res) => {
  const { product_id } = req.params;
  const userId = req.user?.id;

  if (!product_id) {
    return res.status(400).json({ status: false, message: 'Product ID is required' });
  }

  authorizeAction(productModel, product_id, userId, {
    getMethod: 'getProductbyID',
    ownerField: 'seller_id'
  }, async (authError, existingProduct) => {
    if (authError) {
      return res.status(authError.code).json({ status: false, message: authError.message });
    }

    try {
      const {
        name,
        description,
        price,
        category_id,
        stock,
        dimension,
        package_weight,
        weight_type,
        warranty_type,
        main_image_url,
        video_url,
        reel_url
      } = req.body || {};

      const updateData = {
        name, description, price, category_id, stock,
        dimension, package_weight, weight_type, warranty_type
      };

      // 1️⃣ Handle gallery_images (body or file uploads)
      if (req.body.gallery_images) {
        try {
          const newGallery = JSON.parse(req.body.gallery_images);
          const oldGallery = JSON.parse(existingProduct.gallery_images || '[]');
          const toDelete = oldGallery.filter(url => !newGallery.includes(url));
          if (toDelete.length) await deleteFilesFromS3(toDelete, bucketName);
          updateData.gallery_images = JSON.stringify(newGallery);
        } catch (err) {
          console.error('Gallery parsing error:', err);
        }
      }

      // 2️⃣ Handle newly uploaded files
      if (req.files) {
        // Main image
        if (req.files.main_image?.[0]) {
          if (existingProduct.main_image_url) {
            await deleteFilesFromS3([existingProduct.main_image_url], bucketName);
          }
          updateData.main_image_url = await uploadToS3(req.files.main_image[0], 'main_image');
        } else if (main_image_url && main_image_url !== existingProduct.main_image_url) {
          await deleteFilesFromS3([existingProduct.main_image_url], bucketName);
          updateData.main_image_url = main_image_url;
        }

        // Gallery images
        if (req.files.gallery_images) {
          if (existingProduct.gallery_images) {
            const oldGallery = JSON.parse(existingProduct.gallery_images || '[]');
            await deleteFilesFromS3(oldGallery, bucketName);
          }
          const uploadedGallery = await Promise.all(
            req.files.gallery_images.map(f => uploadToS3(f, 'gallery_images'))
          );
          updateData.gallery_images = JSON.stringify(uploadedGallery);
        }

        // Product video
        if (req.files.product_video?.[0]) {
          if (existingProduct.video_url) {
            await deleteFilesFromS3([existingProduct.video_url], bucketName);
          }
          updateData.video_url = await uploadToS3(req.files.product_video[0], 'product_video');
        } else if (video_url && video_url !== existingProduct.video_url) {
          await deleteFilesFromS3([existingProduct.video_url], bucketName);
          updateData.video_url = video_url;
        }

        // Product reel
        if (req.files.product_reel?.[0]) {
          if (existingProduct.reel_url) {
            await deleteFilesFromS3([existingProduct.reel_url], bucketName);
          }
          updateData.reel_url = await uploadToS3(req.files.product_reel[0], 'product_reel');
        } else if (reel_url && reel_url !== existingProduct.reel_url) {
          await deleteFilesFromS3([existingProduct.reel_url], bucketName);
          updateData.reel_url = reel_url;
        }
      } else {
        // 3️⃣ Fallback raw URLs (if no files uploaded)
        if (main_image_url && main_image_url !== existingProduct.main_image_url) {
          await deleteFilesFromS3([existingProduct.main_image_url], bucketName);
          updateData.main_image_url = main_image_url;
        }
        if (video_url && video_url !== existingProduct.video_url) {
          await deleteFilesFromS3([existingProduct.video_url], bucketName);
          updateData.video_url = video_url;
        }
        if (reel_url && reel_url !== existingProduct.reel_url) {
          await deleteFilesFromS3([existingProduct.reel_url], bucketName);
          updateData.reel_url = reel_url;
        }
      }

      // 4️⃣ Perform DB update
      productModel.updateProductByID(product_id, updateData, (err, result) => {
        if (err) {
          console.error('DB update error:', err);
          return res.status(500).json({ status: false, message: 'Error updating product', error: err });
        }
        if (result.affectedRows > 0) {
          return res.status(200).json({ status: true, message: 'Product updated successfully' });
        }
        return res.status(400).json({ status: false, message: 'No changes made to the product' });
      });

    } catch (uploadErr) {
      console.error('Upload or S3 error:', uploadErr);
      return res.status(500).json({ status: false, message: 'Error processing uploads', error: uploadErr });
    }
  });
};