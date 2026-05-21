import { jsPDF } from 'jspdf';

const MARGIN = 5;
const PAGE_WIDTH = 80;
/** Small trailing space for thermal cutter — keeps feed length tight */
const BOTTOM_MARGIN = 6;

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

function drawDashedLine(doc, y, contentWidth) {
  doc.setLineDash([1, 1], 0);
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, MARGIN + contentWidth, y);
  doc.setLineDash([], 0);
}

function drawLabelValue(doc, y, label, value, fontSize, bold = false) {
  doc.setFont('courier', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.text(label, MARGIN, y);
  doc.text(String(value), PAGE_WIDTH - MARGIN, y, { align: 'right' });
  return y + (fontSize >= 10 ? 6 : 5);
}

function measureAddressHeight(doc, address, contentWidth) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(address || '', contentWidth);
  return lines.length * 4;
}

function getImageFormat(dataUrl) {
  if (dataUrl.includes('image/png')) return 'PNG';
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  return null;
}

/** Mirrors draw layout so page height matches content (no 200mm floor). */
function measureReceiptHeight(formData, measureDoc) {
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const hasRenderableLogo =
    formData.logoDataUrl && getImageFormat(formData.logoDataUrl);

  let y = MARGIN + 4;

  if (hasRenderableLogo) {
    y += 22;
  }

  y += 6; // station name
  y += measureAddressHeight(
    measureDoc,
    formData.fuelStationAddress,
    contentWidth
  );
  y += 2;
  y += 5; // FUEL RECEIPT
  y += 4; // dash
  y += 5 * (formatPaymentMethod(formData.paymentMethod) ? 4 : 3); // receipt no, date, time, payment
  y += 4;
  y += 5 * 3; // product, volume, rate
  y += 4;
  y += 6; // total amount
  y += 4;
  y += 5; // vehicle no
  y += 4;
  y += 6; // gap before footer
  y += 4 * 3; // footer lines

  return y + BOTTOM_MARGIN;
}

function wrapCenteredText(doc, text, y, maxWidth, fontSize, lineHeight) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line) => {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
    y += lineHeight;
  });
  return y;
}

export function generatePDF(formData, totalAmount) {
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const productLabel = (formData.productType || 'Petrol').toUpperCase();

  const measureDoc = new jsPDF({ unit: 'mm', format: [PAGE_WIDTH, 50] });
  const pageHeight = measureReceiptHeight(formData, measureDoc);

  const doc = new jsPDF({
    unit: 'mm',
    format: [PAGE_WIDTH, pageHeight],
  });

  doc.setFont('courier');
  doc.setTextColor(0, 0, 0);

  let y = MARGIN + 4;

  if (formData.logoDataUrl) {
    const format = getImageFormat(formData.logoDataUrl);
    if (format) {
      try {
        const logoWidth = 24;
        doc.addImage(
          formData.logoDataUrl,
          format,
          (PAGE_WIDTH - logoWidth) / 2,
          y,
          logoWidth,
          0
        );
        y += 22;
      } catch {
        // skip logo on failure
      }
    }
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text(
    (formData.fuelStationName || '').toUpperCase(),
    PAGE_WIDTH / 2,
    y,
    { align: 'center' }
  );
  y += 6;

  y = wrapCenteredText(
    doc,
    formData.fuelStationAddress || '',
    y,
    contentWidth,
    9,
    4
  );
  y += 2;

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('FUEL RECEIPT', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 5;

  drawDashedLine(doc, y, contentWidth);
  y += 4;

  doc.setFontSize(9);
  y = drawLabelValue(doc, y, 'RECEIPT NO:', formData.invoiceNumber, 9);
  y = drawLabelValue(doc, y, 'DATE:', formatReceiptDate(formData.fuelBillDate), 9);
  y = drawLabelValue(doc, y, 'TIME:', formatReceiptTime(formData.fuelBillTime), 9);
  const paymentLabel = formatPaymentMethod(formData.paymentMethod);
  if (paymentLabel) {
    y = drawLabelValue(doc, y, 'PAYMENT:', paymentLabel, 9);
  }

  drawDashedLine(doc, y, contentWidth);
  y += 4;

  y = drawLabelValue(doc, y, 'PRODUCT:', productLabel, 9);
  y = drawLabelValue(doc, y, 'VOLUME:', `${formData.volume} LTR`, 9);
  y = drawLabelValue(doc, y, 'RATE/LTR:', `Rs. ${formData.fuelRate}`, 9);

  drawDashedLine(doc, y, contentWidth);
  y += 4;

  y = drawLabelValue(
    doc,
    y,
    'TOTAL AMOUNT:',
    `Rs. ${Number(totalAmount).toFixed(2)}`,
    10,
    true
  );

  drawDashedLine(doc, y, contentWidth);
  y += 4;

  y = drawLabelValue(doc, y, 'VEHICLE NO:', formData.vehicleNumber, 9);

  drawDashedLine(doc, y, contentWidth);
  y += 6;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  [
    'POWERED BY TRISON',
    'THANKS FOR FUELLING WITH US',
    'VISIT AGAIN',
  ].forEach((line) => {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 4;
  });

  const filename = `fuel-receipt-${formData.invoiceNumber}.pdf`;
  doc.save(filename);

  return filename;
}
