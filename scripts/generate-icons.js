const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create SVG template for icon
const createIconSVG = (size, text = 'FF') => {
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central"
      >${text}</text>
    </svg>
  `;
};

// Generate icons
async function generateIcons() {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    const svg = createIconSVG(size);
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Created ${outputPath}`);
  }
  
  console.log('\n✅ All PWA icons generated successfully!');
}

generateIcons().catch(console.error);

