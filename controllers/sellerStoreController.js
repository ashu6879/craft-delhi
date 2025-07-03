const SellerStore = require('../models/sellerStore');
const authorizeAction = require('../utils/authorizeAction');
const { uploadToS3, getS3KeyFromUrl } = require('../utils/s3Uploader');
const { deleteFilesFromS3 } = require('../utils/deleteFilesFromS3');
const bucketName = process.env.AWS_BUCKET_NAME;

exports.updateStore = async (req, res) => {
  const userId = req.user?.id;
  const storeId = req.user?.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ status: false, message: 'Invalid seller ID' });
  }

  if (req.user.role !== 2) {
    return res.status(403).json({ status: false, message: 'Only sellers can update store details.' });
  }

  authorizeAction(SellerStore, storeId, userId, {
    getMethod: 'getStoreBySellerIdforAuth',
    ownerField: 'seller_id'
  }, async (authError, store) => {
    if (authError) {
      return res.status(authError.code).json({ status: false, message: authError.message });
    }

    try {
      const {
        store_name,
        store_username,
        store_link,
        description,
        store_created_date,
        business_number
      } = req.body;

      let store_image = null;

      SellerStore.getStoreBySellerIdforAuth(userId, async (err, existingStore) => {
        if (err) {
          console.error('MySQL error:', err);
          return res.status(500).json({ status: false, message: 'Internal server error' });
        }

        if (req.file) {
          if (existingStore?.store_image) {
            const oldKey = getS3KeyFromUrl(existingStore.store_image);
            if (oldKey) await deleteFilesFromS3([oldKey], bucketName);
          }

          store_image = await uploadToS3(req.file, 'store_image');
        }

        const updateData = {
          store_name,
          store_username,
          store_link,
          description,
          store_created_date,
          business_number
        };

        if (store_image) updateData.store_image = store_image;

        const updateCallback = (err, result) => {
          if (err) {
            console.error('MySQL error:', err);
            return res.status(500).json({ status: false, message: 'Internal server error' });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ status: false, message: 'No changes provided.' });
          }

          // ✅ Fetch updated store data and return
          SellerStore.getStoreBySellerId(userId, (fetchErr, updatedStore) => {
            if (fetchErr) {
              console.error('Fetch error:', fetchErr);
              return res.status(500).json({
                status: false,
                message: 'Store updated, but failed to retrieve updated data.'
              });
            }

            return res.status(200).json({
              status: true,
              message: 'Store updated successfully.',
              updated_store: updatedStore
            });
          });
        };

        if (!existingStore) {
          SellerStore.createStore({ seller_id: userId }, (createErr) => {
            if (createErr) {
              return res.status(500).json({ status: false, message: 'Error creating store record' });
            }
            SellerStore.updateStoreBySellerId(userId, updateData, updateCallback);
          });
        } else {
          SellerStore.updateStoreBySellerId(userId, updateData, updateCallback);
        }
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({ status: false, message: 'Something went wrong' });
    }
  });
};


exports.getStoreBySellerId = (req, res) => {
  const sellerId = req.user?.id;

  if (req.user.role !== 2) {
    return res.status(403).json({ status: false, message: 'Only sellers can access store details.' });
  }

  if (!sellerId || isNaN(sellerId)) {
    return res.status(400).json({ status: false, message: 'Invalid seller ID' });
  }

  SellerStore.getStoreBySellerId(sellerId, (err, store) => {
    if (err) {
      console.error('MySQL error:', err);
      return res.status(500).json({ status: false, message: 'Internal server error' });
    }

    if (!store) {
      return res.status(404).json({ status: false, message: 'Store not found for this seller' });
    }

    return res.status(200).json({
      status: true,
      message: 'Store fetched successfully.',
      store
    });
  });
};
