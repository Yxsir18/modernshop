import { Router } from 'express';
import multer from 'multer';
import { uploadImage, uploadMultipleImages, deleteImage, deleteMultipleImages } from '../config/cloudinary';
import { authenticateToken, requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * Upload single image (simple endpoint for frontend compatibility)
 */
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { folder } = req.body;
    const result = await uploadImage(req.file.buffer, folder || 'uploads');
    res.json({ url: result.url, publicId: result.publicId });
  } catch (error: any) {
    console.error('[UPLOAD] Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * Upload single image (for avatars, banners, etc.)
 */
router.post('/single', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { folder } = req.body;
    if (!folder) {
      return res.status(400).json({ error: 'Folder is required' });
    }

    const result = await uploadImage(req.file.buffer, folder);
    res.json({ url: result.url, publicId: result.publicId });
  } catch (error: any) {
    console.error('[UPLOAD] Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

/**
 * Upload multiple images (for products, reviews)
 */
router.post('/multiple', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const { folder } = req.body;
    if (!folder) {
      return res.status(400).json({ error: 'Folder is required' });
    }

    const buffers = req.files.map((file: any) => file.buffer);
    const results = await uploadMultipleImages(buffers, folder);
    
    res.json({ images: results });
  } catch (error: any) {
    console.error('[UPLOAD] Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

/**
 * Delete image
 */
router.delete('/image/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    await deleteImage(publicId);
    res.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('[UPLOAD] Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

/**
 * Delete multiple images
 */
router.post('/delete-multiple', authenticateToken, async (req, res) => {
  try {
    const { publicIds } = req.body;
    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({ error: 'Public IDs are required' });
    }

    await deleteMultipleImages(publicIds);
    res.json({ message: 'Images deleted successfully' });
  } catch (error: any) {
    console.error('[UPLOAD] Error deleting images:', error);
    res.status(500).json({ error: 'Failed to delete images' });
  }
});

export default router;
