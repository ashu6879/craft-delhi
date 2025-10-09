const SellerStore = require('../models/sellerStore');
const authorizeAction = require('../utils/authorizeAction');
const { uploadToS3, getS3KeyFromUrl } = require('../utils/s3Uploader');
const { deleteFilesFromS3 } = require('../utils/deleteFilesFromS3');
const bucketName = process.env.AWS_BUCKET_NAME;

exports.updateStore = async (req, res) => {
  const userId = req.user?.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ status: false, message: 'Invalid seller ID' });
  }

  if (req.user.role !== 2) {
    return res.status(403).json({ status: false, message: 'Only sellers can update store details.' });
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

    // First check if the store exists
    SellerStore.getStoreBySellerIdforAuth(userId, async (err, existingStore) => {
      if (err) {
        console.error('MySQL error:', err);
        return res.status(500).json({ status: false, message: 'Internal server error' });
      }

      // If no store exists, create a new one first
      if (!existingStore) {
        SellerStore.createStore({ seller_id: userId }, (createErr) => {
          if (createErr) {
            return res.status(500).json({ status: false, message: 'Error creating store record' });
          }
          // Retry after creating
          return exports.updateStore(req, res);
        });
        return;
      }

      // Now authorize (store exists)
      authorizeAction(SellerStore, userId, userId, {
        getMethod: 'getStoreBySellerIdforAuth',
        ownerField: 'seller_id'
      }, async (authError) => {
        if (authError) {
          return res.status(authError.code).json({ status: false, message: authError.message });
        }

        try {
          if (req.file) {
            if (existingStore.store_image) {
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

          SellerStore.updateStoreBySellerId(userId, updateData, (updateErr, result) => {
            if (updateErr) {
              console.error('MySQL error:', updateErr);
              return res.status(500).json({ status: false, message: 'Internal server error' });
            }

            if (result.affectedRows === 0) {
              return res.status(404).json({ status: false, message: 'No changes provided.' });
            }

            SellerStore.getStoreBySellerId(userId, (fetchErr, updatedStore) => {
              if (fetchErr) {
                return res.status(500).json({ status: false, message: 'Store updated, but failed to retrieve updated data.' });
              }

              return res.status(200).json({
                status: true,
                message: 'Store updated successfully.',
                updated_store: updatedStore
              });
            });
          });
        } catch (e) {
          console.error('Unexpected error:', e);
          return res.status(500).json({ status: false, message: 'Something went wrong' });
        }
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({ status: false, message: 'Unexpected server error' });
  }
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


exports.getStoreLinkBySellerId = async (req, res) => {
  const storeId = req.params.id;

  try {
    // Fetch store from DB
    const store = await SellerStore.findById(storeId);
    if (!store) return res.status(404).json({ status: false, message: 'Store not found' });

    let slug = store.slug;

    // Generate slug if it doesn't exist
    if (!slug) {
      let baseSlug = slugify(`${store.last_name}-${store.first_name}`, { lower: true });
      let uniqueSlug = baseSlug;
      let counter = 1;

      // Ensure uniqueness
      while (await SellerStore.isSlugExists(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;

      // Generate store link
      const storeLink = `https://craftdelhi.com/store/${slug}`;

      // Save slug and store_link in DB
      await SellerStore.updateSlug(store.id, slug, storeLink);

      // Update store object to include new values
      store.slug = slug;
      store.store_link = storeLink;
    }

    // Return shareable link
    res.json({
      status: true,
      storeLink: store.store_link || `https://craftdelhi.com/store/${slug}`,
      store,
    });

  } catch (err) {
    console.error('Error fetching store or generating link:', err);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
};