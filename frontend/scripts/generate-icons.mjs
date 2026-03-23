import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '..', 'public', 'icon-master.png');
const out = join(__dirname, '..', 'public');

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-16x16.png',    size: 16  },
  { name: 'favicon-32x32.png',    size: 32  },
  { name: 'icon-192x192.png',     size: 192 },
  { name: 'icon-512x512.png',     size: 512 },
];

console.log('Generating icons from', src);

for (const { name, size } of sizes) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(out, name));
  console.log(`  ✓ ${name} (${size}x${size})`);
}

// Generate favicon.ico using 16, 32, 48 sizes embedded as raw buffers
// ICO format: multi-resolution file with 16x16, 32x32, 48x48
const icoSizes = [16, 32, 48];
const pngBuffers = await Promise.all(
  icoSizes.map(size =>
    sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
  )
);

// Build ICO file manually
// ICO header: 6 bytes
// Each entry: 16 bytes
// Then PNG data concatenated
const numImages = icoSizes.length;
const headerSize = 6 + numImages * 16;

let offset = headerSize;
const entries = pngBuffers.map((buf, i) => {
  const size = icoSizes[i];
  const entry = { size, buf, offset };
  offset += buf.length;
  return entry;
});

const totalSize = offset;
const ico = Buffer.alloc(totalSize);

// ICO header
ico.writeUInt16LE(0, 0);       // Reserved
ico.writeUInt16LE(1, 2);       // Type: 1 = ICO
ico.writeUInt16LE(numImages, 4); // Image count

// Directory entries
entries.forEach(({ size, buf, offset: imgOffset }, i) => {
  const base = 6 + i * 16;
  ico.writeUInt8(size === 256 ? 0 : size, base);      // Width
  ico.writeUInt8(size === 256 ? 0 : size, base + 1);  // Height
  ico.writeUInt8(0, base + 2);   // Color palette
  ico.writeUInt8(0, base + 3);   // Reserved
  ico.writeUInt16LE(1, base + 4); // Color planes
  ico.writeUInt16LE(32, base + 6); // Bits per pixel
  ico.writeUInt32LE(buf.length, base + 8);  // Data size
  ico.writeUInt32LE(imgOffset, base + 12);  // Data offset
});

// Write image data
entries.forEach(({ buf, offset: imgOffset }) => {
  buf.copy(ico, imgOffset);
});

writeFileSync(join(out, 'favicon.ico'), ico);
console.log('  ✓ favicon.ico (16x16, 32x32, 48x48 multi-res)');
console.log('\nAll icons generated successfully!');
