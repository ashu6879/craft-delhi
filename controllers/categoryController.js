const Category = require('../models/categoryModel');

exports.createCategory = async (req, res) => {
  const { categoryName, sellerId } = req.body;

  if (!categoryName) {
    return res.status(400).json({ message: 'categoryName is required' });
  }

  const createdBy = sellerId ? 'seller' : 'admin';
  const creatorId = sellerId || null;

  try {
    const [existing] = await Category.findCategoryByNameAndCreator(categoryName, createdBy, creatorId);

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Category already exists',
        category: existing[0]
      });
    }

    const [insertResult] = await Category.createCategory(categoryName, createdBy, creatorId);
    const [newCategory] = await Category.findCategoryById(insertResult.insertId);

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
