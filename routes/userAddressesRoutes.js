const express = require('express');
const router = express.Router();
const userAddressController = require('../controllers/userAddressController');
const { verifyTokenforactions } = require('../utils/authMiddleware');

router.post('/add',verifyTokenforactions, userAddressController.createUserAddress);
router.get('/get',verifyTokenforactions, userAddressController.getUserAddress);
router.get('/getbyid/:id',verifyTokenforactions, userAddressController.getUserAddressbyID);
router.put('/update/:id',verifyTokenforactions,userAddressController.updateUserAddress);
router.delete('/delete/:id',verifyTokenforactions, userAddressController.deleteUserAddress);

module.exports = router;
