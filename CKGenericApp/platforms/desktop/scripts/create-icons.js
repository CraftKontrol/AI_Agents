const sharp = require('sharp');
const path = require('path');

async function resizeIcon() {
  const inputPath = path.join(__dirname, '../resources/icon.png');
  const outputPath = path.join(__dirname, '../resources/icon-256.png');
  
  try {
    await sharp(inputPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log('✓ Created 256x256 icon for Windows/macOS builds');
  } catch (err) {
    console.error('✗ Error resizing icon:', err);
    process.exit(1);
  }
}

resizeIcon();
