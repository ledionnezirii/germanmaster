const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token to get the user ID
    const user = await User.findById(decoded.id); // Find user in the database

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user; // Attach user to the request object
    next(); // Pass control to the next middleware/route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please refresh your token.' });
    }
    console.error(err);
    return res.status(401).json({ message: 'Token invalid' });
  }
};
