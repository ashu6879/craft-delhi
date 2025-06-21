const Category = require('../models/categoryModel');

exports.createCategory = (req, res) => {
  const { categoryName, sellerId } = req.body;

  if (!categoryName) {
    return res.status(400).json({ message: 'categoryName is required' });
  }

  const createdBy = sellerId ? 'seller' : 'admin';
  const creatorId = sellerId || null;

  // Step 1: Check if category already exists
  Category.findCategoryByNameAndCreator(categoryName, createdBy, creatorId, (err, existing) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (existing.length > 0) {
      return res.status(409).json({
        status: false,
        message: 'Category already exists',
        category: existing[0]
      });
    }

    // Step 2: Insert new category
    Category.createCategory(categoryName, createdBy, creatorId, (err, insertResult) => {
      if (err) {
        console.error('Insert Error:', err);
        return res.status(500).json({ status: false,message: 'Server error' });
      }

      const insertedId = insertResult.insertId;

      // Step 3: Fetch inserted category
      Category.findCategoryById(insertedId, (err, newCategory) => {
        if (err) {
          console.error('Fetch Error:', err);
          return res.status(500).json({ status: false,message: 'Server error' });
        }

        res.status(201).json({
          status: true,
          message: 'Category created successfully',
          category: newCategory[0]
        });
      });
    });
  });
};


exports.getCategories = (req, res) => {
  Category.getallCategories((err, categories) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({status: false, message: 'Server error' });
    }

    // Return all categories
    return res.status(200).json({
      status: true,
      message: 'Categories fetched successfully',
      data: categories
    });
  });
};

exports.getCategoryID = (req, res) => {
  const { category_id } = req.params;

  if (!category_id) {
    return res.status(400).json({ status: false, message: 'Category ID is required' });
  }

  Category.getCategorybyID(category_id, (err, category) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ status: false, message: 'Server error' });
    }

    if (!category) {
      return res.status(404).json({ status: false, message: 'Category not found' });
    }

    return res.status(200).json({
      status: true,
      message: 'Category fetched successfully',
      data: category
    });
  });
};

