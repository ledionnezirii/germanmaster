const path = require("path")
const fs = require("fs")

/**
 * Get the full URL for an image
 * @param {string} imagePath - The relative image path from database
 * @param {object} req - Express request object to get the base URL
 * @returns {string} - Full image URL
 */
const getImageUrl = (imagePath, req) => {
  if (!imagePath) return null

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http")) {
    return imagePath
  }

  // Get the base URL from the request
  const protocol = req.protocol
  const host = req.get("host")
  const baseUrl = `${protocol}://${host}`

  return `${baseUrl}${imagePath}`
}

/**
 * Check if image file exists
 * @param {string} imagePath - The relative image path
 * @returns {boolean} - Whether the file exists
 */
const imageExists = (imagePath) => {
  if (!imagePath) return false

  const fullPath = path.join(__dirname, "..", imagePath)
  return fs.existsSync(fullPath)
}

/**
 * Delete image file
 * @param {string} imagePath - The relative image path
 * @returns {boolean} - Whether the deletion was successful
 */
const deleteImage = (imagePath) => {
  if (!imagePath) return false

  try {
    const fullPath = path.join(__dirname, "..", imagePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      return true
    }
    return false
  } catch (error) {
    console.error("Error deleting image:", error)
    return false
  }
}

/**
 * Get image with proper CORS headers
 * @param {string} imagePath - The relative image path
 * @param {object} res - Express response object
 * @returns {void}
 */
const serveImageWithCORS = (imagePath, res) => {
  const fullPath = path.join(__dirname, "..", imagePath)

  // Set CORS headers
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET")
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.header("Cache-Control", "public, max-age=31536000") // 1 year cache

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: "Image not found" })
  }

  // Set content type based on file extension
  const ext = path.extname(imagePath).toLowerCase()
  const contentTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  }

  res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream")
  res.sendFile(fullPath)
}

module.exports = {
  getImageUrl,
  imageExists,
  deleteImage,
  serveImageWithCORS,
}
