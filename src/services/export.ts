import { jsPDF } from 'jspdf';

export interface ExportOptions {
  fileName?: string;
  format: 'png' | 'jpg' | 'pdf';
  scale?: number;
}

/**
 * Converts an SVG element + personalization overlay to a high-resolution canvas
 */
export async function renderMapToCanvas(
  svgElement: SVGSVGElement,
  headerInfo?: {
    title: string;
    subtitle: string;
    userName: string;
    userPhoto?: string;
    textPosition: 'top' | 'bottom';
    textAlign: 'left' | 'center' | 'right';
    textColor: string;
    fontFamily: string;
  },
  backgroundColor = '#ffffff',
  targetWidth = 1400,
  targetHeight = 1750
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Draw Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. Clone SVG and serialize to clean XML string
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  svgClone.setAttribute('width', String(targetWidth));
  svgClone.setAttribute('height', String(targetHeight));

  // Ensure defs has font styling
  let defs = svgClone.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgClone.insertBefore(defs, svgClone.firstChild);
  }
  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
    text { font-family: 'Hind Siliguri', 'Plus Jakarta Sans', sans-serif; }
  `;
  defs.appendChild(styleEl);

  const svgData = new XMLSerializer().serializeToString(svgClone);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  const mapImg = new Image();
  await new Promise<void>((resolve, reject) => {
    mapImg.onload = () => resolve();
    mapImg.onerror = (e) => reject(e);
    mapImg.src = blobURL;
  });

  // Calculate layout space
  const isTopText = !headerInfo || headerInfo.textPosition === 'top';
  const headerHeight = 240;
  const mapY = isTopText ? headerHeight : 40;
  const mapAreaHeight = targetHeight - headerHeight - 60;

  // Draw the map
  ctx.drawImage(mapImg, 40, mapY, targetWidth - 80, mapAreaHeight);
  URL.revokeObjectURL(blobURL);

  // 3. Render Personalization Text & Brand Header
  if (headerInfo) {
    const textY = isTopText ? 90 : targetHeight - headerHeight + 50;
    const fontFam = headerInfo.fontFamily || 'Plus Jakarta Sans, sans-serif';

    ctx.fillStyle = headerInfo.textColor;

    let textX = targetWidth / 2;
    if (headerInfo.textAlign === 'left') textX = 80;
    if (headerInfo.textAlign === 'right') textX = targetWidth - 80;

    ctx.textAlign = headerInfo.textAlign;

    // Draw Title
    ctx.font = `bold 44px ${fontFam}`;
    ctx.fillText(headerInfo.title || 'My Bangladesh Journey', textX, textY);

    // Draw Subtitle / Stats
    ctx.font = `500 24px ${fontFam}`;
    ctx.globalAlpha = 0.85;
    ctx.fillText(headerInfo.subtitle || '', textX, textY + 45);
    ctx.globalAlpha = 1.0;

    // Draw User Name & Travel Badge
    if (headerInfo.userName) {
      ctx.font = `600 22px ${fontFam}`;
      ctx.fillText(`Created by ${headerInfo.userName}`, textX, textY + 85);
    }
  }

  // 4. Subtle watermark footer
  ctx.font = '16px Plus Jakarta Sans, sans-serif';
  ctx.fillStyle = headerInfo?.textColor || '#64748b';
  ctx.globalAlpha = 0.5;
  ctx.textAlign = 'center';
  ctx.fillText('Made with MapBD • Telegram Web App', targetWidth / 2, targetHeight - 20);
  ctx.globalAlpha = 1.0;

  return canvas;
}

/**
 * High-resolution export to PNG, JPG, or PDF
 */
export async function exportMap(
  svgElement: SVGSVGElement,
  options: ExportOptions,
  headerInfo?: any,
  backgroundColor = '#ffffff'
) {
  const canvas = await renderMapToCanvas(svgElement, headerInfo, backgroundColor);
  const baseName = options.fileName || `mapbd_${Date.now()}`;

  if (options.format === 'png') {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    downloadFile(dataUrl, `${baseName}.png`);
    return dataUrl;
  } else if (options.format === 'jpg') {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    downloadFile(dataUrl, `${baseName}.jpg`);
    return dataUrl;
  } else if (options.format === 'pdf') {
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    // Standard A4 portrait in mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${baseName}.pdf`);
    return imgData;
  }
}

function downloadFile(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
