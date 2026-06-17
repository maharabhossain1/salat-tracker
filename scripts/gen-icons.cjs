/* Generate PWA icons from the brand crescent+bead mark. Run: pnpm gen:icons */
const fs = require('fs');
const path = require('path');

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

const EMERALD = '#0d5c43';
const IVORY = '#f7f3e9';
const GOLD = '#c9a24b';

/**
 * Crescent+bead mark at 512×512 viewBox.
 * crescentFill: color of the crescent shape
 * beadFill: color of the bead (gold or same as crescent for monochrome favicon)
 */
function markSvg(crescentFill, beadFill) {
  return `
    <defs>
      <mask id="cm">
        <rect width="512" height="512" fill="#000"/>
        <circle cx="235" cy="256" r="180" fill="#fff"/>
        <circle cx="320" cy="256" r="158" fill="#000"/>
      </mask>
    </defs>
    <circle cx="235" cy="256" r="180" fill="${crescentFill}" mask="url(#cm)"/>
    <circle cx="291" cy="256" r="43" fill="${beadFill}"/>`;
}

function appIconSvg({ bg, crescentFill, beadFill, rounded, scale }) {
  const rx = rounded ? 112 : 0;
  // Scale the mark around the center (256, 256)
  const transform = scale !== 1
    ? `transform="translate(${256 * (1 - scale)}, ${256 * (1 - scale)}) scale(${scale})"`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rx}" fill="${bg}"/>
  <g ${transform}>${markSvg(crescentFill, beadFill)}</g>
</svg>`;
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// Full-color icons: emerald bg, ivory crescent, gold bead
const fullColor = appIconSvg({ bg: EMERALD, crescentFill: IVORY, beadFill: GOLD, rounded: true, scale: 0.78 });
// Maskable: same but mark smaller inside safe zone
const maskable = appIconSvg({ bg: EMERALD, crescentFill: IVORY, beadFill: GOLD, rounded: false, scale: 0.6 });
// Favicon: emerald bg, monochrome mark (no gold, ivory crescent reads on emerald)
const faviconSvg = appIconSvg({ bg: EMERALD, crescentFill: IVORY, beadFill: IVORY, rounded: true, scale: 0.78 });

const jobs = [
  { name: 'icon-192.png', size: 192, src: fullColor },
  { name: 'icon-512.png', size: 512, src: fullColor },
  { name: 'maskable-512.png', size: 512, src: maskable },
];

async function run() {
  for (const job of jobs) {
    await sharp(Buffer.from(job.src))
      .resize(job.size, job.size)
      .png()
      .toFile(path.join(outDir, job.name));
    console.log('wrote', job.name);
  }

  // Apple touch icon: no rounded corners (iOS handles that), full color
  const atc = appIconSvg({ bg: EMERALD, crescentFill: IVORY, beadFill: GOLD, rounded: false, scale: 0.78 });
  await sharp(Buffer.from(atc)).resize(180, 180).png()
    .toFile(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'));
  console.log('wrote apple-touch-icon.png');

  await sharp(Buffer.from(faviconSvg)).resize(32, 32).png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.png'));
  console.log('wrote favicon.png');
}

run().catch(e => { console.error(e); process.exit(1); });
