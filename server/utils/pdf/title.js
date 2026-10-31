import { COLORS } from './helpers.js';

export const drawTitle = (doc, width, startY, height, config, fonts) => {
  const titleText = (config.title || 'CERTIFICATE OF PARTICIPATION').toUpperCase();

  doc.font(fonts.titleFont)
     .fontSize(28) // Scaled down to fit 53pt zone
     .fillColor(COLORS.navy)
     .text(titleText, 0, startY, {
       width: width,
       align: 'center'
     });

  // Decorative divider
  const dividerY = startY + 32;
  const dividerWidth = 350;
  const startX = (width - dividerWidth) / 2;

  doc.moveTo(startX, dividerY)
     .lineTo(startX + dividerWidth, dividerY)
     .lineWidth(1)
     .stroke(COLORS.gold);

  doc.circle(width / 2, dividerY, 3)
     .fill(COLORS.gold);

  doc.moveTo(startX, dividerY + 4)
     .lineTo(startX + dividerWidth, dividerY + 4)
     .lineWidth(0.5)
     .stroke(COLORS.gold);

  // Subtitle
  doc.font(fonts.bodyFontItalic || fonts.bodyFont)
     .fontSize(14) // Scaled down
     .fillColor(COLORS.textMain)
     .text("This Certificate is Proudly Presented To", 0, dividerY + 12, {
       width: width,
       align: 'center'
     });
};
