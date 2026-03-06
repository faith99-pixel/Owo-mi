const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'owomi-secret');
    const tokenUserId = decoded.userId || decoded.id;

    if (!tokenUserId || !mongoose.Types.ObjectId.isValid(String(tokenUserId))) {
      return res.status(401).json({ error: 'Invalid token payload. Please log in again.' });
    }

    req.userId = String(tokenUserId);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
