const Search = require('../models/searchModel');

exports.searchProducts = (req, res) => {
  const searchQuery = req.query.search;

  if (!searchQuery) {
    return res.status(400).json({
      status: false,
      message: 'Search query is required'
    });
  }

  Search.searchProductsByNameAndCategory(
    searchQuery,
    (err, products) => {
      if (err) {
        console.error('Search Products Error:', err);
        return res.status(500).json({
          status: false,
          message: 'Failed to search products'
        });
      }

      return res.status(200).json({
        status: true,
        message: 'Products fetched successfully',
        data: products
      });
    }
  );
};