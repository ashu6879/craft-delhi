const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const sellerStoreRoutes = require('./routes/sellerStoreRoutes');
const profileDetailsController = require('./routes/profileDetails');
const webhookHandler = require('./utils/webhook');


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/seller-store', sellerStoreRoutes);
app.use('/api/profile', profileDetailsController);
app.use('/api/webhook', webhookHandler);

module.exports = app;
