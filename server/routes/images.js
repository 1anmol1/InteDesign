const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Cache directory for resized images
const CACHE_DIR = path.join(__dirname, '../cache/images');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Image resizing route
 * Usage: /api/images/resize?path=/uploads/hero.jpg&w=800&q=80
 */
router.get('/resize', async (req, res) => {
  const { path: imgPath, w, q } = req.query;

  if (!imgPath) {
    return res.status(400).send('Image path is required');
  }

  // Security: Prevent path traversal
  const normalizedPath = path.normalize(imgPath).replace(/^(\.\.(\/|\\|$))+/, '');
  
  let absolutePath;
  // Handle leading slashes for startsWith check
  const checkPath = normalizedPath.startsWith('/') || normalizedPath.startsWith('\\') 
    ? normalizedPath.slice(1) 
    : normalizedPath;

  if (checkPath.startsWith('images')) {
    absolutePath = path.join(__dirname, '../../client/public', checkPath);
  } else {
    absolutePath = path.join(__dirname, '../', normalizedPath);
  }

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).send('Image not found');
  }

  const width = parseInt(w) || 800;
  const quality = parseInt(q) || 80;
  
  // Generate cache filename
  const ext = path.extname(absolutePath);
  const baseName = path.basename(absolutePath, ext);
  const cacheFilename = `${baseName}_w${width}_q${quality}${ext}`;
  const cachePath = path.join(CACHE_DIR, cacheFilename);

  try {
    // Check if cached version exists
    if (fs.existsSync(cachePath)) {
      return res.sendFile(cachePath);
    }

    // Resize and save to cache
    await sharp(absolutePath)
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality }) // Convert to WebP for better compression
      .toFile(cachePath.replace(ext, '.webp'));

    res.sendFile(cachePath.replace(ext, '.webp'));
  } catch (err) {
    console.error('Image resize error:', err);
    res.status(500).send('Error processing image');
  }
});

/**
 * Image proxy route to hide external URLs
 * Usage: /api/images/proxy?url=BASE64_ENCODED_URL
 */
router.get('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send('URL is required');
  }

  try {
    // Decode URL if it's base64 encoded
    let decodedUrl = url;
    try {
      // Check if it's likely base64 (very basic check)
      if (!url.startsWith('http')) {
        decodedUrl = Buffer.from(url, 'base64').toString('utf-8');
      }
    } catch (e) {
      // If decoding fails, assume it was not encoded
    }

    const axios = require('axios');
    const response = await axios({
      method: 'get',
      url: decodedUrl,
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Phantasia-Studio/1.0 (+https://phantasia.studio)'
      }
    });

    // Handle potential errors from the destination
    if (response.status !== 200) {
      return res.status(response.status).send('External image error');
    }

    // Pass through content-type
    const contentType = response.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Cache control
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours

    response.data.pipe(res);
  } catch (err) {
    console.error('Image proxy error:', err.message);
    res.status(500).send('Error proxying image');
  }
});

module.exports = router;
