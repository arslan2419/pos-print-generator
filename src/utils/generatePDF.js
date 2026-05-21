import { jsPDF } from 'jspdf';

/** 80mm thermal roll — width matches paper so drivers do not shrink-to-fit */
const PAGE_WIDTH = 80;
/** Minimal side margin = use full printable width (reference POS receipt) */
const MARGIN = 1.5;
/** Small trailing space for thermal cutter — keeps feed length tight */
const BOTTOM_MARGIN = 4;

const FONT = {
  station: 15,
  address: 10,
  receiptTitle: 13,
  body: 11,
  total: 13,
  footer: 9,
};

const LOGO_WIDTH = 32;
const LOGO_BLOCK_HEIGHT = 28;

function lineStep(fontSize) {
  return fontSize >= 13 ? 7 : 6;
}

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
  return y + lineStep(fontSize);
}

function measureAddressHeight(doc, address, contentWidth) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(FONT.address);
  const lines = doc.splitTextToSize(address || '', contentWidth);
  return lines.length * 4.5;
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
    y += LOGO_BLOCK_HEIGHT;
  }

  y += lineStep(FONT.station);
  y += measureAddressHeight(
    measureDoc,
    formData.fuelStationAddress,
    contentWidth
  );
  y += 2;
  y += lineStep(FONT.receiptTitle);
  y += 4; // dash
  y += lineStep(FONT.body) * (formatPaymentMethod(formData.paymentMethod) ? 5 : 4);
  y += 4;
  y += lineStep(FONT.body) * 3;
  y += 4;
  y += lineStep(FONT.total);
  y += 4;
  y += lineStep(FONT.body) * 2;
  y += 4;
  y += 6;
  y += 4.5 * 3;

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
        doc.addImage(
          formData.logoDataUrl,
          format,
          (PAGE_WIDTH - LOGO_WIDTH) / 2,
          y,
          LOGO_WIDTH,
          0
        );
        y += LOGO_BLOCK_HEIGHT;
      } catch {
        // skip logo on failure
      }
    }
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(FONT.station);
  doc.text(
    (formData.fuelStationName || '').toUpperCase(),
    PAGE_WIDTH / 2,
    y,
    { align: 'center' }
  );
  y += lineStep(FONT.station);

  y = wrapCenteredText(
    doc,
    formData.fuelStationAddress || '',
    y,
    contentWidth,
    FONT.address,
    4.5
  );
  y += 2;

  doc.setFont('courier', 'bold');
  doc.setFontSize(FONT.receiptTitle);
  doc.text('FUEL RECEIPT', PAGE_WIDTH / 2, y, { align: 'center' });
  y += lineStep(FONT.receiptTitle);

  drawDashedLine(doc, y, contentWidth);
  y += 4;

  y = drawLabelValue(doc, y, 'RECEIPT NO:', formData.invoiceNumber, FONT.body);
  y = drawLabelValue(doc, y, 'DATE:', formatReceiptDate(formData.fuelBillDate), FONT.body);
  y = drawLabelValue(doc, y, 'TIME:', formatReceiptTime(formData.fuelBillTime), FONT.body);
  const paymentLabel = formatPaymentMethod(formData.paymentMethod);
  if (paymentLabel) {
    y = drawLabelValue(doc, y, 'PAYMENT:', paymentLabel, FONT.body);
  }
  y = drawLabelValue(doc, y, 'NOZZLE NO:', formData.nozzleNo, FONT.body);

  drawDashedLine(doc, y, contentWidth);
  y += 4;

  y = drawLabelValue(doc, y, 'PRODUCT:', productLabel, FONT.body);
  y = drawLabelValue(doc, y, 'VOLUME:', `${formData.volume} LTR`, FONT.body);
  y = drawLabelValue(doc, y, 'RATE/LTR:', `Rs. ${formData.fuelRate}`, FONT.body);

  drawDashedLine(doc, y, contentWidth);
  y += 4;

  y = drawLabelValue(
    doc,
    y,
    'TOTAL AMOUNT:',
    `Rs. ${Number(totalAmount).toFixed(2)}`,
    FONT.total,
    true
  );

  drawDashedLine(doc, y, contentWidth);
  y += 4;

  y = drawLabelValue(doc, y, 'VEHICLE NO:', formData.vehicleNumber, FONT.body);
  y = drawLabelValue(doc, y, 'CUSTOMER NAME:', formData.customerName, FONT.body);

  drawDashedLine(doc, y, contentWidth);
  y += 6;

  doc.setFont('courier', 'normal');
  doc.setFontSize(FONT.footer);
  [
    'POWERED BY TRISON',
    'THANKS FOR FUELLING WITH US',
    'VISIT AGAIN - 0303376453937',
  ].forEach((line) => {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 4.5;
  });

  const filename = `fuel-receipt-${formData.invoiceNumber}.pdf`;
  doc.save(filename);

  return filename;
}
