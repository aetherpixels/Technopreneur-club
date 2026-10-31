import fs from 'fs';
import path from 'path';

export const COLORS = {
  navy: '#0b2341',      // Deep premium navy
  gold: '#d4af37',      // Premium metallic gold
  goldLight: '#f3e5ab', // Light gold for subtle backgrounds
  textMain: '#1f2937',
  textSecondary: '#4b5563',
  lightGray: '#e5e7eb',
  creamWhite: '#FDFBF7' // Very light, premium cream white
};

export const registerFonts = (doc) => {
  const fontsDir = path.join(process.cwd(), 'assets', 'fonts');
  
  // Use PDFKit native serif fonts as the default professional fallbacks
  let titleFont = 'Times-Bold';
  let bodyFont = 'Times-Roman';
  let bodyFontBold = 'Times-Bold';
  let bodyFontItalic = 'Times-Italic';

  // Attempt to load custom TTF fonts if they exist
  if (fs.existsSync(path.join(fontsDir, 'PlayfairDisplay-Bold.ttf'))) {
    doc.registerFont('Playfair-Bold', path.join(fontsDir, 'PlayfairDisplay-Bold.ttf'));
    titleFont = 'Playfair-Bold';
  } else if (fs.existsSync(path.join(fontsDir, 'Cinzel-Bold.ttf'))) {
    doc.registerFont('Cinzel-Bold', path.join(fontsDir, 'Cinzel-Bold.ttf'));
    titleFont = 'Cinzel-Bold';
  }

  if (fs.existsSync(path.join(fontsDir, 'Lora-Regular.ttf'))) {
    doc.registerFont('Lora-Regular', path.join(fontsDir, 'Lora-Regular.ttf'));
    bodyFont = 'Lora-Regular';
  }
  if (fs.existsSync(path.join(fontsDir, 'Lora-Bold.ttf'))) {
    doc.registerFont('Lora-Bold', path.join(fontsDir, 'Lora-Bold.ttf'));
    bodyFontBold = 'Lora-Bold';
  }
  if (fs.existsSync(path.join(fontsDir, 'Lora-Italic.ttf'))) {
    doc.registerFont('Lora-Italic', path.join(fontsDir, 'Lora-Italic.ttf'));
    bodyFontItalic = 'Lora-Italic';
  }

  return { titleFont, bodyFont, bodyFontBold, bodyFontItalic };
};

export const isValidImage = (imageUrl) => {
  if (!imageUrl) return false;
  const imagePath = path.join(process.cwd(), imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl);
  return fs.existsSync(imagePath);
};

export const getImagePath = (imageUrl) => {
  if (!imageUrl) return null;
  return path.join(process.cwd(), imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl);
};
