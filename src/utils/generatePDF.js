import { jsPDF } from 'jspdf';

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

function normalizePaperSize(paperSize) {
  return Number(paperSize) === 58 ? 58 : 80;
}

function getProfile(paperSize) {
  const is58 = normalizePaperSize(paperSize) === 58;
  return {
    is58,
    pageWidth: is58 ? 58 : 80,
    margin: is58 ? 3 : 5,
    font: {
      station: is58 ? 10 : 12,
      address: is58 ? 7 : 9,
      heading: is58 ? 9 : 11,
      row: is58 ? 7 : 9,
      total: is58 ? 8 : 10,
      footer: is58 ? 6 : 8,
    },
    lineHeight: is58 ? 4 : 5,
    /** Space below each dashed bar before the next text row (baseline clearance) */
    gapAfterBar: is58 ? 3.5 : 4,
    logoWidth: is58 ? 16 : 22,
    gapAfterLogo: is58 ? 2 : 3,
    dashLineWidth: is58 ? 0.3 : 0.2,
    bottomMargin: 6,
    startY: 5,
  };
}

function getLabels(is58) {
  if (is58) {
    return {
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
  }
  return {
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
}

function getImageFormat(dataUrl) {
  if (dataUrl.includes('image/png')) return 'PNG';
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  return null;
}

function getLogoLayout(doc, dataUrl, profile) {
  try {
    const { width, height } = doc.getImageProperties(dataUrl);
    const heightMm = (profile.logoWidth * height) / width;
    return {
      heightMm,
      blockHeight: heightMm + profile.gapAfterLogo,
    };
  } catch {
    return null;
  }
}

function drawDashedLine(doc, profile, y, nextFontSize = profile.font.row) {
  const { margin, pageWidth, dashLineWidth, gapAfterBar, font } = profile;
  doc.setLineDash([1, 1], 0);
  doc.setDrawColor(0);
  doc.setLineWidth(dashLineWidth);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineDash([], 0);
  const extra = nextFontSize > font.row ? 0.5 : 0;
  return y + gapAfterBar + extra;
}

function drawLabelValue(doc, profile, y, label, value, fontSize, bold = false) {
  const { margin, pageWidth, lineHeight } = profile;
  doc.setFont('courier', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.text(label, margin, y);
  doc.text(String(value ?? ''), pageWidth - margin, y, { align: 'right' });
  return y + lineHeight;
}

function measureAddressHeight(doc, address, contentWidth, fontSize, lineHeight) {
  doc.setFont('courier', 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(address || '', contentWidth);
  return lines.length * (lineHeight - 1);
}

function countPaymentRows(formData) {
  let rows = 4; // receipt, date, time, nozzle
  if (formatPaymentMethod(formData.paymentMethod)) rows += 1;
  return rows;
}

function measureReceiptHeight(formData, measureDoc, profile, logoLayout) {
  const contentWidth = profile.pageWidth - profile.margin * 2;

  let y = profile.startY;

  if (logoLayout) {
    y += logoLayout.blockHeight;
  }

  y += profile.lineHeight; // station name
  y += measureAddressHeight(
    measureDoc,
    formData.fuelStationAddress,
    contentWidth,
    profile.font.address,
    profile.lineHeight
  );
  y += 1;
  y += profile.lineHeight; // FUEL RECEIPT
  y += profile.gapAfterBar;
  y += profile.lineHeight * countPaymentRows(formData);
  y += profile.gapAfterBar;
  y += profile.lineHeight * 3; // product, volume, rate
  y += profile.gapAfterBar + 0.5; // total row uses larger font
  y += profile.lineHeight; // total
  y += profile.gapAfterBar;
  y += profile.lineHeight * 2; // vehicle, customer
  y += profile.gapAfterBar;
  y += profile.lineHeight * 3; // footer

  return y + profile.bottomMargin;
}

function wrapCenteredText(doc, profile, text, y, fontSize) {
  const contentWidth = profile.pageWidth - profile.margin * 2;
  doc.setFont('courier', 'normal');
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, contentWidth);
  lines.forEach((line) => {
    doc.text(line, profile.pageWidth / 2, y, { align: 'center' });
    y += profile.lineHeight - 1;
  });
  return y;
}

export function generatePDF(formData, totalAmount) {
  const profile = getProfile(formData.paperSize);
  const labels = getLabels(profile.is58);
  const productLabel = (formData.productType || 'Petrol').toUpperCase();

  const measureDoc = new jsPDF({
    unit: 'mm',
    format: [profile.pageWidth, 50],
  });

  const logoFormat =
    formData.logoDataUrl && getImageFormat(formData.logoDataUrl);
  const logoLayout = logoFormat
    ? getLogoLayout(measureDoc, formData.logoDataUrl, profile)
    : null;

  const pageHeight = measureReceiptHeight(
    formData,
    measureDoc,
    profile,
    logoLayout
  );

  const doc = new jsPDF({
    unit: 'mm',
    format: [profile.pageWidth, pageHeight],
  });

  doc.setFont('courier');
  doc.setTextColor(0, 0, 0);

  let y = profile.startY;

  if (logoLayout && logoFormat) {
    try {
      doc.addImage(
        formData.logoDataUrl,
        logoFormat,
        (profile.pageWidth - profile.logoWidth) / 2,
        y,
        profile.logoWidth,
        logoLayout.heightMm
      );
      y += logoLayout.blockHeight;
    } catch {
      // skip logo on failure
    }
  }

  doc.setFont('courier', 'bold');
  doc.setFontSize(profile.font.station);
  doc.text(
    (formData.fuelStationName || '').toUpperCase(),
    profile.pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += profile.lineHeight;

  y = wrapCenteredText(
    doc,
    profile,
    formData.fuelStationAddress || '',
    y,
    profile.font.address
  );
  y += 1;

  doc.setFont('courier', 'bold');
  doc.setFontSize(profile.font.heading);
  doc.text('FUEL RECEIPT', profile.pageWidth / 2, y, { align: 'center' });
  y += profile.lineHeight;

  y = drawDashedLine(doc, profile, y, profile.font.row);

  y = drawLabelValue(
    doc,
    profile,
    y,
    labels.receiptNo,
    formData.invoiceNumber,
    profile.font.row
  );
  y = drawLabelValue(
    doc,
    profile,
    y,
    labels.date,
    formatReceiptDate(formData.fuelBillDate),
    profile.font.row
  );
  y = drawLabelValue(
    doc,
    profile,
    y,
    labels.time,
    formatReceiptTime(formData.fuelBillTime),
    profile.font.row
  );
  const paymentLabel = formatPaymentMethod(formData.paymentMethod);
  if (paymentLabel) {
    y = drawLabelValue(
      doc,
      profile,
      y,
      labels.payment,
      paymentLabel,
      profile.font.row
    );
  }
  y = drawLabelValue(
    doc,
    profile,
    y,
    labels.nozzleNo,
    formData.nozzleNo,
    profile.font.row
  );

  y = drawDashedLine(doc, profile, y, profile.font.row);

  y = drawLabelValue(doc, profile, y, labels.product, productLabel, profile.font.row);
  y = drawLabelValue(
    doc,
    profile,
    y,
    labels.volume,
    `${formData.volume} LTR`,
    profile.font.row
  );
  y = drawLabelValue(
    doc,
    profile,
    y,
    labels.rateLtr,
    `Rs. ${formData.fuelRate}`,
    profile.font.row
  );

  y = drawDashedLine(doc, profile, y, profile.font.total);

  y = drawLabelValue(
    doc,
    profile,
    y,
    labels.totalAmount,
    `Rs. ${Number(totalAmount).toFixed(2)}`,
    profile.font.total,
    true
  );

  y = drawDashedLine(doc, profile, y, profile.font.row);

  y = drawLabelValue(
    doc,
    profile,
    y,
    labels.vehicleNo,
    formData.vehicleNumber,
    profile.font.row
  );
  y = drawLabelValue(
    doc,
    profile,
    y,
    labels.customerName,
    formData.customerName,
    profile.font.row
  );

  y = drawDashedLine(doc, profile, y, profile.font.footer);

  doc.setFont('courier', 'normal');
  doc.setFontSize(profile.font.footer);
  const footerLines = profile.is58
    ? [
        'POWERED BY TRISON',
        'THANKS FOR FUELLING WITH US',
        'VISIT AGAIN',
      ]
    : [
        'POWERED BY TRISON',
        'THANKS FOR FUELLING WITH US',
        'VISIT AGAIN - 0303376453937',
      ];

  footerLines.forEach((line) => {
    doc.text(line, profile.pageWidth / 2, y, { align: 'center' });
    y += profile.lineHeight - 1;
  });

  const suffix = profile.is58 ? '58mm' : '80mm';
  const filename = `fuel-receipt-${formData.invoiceNumber}-${suffix}.pdf`;
  doc.save(filename);

  return filename;
}
