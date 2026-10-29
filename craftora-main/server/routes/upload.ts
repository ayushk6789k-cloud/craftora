import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Handcrafted photo curation presets or base64 storage
router.post('/', requireRole(['seller', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image_data, filename } = req.body;

    if (!image_data) {
      return res.status(400).json({ success: false, error: 'No image data received.' });
    }

    // If already a valid URL, return it
    if (typeof image_data === 'string' && (image_data.startsWith('http://') || image_data.startsWith('https://'))) {
      return res.json({
        success: true,
        data: { url: image_data },
      });
    }

    // In a full Supabase environment, this uploads to `supabase.storage.from('products').upload(...)`.
    // For standalone preview, return the base64 or curated artisan photo URL
    const url = image_data;

    return res.json({
      success: true,
      data: {
        url,
        filename: filename || 'artisan_handcrafted_upload.jpg',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
