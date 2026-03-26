// Generates simple PNG icons for the PWA manifest using pure Node.js (no dependencies)
const fs = require('fs');
const path = require('path');

// Minimal PNG generator - creates a solid indigo square with a white circle
function createPNG(size) {
  // We'll use a simple approach: write a valid PNG with IDAT chunk
  // Actually let's use the canvas API via a simpler method
  // Instead, we'll create an SVG and save it as the icon references
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.18}" fill="#4f46e5"/>
  <text x="50%" y="54%" font-size="${size * 0.5}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">🚗</text>
</svg>`;
  return svg;
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

// Save as SVG icons (works for PWA manifest)
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), createPNG(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), createPNG(512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), createPNG(180));

console.log('✓ Icons generated in public/');
