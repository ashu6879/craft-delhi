const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

// ✅ Allow only your frontend domains
const corsOptions = {
  origin: ['http://localhost:3000', 'https://craftbuyer.onrender.com'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight handler

app.use(express.json());
app.use('/api/auth', authRoutes);

module.exports = app;
