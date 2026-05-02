import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({ field: err.path, message: err.msg })) 
    });
  }
  next();
};

export const expenseValidation = [
  body('amount')
    .isNumeric().withMessage('Amount must be a number')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
  body('category').notEmpty().withMessage('Category is required').trim(),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('description').optional().trim(),
];

export const authValidation = {
  login: [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  register: [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ]
};
