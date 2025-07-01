const { body, validationResult } = require("express-validator")
const { ApiError } = require("../utils/ApiError")

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg)
    throw new ApiError(400, errorMessages.join(", "))
  }
  next()
}

const validateSignup = [
  body("emri").trim().isLength({ min: 2, max: 50 }).withMessage("First name must be between 2 and 50 characters"),
  body("mbiemri").trim().isLength({ min: 2, max: 50 }).withMessage("Last name must be between 2 and 50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  handleValidationErrors,
]

const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
]

const validateWord = [
  body("word").trim().notEmpty().withMessage("Word is required"),
  body("translation").trim().notEmpty().withMessage("Translation is required"),
  body("level").isIn(["A1", "A2", "B1", "B2", "C1", "C2"]).withMessage("Level must be one of: A1, A2, B1, B2, C1, C2"),
  handleValidationErrors,
]

const validateCategory = [
  body("category").trim().notEmpty().withMessage("Category name is required"),
  body("words").isArray({ min: 1 }).withMessage("At least one word is required"),
  body("words.*.word").trim().notEmpty().withMessage("Word is required"),
  body("words.*.translation").trim().notEmpty().withMessage("Translation is required"),
  body("words.*.examples").isArray({ min: 1 }).withMessage("At least one example is required"),
  handleValidationErrors,
]

module.exports = {
  validateSignup,
  validateLogin,
  validateWord,
  validateCategory,
  handleValidationErrors,
}
