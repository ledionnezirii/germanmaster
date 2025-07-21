const jwt = require("jsonwebtoken")

const generateToken = (id, emri) => {
  // Added 'emri' parameter
  return jwt.sign(
    {
      id,
      username: emri, // Include 'emri' as 'username' for socket.io
      emri: emri, // Also include 'emri' explicitly
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
  )
}

module.exports = { generateToken }
