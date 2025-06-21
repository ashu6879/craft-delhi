const productModel = require('../models/productModel');
const slugify = require('slugify');
const { uploadToS3 } = require('../utils/s3Uploader');

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
