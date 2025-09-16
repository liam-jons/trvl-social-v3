/**
 * Stripe Connect Files API - Handle document uploads for KYC
 * POST /api/stripe/connect/files - Upload document file
 * GET /api/stripe/connect/files/[id] - Get file details
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept specific file types for KYC documents
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'));
    }
  }
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      return await handleFileUpload(req, res);
    } else if (req.method === 'GET') {
      return await handleGetFile(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Files API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Upload document file to Stripe
 */
async function handleFileUpload(req, res) {
  return new Promise((resolve) => {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return resolve(res.status(400).json({
          error: 'File upload error',
          message: err.message,
        }));
      }

      if (!req.file) {
        return resolve(res.status(400).json({
          error: 'No file provided',
        }));
      }

      const { purpose = 'identity_document', account_id } = req.body;

      if (!account_id) {
        return resolve(res.status(400).json({
          error: 'Account ID is required',
        }));
      }

      try {
        // Upload file to Stripe
        const file = await stripe.files.create({
          purpose,
          file: {
            data: req.file.buffer,
            name: req.file.originalname,
            type: req.file.mimetype,
          },
        }, {
          stripeAccount: account_id,
        });

        resolve(res.status(200).json({
          success: true,
          file: {
            id: file.id,
            purpose: file.purpose,
            size: file.size,
            type: file.type,
            created: file.created,
            filename: file.filename,
          },
        }));
      } catch (error) {
        console.error('Error uploading file to Stripe:', error);
        resolve(res.status(400).json({
          error: 'Failed to upload file',
          message: error.message,
        }));
      }
    });
  });
}

/**
 * Get file details
 */
async function handleGetFile(req, res) {
  const { id } = req.query;
  const { account_id } = req.query;

  if (!id) {
    return res.status(400).json({
      error: 'File ID is required',
    });
  }

  try {
    const file = await stripe.files.retrieve(id, {
      stripeAccount: account_id,
    });

    return res.status(200).json({
      success: true,
      file: {
        id: file.id,
        purpose: file.purpose,
        size: file.size,
        type: file.type,
        created: file.created,
        filename: file.filename,
      },
    });
  } catch (error) {
    console.error('Error retrieving file:', error);
    return res.status(400).json({
      error: 'Failed to retrieve file',
      message: error.message,
    });
  }
}