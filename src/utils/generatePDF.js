import { jsPDF } from 'jspdf';

/** SpeedX 400 — 80mm thermal roll (6mm safe margins, 68mm content) */
const PROFILE = {
  pageWidth: 80,
  margin: 6,
  contentWidth: 68,
  font: {
    station: 12,
    address: 8,
    heading: 11,
    row: 9,
    total: 10,
    footer: 7,
  },
  lineHeight: 5,
  gapAfterBar: 4,
  gapAfterLogo: 3,
  logoWidth: 20,
  logoMaxHeight: 20,
  dashLineWidth: 0.4,
  dashPattern: [1.5, 1],
  bottomMargin: 10,
  startY: 8,
};

const LABELS = {
  receiptNo: 'RECEIPT NO:',
  date: 'DATE:',
  time: 'TIME:',
  payment: 'PAYMENT:',
  nozzleNo: 'NOZZLE NO:',
  product: 'PRODUCT:',
  volume: 'VOLUME:',
  rateLtr: 'RATE/LTR:',
  totalAmount: 'TOTAL AMOUNT:',
  vehicleNo: 'VEHICLE NO:',
  customerName: 'CUSTOMER NAME:',
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatReceiptDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const day = String(d).padStart(2, '0');
  return `${day} ${MONTHS[m - 1]} ${y}`;
}

export function formatReceiptTime(timeValue) {
  if (!timeValue) return '';
  const [h24, m] = timeValue.split(':').map(Number);
  if (isNaN(h24)) return timeValue;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${period}`;
}

export function formatPaymentMethod(method) {
  if (!method || method === 'None') return null;
  return method.toUpperCase();
}

function getImageFormat(dataUrl) {
  if (dataUrl.includes('image/png')) return 'PNG';
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  return null;
}

function getLogoLayout(doc, dataUrl) {
  try {
    const { width, height } = doc.getImageProperties(dataUrl);
    let widthMm = PROFILE.logoWidth;
    let heightMm = (widthMm * height) / width;

    if (heightMm > PROFILE.logoMaxHeight) {
      heightMm = PROFILE.logoMaxHeight;
      widthMm = (heightMm * width) / height;
    }

    return {
      widthMm,
      heightMm,
      blockHeight: heightMm + PROFILE.gapAfterLogo,
    };
  } catch {
    return null;
  }
}

function drawDashedLine(doc, y, nextFontSize = PROFILE.font.row) {
  const { margin, pageWidth, dashLineWidth, dashPattern, gapAfterBar, font } =
    PROFILE;
  doc.setDrawColor(0, 0, 0);
  doc.setLineDash(dashPattern, 0);
  doc.setLineWidth(dashLineWidth);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDash([], 0);
  const extra = nextFontSize > font.row ? 0.5 : 0;
  return y + gapAfterBar + extra;
}

function drawLabelValue(doc, y, label, value, fontSize, bold = false) {
  const { margin, pageWidth, lineHeight } = PROFILE;
  doc.setFont('courier', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.text(label, margin, y);
  doc.text(String(value ?? ''), pageWidth - margin, y, { align: 'right' });
  return y + lineHeight;
}

function measureAddressHeight(doc, address) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(PROFILE.font.address);
  const lines = doc.splitTextToSize(address || '', PROFILE.contentWidth);
  return lines.length * (PROFILE.lineHeight - 1);
}

function countPaymentRows(formData) {
  let rows = 4;
  if (formatPaymentMethod(formData.paymentMethod)) rows += 1;
  return rows;
}

function measureReceiptHeight(formData, measureDoc, logoLayout) {
  let y = PROFILE.startY;

  if (logoLayout) y += logoLayout.blockHeight;

  y += PROFILE.lineHeight;
  y += measureAddressHeight(measureDoc, formData.fuelStationAddress);
  y += 1;
  y += PROFILE.lineHeight;
  y += PROFILE.gapAfterBar;
  y += PROFILE.lineHeight * countPaymentRows(formData);
  y += PROFILE.gapAfterBar;
  y += PROFILE.lineHeight * 3;
  y += PROFILE.gapAfterBar + 0.5;
  y += PROFILE.lineHeight;
  y += PROFILE.gapAfterBar;
  y += PROFILE.lineHeight * 2;
  y += PROFILE.gapAfterBar;
  y += PROFILE.lineHeight * 3;

  return y + PROFILE.bottomMargin + 1;
}

function wrapCenteredText(doc, text, y, fontSize) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, PROFILE.contentWidth);
  lines.forEach((line) => {
    doc.text(line, PROFILE.pageWidth / 2, y, { align: 'center' });
    y += PROFILE.lineHeight - 1;
  });
  return y;
}

export function generatePDF(formData, totalAmount) {
  const productLabel = (formData.productType || 'Petrol').toUpperCase();

  const measureDoc = new jsPDF({
    unit: 'mm',
    format: [PROFILE.pageWidth, 50],
  });

  const logoFormat =
    formData.logoDataUrl && getImageFormat(formData.logoDataUrl);
  const logoLayout = logoFormat
    ? getLogoLayout(measureDoc, formData.logoDataUrl)
    : null;

  const pageHeight = measureReceiptHeight(formData, measureDoc, logoLayout);

  const doc = new jsPDF({
    unit: 'mm',
    format: [PROFILE.pageWidth, pageHeight],
  });

  doc.setFont('courier');
  doc.setTextColor(0, 0, 0);

  let y = PROFILE.startY;

  if (logoLayout && logoFormat) {
    try {
      doc.addImage(
        formData.logoDataUrl,
        logoFormat,
        (PROFILE.pageWidth - logoLayout.widthMm) / 2,
        y,
        logoLayout.widthMm,
        logoLayout.heightMm
      );
      y += logoLayout.blockHeight;
    } catch {
      // skip logo on failure
    }
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(PROFILE.font.station);
  doc.text(
    (formData.fuelStationName || '').toUpperCase(),
    PROFILE.pageWidth / 2,
    y,
    { align: 'center', maxWidth: PROFILE.contentWidth }
  );
  y += PROFILE.lineHeight;

  y = wrapCenteredText(
    doc,
    formData.fuelStationAddress || '',
    y,
    PROFILE.font.address
  );
  y += 1;

  doc.setFont('courier', 'bold');
  doc.setFontSize(PROFILE.font.heading);
  doc.text('FUEL RECEIPT', PROFILE.pageWidth / 2, y, { align: 'center' });
  y += PROFILE.lineHeight;

  y = drawDashedLine(doc, y, PROFILE.font.row);

  y = drawLabelValue(
    doc,
    y,
    LABELS.receiptNo,
    formData.invoiceNumber,
    PROFILE.font.row
  );
  y = drawLabelValue(
    doc,
    y,
    LABELS.date,
    formatReceiptDate(formData.fuelBillDate),
    PROFILE.font.row
  );
  y = drawLabelValue(
    doc,
    y,
    LABELS.time,
    formatReceiptTime(formData.fuelBillTime),
    PROFILE.font.row
  );
  const paymentLabel = formatPaymentMethod(formData.paymentMethod);
  if (paymentLabel) {
    y = drawLabelValue(doc, y, LABELS.payment, paymentLabel, PROFILE.font.row);
  }
  y = drawLabelValue(doc, y, LABELS.nozzleNo, formData.nozzleNo, PROFILE.font.row);

  y = drawDashedLine(doc, y, PROFILE.font.row);

  y = drawLabelValue(doc, y, LABELS.product, productLabel, PROFILE.font.row);
  y = drawLabelValue(
    doc,
    y,
    LABELS.volume,
    `${formData.volume} LTR`,
    PROFILE.font.row
  );
  y = drawLabelValue(
    doc,
    y,
    LABELS.rateLtr,
    `Rs. ${formData.fuelRate}`,
    PROFILE.font.row
  );

  y = drawDashedLine(doc, y, PROFILE.font.total);

  y = drawLabelValue(
    doc,
    y,
    LABELS.totalAmount,
    `Rs. ${Number(totalAmount).toFixed(2)}`,
    PROFILE.font.total,
    true
  );

  y = drawDashedLine(doc, y, PROFILE.font.row);

  y = drawLabelValue(
    doc,
    y,
    LABELS.vehicleNo,
    formData.vehicleNumber,
    PROFILE.font.row
  );
  y = drawLabelValue(
    doc,
    y,
    LABELS.customerName,
    formData.customerName,
    PROFILE.font.row
  );

  y = drawDashedLine(doc, y, PROFILE.font.footer);
  y += 1;

  doc.setFont('courier', 'normal');
  doc.setFontSize(PROFILE.font.footer);
  [
    'POWERED BY TRISON',
    'THANKS FOR FUELLING WITH US',
    'VISIT AGAIN - 0303376453937',
  ].forEach((line) => {
    doc.text(line, PROFILE.pageWidth / 2, y, { align: 'center' });
    y += PROFILE.lineHeight - 1;
  });

  const filename = `fuel-receipt-${formData.invoiceNumber}.pdf`;
  doc.save(filename);

  return filename;
}
