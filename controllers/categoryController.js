const Category = require('../models/categoryModel');
const authorizeAction = require('../utils/authorizeAction');


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
      Category.getCategorybyID(insertedId, (err, newCategory) => {
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

// DELETE Category
exports.deleteCategory = (req, res) => {

  const { category_id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!category_id) {
    return res.status(400).json({
      status: false,
      message: 'Category ID is required'
    });
  }

  // ✅ Admin direct delete
  if (Number(userRole) === Number(process.env.ADMIN_ROLE_ID)) {

    return Category.deleteCategoryID(category_id, (err, result) => {

      if (err) {
        return res.status(500).json({
          status: false,
          message: 'Error deleting category',
          error: err
        });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: 'Category deleted successfully (Admin)'
        });
      }

      return res.status(400).json({
        status: false,
        message: 'Category deletion failed'
      });

    });
  }

  // Normal users
  authorizeAction(Category, category_id, userId, {
    getMethod: 'getCategorybyID',
    ownerField: 'creator_id'
  }, (authError, category) => {

    if (authError) {
      return res.status(authError.code).json({
        status: false,
        message: authError.message
      });
    }

    Category.deleteCategoryID(category_id, (err, result) => {

      if (err) {
        return res.status(500).json({
          status: false,
          message: 'Error deleting category',
          error: err
        });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: 'Category deleted successfully'
        });
      }

      return res.status(400).json({
        status: false,
        message: 'Category deletion failed'
      });

    });

  });
};

// UPDATE Category
exports.updateCategory = (req, res) => {
  console.log("aaya")
  const { category_id } = req.params;
  const { name } = req.body;

  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!category_id) {
    return res.status(400).json({ status: false, message: 'Category ID is required' });
  }

  if (!name || name.trim() === '') {
    return res.status(400).json({ status: false, message: 'Category name is required' });
  }
  console.log("userRole",userRole)
  console.log("userRole",process.env.ADMIN_ROLE_ID)
  // ✅ If Admin → skip ownership check
  if (userRole == process.env.ADMIN_ROLE_ID) {
    Category.updateCategoryByID(category_id, { name }, (err, result) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: 'Error updating category',
          error: err
        });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: 'Category updated successfully (Admin)'
        });
      } else {
        return res.status(400).json({
          status: false,
          message: 'Category update failed'
        });
      }
    });

    return; // stop execution
  }

  // ✅ Non-admin → check ownership
  authorizeAction(Category, category_id, userId, {
    getMethod: 'getCategorybyID',
    ownerField: 'creator_id'
  }, (authError, category) => {

    if (authError) {
      return res.status(authError.code).json({
        status: false,
        message: authError.message
      });
    }

    Category.updateCategoryByID(category_id, { name }, (err, result) => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: 'Error updating category',
          error: err
        });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: 'Category updated successfully'
        });
      } else {
        return res.status(400).json({
          status: false,
          message: 'Category update failed'
        });
      }
    });
  });
};

exports.createSubCategory = (req, res) => {
  const { name, parent_id, sellerId } = req.body;

  if (!name || !parent_id) {
    return res.status(400).json({
      status: false,
      message: "name and parent_id are required"
    });
  }

  const createdBy = sellerId ? "seller" : "admin";
  const creatorId = sellerId || null;

  Category.createSubCategory(name, parent_id, createdBy, creatorId, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        status: false,
        message: "Server error"
      });
    }

    res.status(201).json({
      status: true,
      message: "Subcategory created successfully"
    });
  });
};

exports.getSubCategories = (req, res) => {
  const { category_id } = req.params;

  if (!category_id) {
    return res.status(400).json({
      status: false,
      message: "Category ID required"
    });
  }

  Category.getSubCategoriesByCategory(category_id, (err, data) => {
    if (err) {
      return res.status(500).json({
        status: false,
        message: "Server error"
      });
    }

    res.status(200).json({
      status: true,
      message: "Subcategories fetched successfully",
      data
    });
  });
};
exports.deleteSubCategory = (req, res) => {
  const { subcategory_id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!subcategory_id) {
    return res.status(400).json({
      status: false,
      message: "Subcategory ID is required"
    });
  }

  // ✅ Admin can delete directly
  if (Number(userRole) === Number(process.env.ADMIN_ROLE_ID)) {

    return Category.deleteSubCategoryByID(subcategory_id, (err, result) => {

      if (err) {
        return res.status(500).json({
          status: false,
          message: "Error deleting subcategory",
          error: err
        });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: "Subcategory deleted successfully (Admin)"
        });
      }

      return res.status(400).json({
        status: false,
        message: "Subcategory deletion failed"
      });

    });
  }

  // Normal users
  authorizeAction(Category, subcategory_id, userId, {
    getMethod: "getCategorybyID",
    ownerField: "creator_id"
  }, (authError, subcategory) => {

    if (authError) {
      return res.status(authError.code).json({
        status: false,
        message: authError.message
      });
    }

    if (!subcategory.parent_id) {
      return res.status(400).json({
        status: false,
        message: "This is not a subcategory"
      });
    }

    Category.deleteSubCategoryByID(subcategory_id, (err, result) => {

      if (err) {
        return res.status(500).json({
          status: false,
          message: "Error deleting subcategory",
          error: err
        });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: "Subcategory deleted successfully"
        });
      }

      return res.status(400).json({
        status: false,
        message: "Subcategory deletion failed"
      });

    });

  });
};
exports.updateSubCategory = (req, res) => {

  const { subcategory_id } = req.params;
  const { name } = req.body;

  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!subcategory_id) {
    return res.status(400).json({
      status: false,
      message: "Subcategory ID is required"
    });
  }

  if (!name || name.trim() === "") {
    return res.status(400).json({
      status: false,
      message: "Subcategory name is required"
    });
  }

  // ✅ Admin direct update
  if (Number(userRole) === Number(process.env.ADMIN_ROLE_ID)) {

    return Category.updateSubCategoryByID(subcategory_id, { name }, (err, result) => {

      if (err) {
        return res.status(500).json({
          status: false,
          message: "Error updating subcategory",
          error: err
        });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: "Subcategory updated successfully (Admin)"
        });
      }

      return res.status(400).json({
        status: false,
        message: "Subcategory update failed"
      });

    });
  }

  // Normal users
  authorizeAction(Category, subcategory_id, userId, {
    getMethod: "getCategorybyID",
    ownerField: "creator_id"
  }, (authError, subcategory) => {

    if (authError) {
      return res.status(authError.code).json({
        status: false,
        message: authError.message
      });
    }

    if (!subcategory.parent_id) {
      return res.status(400).json({
        status: false,
        message: "This is not a subcategory"
      });
    }

    Category.updateSubCategoryByID(subcategory_id, { name }, (err, result) => {

      if (err) {
        return res.status(500).json({
          status: false,
          message: "Error updating subcategory",
          error: err
        });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({
          status: true,
          message: "Subcategory updated successfully"
        });
      }

      return res.status(400).json({
        status: false,
        message: "Subcategory update failed"
      });

    });

  });
};
