const adminModel = require('../models/adminModel');
require('dotenv').config();

exports.getDashboardStats = (req, res) => {
  const {role_id} = req.user.role;
  if(role_id == process.env.Admin_role_id){
    adminModel.getDashboardStats((err, stats) => {
      if (err) return res.status(500).json({ status: false, error: err });
      res.json({ status: true, data: stats });
    });
  }else{
    res.stats(401).json({ status: false, message: "Unauthorized Role" });
  }
};