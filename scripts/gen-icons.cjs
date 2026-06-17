/* Generate PWA icons from an SVG crescent mark. Run: pnpm gen:icons */
const fs = require('fs');
const path = require('path');

// sharp ships as a transitive (pnpm) dep — resolve it from the pnpm store if
// it isn't directly require-able.
function loadSharp() {
  try {
    return require('sharp');
  } catch {
    const store = path.join(__dirname, '..', 'node_modules', '.pnpm');
    const dir = fs.readdirSync(store).find(d => d.startsWith('sharp@'));
    if (!dir) throw new Error('sharp not found in node_modules/.pnpm');
    return require(path.join(store, dir, 'node_modules', 'sharp'));
  }
}
const sharp = loadSharp();

const GREEN = '#0d5c43';
const GREEN_2 = '#0a4a37';

/** Crescent + sparkle centered in a `size`-wide viewBox, scaled by `s` (0..1). */
function mark(scale) {
  const cx = 256;
  const cy = 256;
  const r = 150 * scale;
  const offset = 58 * scale;
  return `
    <g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>
      <circle cx="${cx + offset}" cy="${cy - offset * 0.7}" r="${r * 0.92}" fill="var(--bg)"/>
      <g fill="#ffffff">
        <path d="M ${cx + 96 * scale} ${cy - 86 * scale}
                 l ${10 * scale} ${26 * scale} l ${27 * scale} ${2 * scale}
                 l ${-21 * scale} ${17 * scale} l ${7 * scale} ${26 * scale}
                 l ${-23 * scale} ${-15 * scale} l ${-23 * scale} ${15 * scale}
                 l ${7 * scale} ${-26 * scale} l ${-21 * scale} ${-17 * scale}
                 l ${27 * scale} ${-2 * scale} z"/>
      </g>
    </g>`;
}

function svg({ rounded, scale }) {
  const rx = rounded ? 112 : 0;
  // Inline the bg color (CSS vars don't render in sharp); replace var(--bg).
  const body = mark(scale).replace(/var\(--bg\)/g, GREEN);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${GREEN}"/>
        <stop offset="1" stop-color="${GREEN_2}"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="${rx}" fill="url(#g)"/>
    ${body}
  </svg>`;
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const jobs = [
  { name: 'icon-192.png', size: 192, svg: svg({ rounded: true, scale: 0.78 }) },
  { name: 'icon-512.png', size: 512, svg: svg({ rounded: true, scale: 0.78 }) },
  // Maskable: full-bleed background, mark kept inside the ~80% safe zone.
  { name: 'maskable-512.png', size: 512, svg: svg({ rounded: false, scale: 0.6 }) },
];

async function run() {
  for (const job of jobs) {
    await sharp(Buffer.from(job.svg)).resize(job.size, job.size).png().toFile(path.join(outDir, job.name));
    console.log('wrote', job.name);
  }
  // Apple touch icon (180, opaque, rounded handled by iOS).
  await sharp(Buffer.from(svg({ rounded: false, scale: 0.78 })))
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'));
  console.log('wrote apple-touch-icon.png');
  // Favicon-ish 32 for app/icon fallback.
  await sharp(Buffer.from(svg({ rounded: true, scale: 0.78 })))
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.png'));
  console.log('wrote favicon.png');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
