const { body, validationResult } = require('express-validator');

// Validation Error Handler
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Register Validation Rules
exports.registerValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),
  
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
  
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 500 }).withMessage('Weight must be between 0 and 500 kg'),
  
  body('height')
    .optional()
    .isFloat({ min: 0, max: 300 }).withMessage('Height must be between 0 and 300 cm')
];

// Login Validation Rules
exports.loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Update Profile Validation Rules
exports.updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes'),
  
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150'),
  
  body('weight')
    .optional()
    .isFloat({ min: 0, max: 500 }).withMessage('Weight must be between 0 and 500 kg'),
  
  body('height')
    .optional()
    .isFloat({ min: 0, max: 300 }).withMessage('Height must be between 0 and 300 cm'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say']).withMessage('Invalid gender value'),
  
  body('medicalConditions')
    .optional()
    .isArray().withMessage('Medical conditions must be an array'),
  
  body('allergies')
    .optional()
    .isArray().withMessage('Allergies must be an array')
];

// Change Password Validation Rules
exports.changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match')
];

// Reset Password Validation Rules
exports.resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match')
];

// Emergency Contact Validation Rules
exports.emergencyContactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Contact name must be between 2 and 50 characters'),
  
  body('phone')
    .trim()
    .matches(/^[\d\s\+\-\(\)]+$/).withMessage('Please provide a valid phone number'),
  
  body('relation')
    .isIn(['family', 'friend', 'doctor', 'caregiver', 'emergency', 'other'])
    .withMessage('Invalid relation type')
];

// Device Validation Rules
exports.deviceValidation = [
  body('deviceId')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Device ID must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Device ID can only contain letters, numbers, hyphens and underscores'),
  
  body('deviceModel')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Device model cannot exceed 100 characters')
];

// Email Validation Rule
exports.emailValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Sanitize Input (prevent XSS)
exports.sanitizeInput = (req, res, next) => {
  const sanitizeHtml = require('sanitize-html');
  
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeHtml(obj[key], {
          allowedTags: [],
          allowedAttributes: {}
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };
  
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  
  next();
};
