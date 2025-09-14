const UserAddress = require('../models/userAddressModel');
const authorizeAction = require('../utils/authorizeAction');

// ✅ Create User Address
exports.createUserAddress = (req, res) => {
  const userId = req.user?.id;
  const { street, city, state, country, postal_code } = req.body;

  if (!userId) {
    return res.status(401).json({ status: false, message: 'Unauthorized: User ID not found' });
  }

  if (!street || !city || !state || !country || !postal_code) {
    return res.status(400).json({ status: false, message: 'All address fields are required' });
  }

  // Step 1: Insert new address
  UserAddress.createAddress(userId, { street, city, state, country, postal_code }, (err, insertResult) => {
    if (err) {
      console.error('Insert Error:', err);
      return res.status(500).json({ status: false, message: 'Server error' });
    }

    const insertedId = insertResult.insertId;

    // Step 2: Fetch inserted address
    UserAddress.getAddressByID(insertedId, (err, newAddress) => {
      if (err) {
        console.error('Fetch Error:', err);
        return res.status(500).json({ status: false, message: 'Server error' });
      }

      return res.status(201).json({
        status: true,
        message: 'User address created successfully',
        data: newAddress[0]
      });
    });
  });
};

// ✅ Get all User Addresses
exports.getUserAddress = (req, res) => {
  const { id } = req.user; // logged-in user's ID

  UserAddress.getAllAddresses(id, (err, addresses) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ status: false, message: 'Server error' });
    }

    return res.status(200).json({
      status: true,
      message: 'User addresses fetched successfully',
      data: addresses
    });
  });
};


// ✅ Get User Address by ID
exports.getUserAddressbyID = (req, res) => {
  const { id } = req.params; // address ID
  const { id: user_id } = req.user; // user ID from auth middleware

  if (!id) {
    return res.status(400).json({ status: false, message: 'Address ID is required' });
  }

  UserAddress.getAddressByID(id, user_id, (err, address) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ status: false, message: 'Server error' });
    }

    if (!address) { // no need to check .length since we return single record
      return res.status(404).json({ status: false, message: 'User address not found' });
    }

    return res.status(200).json({
      status: true,
      message: 'User address fetched successfully',
      data: address
    });
  });
};


// ✅ Update User Address
exports.updateUserAddress = (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { street, city, state, country, postal_code } = req.body;

  if (!id) {
    return res.status(400).json({ status: false, message: 'Address ID is required' });
  }

  if (!street || !city || !state || !country || !postal_code) {
    return res.status(400).json({ status: false, message: 'All address fields are required' });
  }

  authorizeAction(UserAddress, id, userId, {
    getMethod: 'getAddressByID',
    ownerField: 'user_id'
  }, (authError, address) => {
    if (authError) {
      return res.status(authError.code).json({ status: false, message: authError.message });
    }

    UserAddress.updateAddressByID(id, { street, city, state, country, postal_code }, (err, result) => {
      if (err) {
        return res.status(500).json({ status: false, message: 'Error updating user address', error: err });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({ status: true, message: 'User address updated successfully' });
      } else {
        return res.status(400).json({ status: false, message: 'User address update failed' });
      }
    });
  });
};

// ✅ Delete User Address
exports.deleteUserAddress = (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id) {
    return res.status(400).json({ status: false, message: 'Address ID is required' });
  }

  authorizeAction(UserAddress, id, userId, {
    getMethod: 'getAddressByID',
    ownerField: 'user_id'
  }, (authError, address) => {
    if (authError) {
      return res.status(authError.code).json({ status: false, message: authError.message });
    }

    UserAddress.deleteAddressByID(id, (err, result) => {
      if (err) {
        return res.status(500).json({ status: false, message: 'Error deleting user address', error: err });
      }

      if (result.affectedRows > 0) {
        return res.status(200).json({ status: true, message: 'User address deleted successfully' });
      } else {
        return res.status(400).json({ status: false, message: 'User address deletion failed' });
      }
    });
  });
};
