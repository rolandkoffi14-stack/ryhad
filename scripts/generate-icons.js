const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const inputPath = path.join(__dirname, "../public/images/logo.jpg");
const outputDir = path.join(__dirname, "../public/icons");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log("Génération des icônes PWA depuis", inputPath);

  // 192x192
  await sharp(inputPath)
    .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(outputDir, "icon-192x192.png"));
  console.log("✓ icon-192x192.png généré");

  // 512x512
  await sharp(inputPath)
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(outputDir, "icon-512x512.png"));
  console.log("✓ icon-512x512.png généré");

  // 512x512 maskable (avec marge de sécurité)
  await sharp(inputPath)
    .resize(410, 410, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(outputDir, "icon-maskable-512x512.png"));
  console.log("✓ icon-maskable-512x512.png généré");

  // Apple touch icon (180x180)
  await sharp(inputPath)
    .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(outputDir, "apple-touch-icon.png"));
  console.log("✓ apple-touch-icon.png généré");

  // Favicon 48x48
  await sharp(inputPath)
    .resize(48, 48, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, "../public/favicon.png"));
  console.log("✓ favicon.png généré");
}

generateIcons().catch(console.error);
