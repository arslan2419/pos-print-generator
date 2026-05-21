import { jsPDF } from 'jspdf';

/**
 * SpeedX 400 + POS58 driver
 * 58mm paper, 48mm printable — driver: 48mm × 3276mm (203dpi)
 */
const PAGE_WIDTH = 58;
const MARGIN = 7;
const RIGHT_EDGE = 51;
const CONTENT_WIDTH = 44;
const CENTER = PAGE_WIDTH / 2;

const FONT = {
  station: 9,
  address: 7,
  heading: 9,
  row: 7,
  total: 8,
  footer: 6,
};

const LINE_H = 3.8;
const GAP = 2.5;
const GAP_AFTER_LOGO = 2;

const LABELS = {
  receiptNo: 'RCPT NO:',
  date: 'DATE:',
  time: 'TIME:',
  payment: 'PAYMENT:',
  nozzleNo: 'NOZZLE:',
  product: 'PRODUCT:',
  volume: 'VOLUME:',
  rateLtr: 'RATE/LTR:',
  totalAmount: 'TOTAL:',
  vehicleNo: 'VEHICLE:',
  customerName: 'CUSTOMER:',
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const LOGO_WIDTH = 14;
const LOGO_MAX_HEIGHT = 14;

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
    let widthMm = LOGO_WIDTH;
    let heightMm = (widthMm * height) / width;

    if (heightMm > LOGO_MAX_HEIGHT) {
      heightMm = LOGO_MAX_HEIGHT;
      widthMm = (heightMm * width) / height;
    }

    return {
      widthMm,
      heightMm,
      blockHeight: heightMm + GAP_AFTER_LOGO,
    };
  } catch {
    return null;
  }
}

function drawSeparator(doc, y) {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setLineDash([1.2, 0.8], 0);
  doc.line(MARGIN, y, RIGHT_EDGE, y);
  doc.setLineDash([], 0);
  return y + GAP;
}

function drawRow(doc, y, label, value, fontSize = FONT.row, bold = false) {
  doc.setFont('courier', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.text(label, MARGIN, y);
  doc.text(String(value ?? ''), RIGHT_EDGE, y, { align: 'right' });
  return y + LINE_H;
}

function measureWrappedLines(doc, text, fontSize, maxWidth) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text || '', maxWidth).length;
}

function countSection1Rows(formData) {
  let rows = 3;
  if (formatPaymentMethod(formData.paymentMethod)) rows += 1;
  rows += 1; // nozzle
  return rows;
}

function measureReceiptHeight(formData, measureDoc, logoLayout) {
  let h = 6;

  if (logoLayout) h += logoLayout.blockHeight;

  doc.setFont('courier', 'bold');
  doc.setFontSize(FONT.station);
  const nameLines = measureWrappedLines(
    measureDoc,
    (formData.fuelStationName || '').toUpperCase(),
    FONT.station,
    CONTENT_WIDTH
  );
  h += LINE_H * nameLines;

  const addrLines = measureWrappedLines(
    measureDoc,
    formData.fuelStationAddress || '',
    FONT.address,
    CONTENT_WIDTH
  );
  h += (LINE_H - 0.5) * Math.max(addrLines, 1);
  h += 0.5;
  h += LINE_H;
  h += GAP;
  h += LINE_H * countSection1Rows(formData);
  h += GAP;
  h += LINE_H * 3;
  h += GAP;
  h += LINE_H;
  h += GAP;
  h += LINE_H * 2;
  h += GAP;
  h += (LINE_H - 0.5) * 3;
  h += 10;

  return h;
}

export function generatePDF(formData, totalAmount) {
  const productLabel = (formData.productType || 'Petrol').toUpperCase();

  const measureDoc = new jsPDF({ unit: 'mm', format: [PAGE_WIDTH, 50] });

  const logoFormat =
    formData.logoDataUrl && getImageFormat(formData.logoDataUrl);
  const logoLayout = logoFormat
    ? getLogoLayout(measureDoc, formData.logoDataUrl)
    : null;

  const pageHeight = measureReceiptHeight(formData, measureDoc, logoLayout);

  const doc = new jsPDF({
    unit: 'mm',
    format: [PAGE_WIDTH, pageHeight],
  });

  doc.setFont('courier');
  doc.setTextColor(0, 0, 0);

  let y = 6;

  if (logoLayout && logoFormat) {
    try {
      doc.addImage(
        formData.logoDataUrl,
        logoFormat,
        (PAGE_WIDTH - logoLayout.widthMm) / 2,
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
  doc.setFontSize(FONT.station);
  const nameLines = doc.splitTextToSize(
    (formData.fuelStationName || '').toUpperCase(),
    CONTENT_WIDTH
  );
  nameLines.forEach((line) => {
    doc.text(line, CENTER, y, { align: 'center' });
    y += LINE_H;
  });

  doc.setFont('courier', 'normal');
  doc.setFontSize(FONT.address);
  const addressLines = doc.splitTextToSize(
    formData.fuelStationAddress || '',
    CONTENT_WIDTH
  );
  addressLines.forEach((line) => {
    doc.text(line, CENTER, y, { align: 'center' });
    y += LINE_H - 0.5;
  });
  y += 0.5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(FONT.heading);
  doc.text('FUEL RECEIPT', CENTER, y, { align: 'center' });
  y += LINE_H;

  y = drawSeparator(doc, y);

  y = drawRow(doc, y, LABELS.receiptNo, formData.invoiceNumber);
  y = drawRow(doc, y, LABELS.date, formatReceiptDate(formData.fuelBillDate));
  y = drawRow(doc, y, LABELS.time, formatReceiptTime(formData.fuelBillTime));

  const paymentLabel = formatPaymentMethod(formData.paymentMethod);
  if (paymentLabel) {
    y = drawRow(doc, y, LABELS.payment, paymentLabel);
  }
  y = drawRow(doc, y, LABELS.nozzleNo, formData.nozzleNo);

  y = drawSeparator(doc, y);

  y = drawRow(doc, y, LABELS.product, productLabel);
  y = drawRow(doc, y, LABELS.volume, `${formData.volume} LTR`);
  y = drawRow(doc, y, LABELS.rateLtr, `Rs. ${formData.fuelRate}`);

  y = drawSeparator(doc, y);

  y = drawRow(
    doc,
    y,
    LABELS.totalAmount,
    `Rs. ${Number(totalAmount).toFixed(2)}`,
    FONT.total,
    true
  );

  y = drawSeparator(doc, y);

  y = drawRow(doc, y, LABELS.vehicleNo, formData.vehicleNumber);
  y = drawRow(doc, y, LABELS.customerName, formData.customerName);

  y = drawSeparator(doc, y);
  y += 2;

  doc.setFont('courier', 'normal');
  doc.setFontSize(FONT.footer);
  doc.text('POWERED BY TRISON', CENTER, y, { align: 'center' });
  y += LINE_H - 0.5;
  doc.text('THANKS FOR FUELLING WITH US', CENTER, y, { align: 'center' });
  y += LINE_H - 0.5;
  doc.text('VISIT AGAIN', CENTER, y, { align: 'center' });

  const filename = `fuel-receipt-${formData.invoiceNumber}.pdf`;
  doc.save(filename);

  return filename;
}
