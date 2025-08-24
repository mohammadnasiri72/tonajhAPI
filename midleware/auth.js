const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    // 1) دریافت توکن و بررسی وجود آن
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'لطفا وارد سیستم شوید'
      });
    }
    
    // 2) تأیید توکن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3) بررسی وجود کاربر
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'کاربر مربوط به این توکن وجود ندارد'
      });
    }
    
    // 4) دسترسی به route داده شود
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'توکن معتبر نیست'
    });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'شما مجوز انجام این عمل را ندارید'
      });
    }
    next();
  };
};