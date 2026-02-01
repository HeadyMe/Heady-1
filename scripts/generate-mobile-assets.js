const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../apps/mobile/assets/images');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Simple 1x1 pixel PNG base64
const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const files = [
  'icon.png',
  'splash.png',
  'adaptive-icon.png',
  'favicon.png'
];

files.forEach(file => {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, png1x1);
    console.log(`Created ${file}`);
  }
});
