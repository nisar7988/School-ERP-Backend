import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

// ── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  primary: '#1E3A5F', // deep navy
  accent: '#2E86AB', // steel blue
  light: '#F0F4F8', // very light blue-grey (stripe bg)
  border: '#D0DCE8', // muted border
  success: '#1A7F5A', // paid / green
  successBg: '#E6F4EE',
  warning: '#B45309', // partial / amber
  warningBg: '#FEF3C7',
  danger: '#B91C1C', // pending / red
  dangerBg: '#FEE2E2',
  text: '#1A2B3C',
  muted: '#64748B',
  white: '#FFFFFF',
};

const PAGE_W = 595.28; // A4 width  (pt)
const MARGIN = 40;
const CONTENT = PAGE_W - MARGIN * 2; // 515.28 pt

// Column x-offsets (left edge) and widths inside the table
const COLS = [
  { label: 'Fee Title', x: MARGIN, w: 175 },
  { label: 'Amount', x: MARGIN + 175, w: 80, align: 'right' as const },
  { label: 'Paid', x: MARGIN + 255, w: 80, align: 'right' as const },
  { label: 'Pending', x: MARGIN + 335, w: 80, align: 'right' as const },
  { label: 'Status', x: MARGIN + 415, w: 100, align: 'center' as const },
];

function inr(n: number) {
  return 'Rs. ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

function statusColors(status: string): { fg: string; bg: string; label: string } {
  const s = status.toLowerCase();
  if (s === 'paid') return { fg: C.success, bg: C.successBg, label: 'Paid' };
  if (s === 'partial') return { fg: C.warning, bg: C.warningBg, label: 'Partial' };
  return { fg: C.danger, bg: C.dangerBg, label: 'Pending' };
}

@Injectable()
export class FeesPdfService {
  async generateFeePdf(data: {
    studentName: string;
    rollNo: string;
    className: string;
    fees: {
      title: string;
      amount: number;
      paidAmount: number;
      pendingAmount: number;
      status: string;
    }[];
    totalFees: number;
    totalPaid: number;
    totalPending: number;
  }): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: MARGIN, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawHeader(doc);
      this.drawStudentCard(doc, data);
      this.drawTable(doc, data.fees);
      this.drawSummaryCards(doc, data);
      this.drawFooter(doc);

      doc.end();
    });
  }

  // ── 1. Header ─────────────────────────────────────────────────────────────
  private drawHeader(doc: PDFKit.PDFDocument) {
    // Full-width navy banner
    doc.rect(0, 0, PAGE_W, 72).fill(C.primary);

    // Accent bar at very top
    doc.rect(0, 0, PAGE_W, 4).fill(C.accent);

    // Logo mark — simple geometric square with accent
    doc.roundedRect(MARGIN, 16, 36, 36, 4).fill(C.accent);
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor(C.white)
      .text('F', MARGIN, 22, { width: 36, align: 'center', lineBreak: false });

    // Title
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor(C.white)
      .text('Student Fee Report', MARGIN + 50, 20, { lineBreak: false });

    // Generated date — right aligned
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('rgba(255,255,255,0.7)')
      .text(`Generated: ${dateStr}`, MARGIN, 48, {
        width: CONTENT,
        align: 'right',
        lineBreak: false,
      });

    doc.y = 88; // below banner
  }

  // ── 2. Student Info Card ──────────────────────────────────────────────────
  private drawStudentCard(
    doc: PDFKit.PDFDocument,
    data: { studentName: string; rollNo: string; className: string },
  ) {
    const cardH = 60;
    const y = doc.y + 6;

    // Card background
    doc.roundedRect(MARGIN, y, CONTENT, cardH, 6).fill(C.light);
    // Left accent stripe
    doc.roundedRect(MARGIN, y, 4, cardH, 2).fill(C.accent);

    const fields = [
      { label: 'Student Name', value: data.studentName },
      { label: 'Roll No.', value: data.rollNo },
      { label: 'Class', value: data.className },
    ];

    const colW = CONTENT / 3;
    fields.forEach((f, i) => {
      const fx = MARGIN + 16 + i * colW;
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(C.muted)
        .text(f.label.toUpperCase(), fx, y + 12, { lineBreak: false });
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(C.text)
        .text(f.value, fx, y + 26, { lineBreak: false });
    });

    doc.y = y + cardH + 18;
  }

  // ── 3. Fee Table ──────────────────────────────────────────────────────────
  private drawTable(
    doc: PDFKit.PDFDocument,
    fees: {
      title: string;
      amount: number;
      paidAmount: number;
      pendingAmount: number;
      status: string;
    }[],
  ) {
    // Section heading
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(C.primary)
      .text('Fee Breakdown', MARGIN, doc.y);
    doc.moveDown(0.4);

    const headerY = doc.y;
    const ROW_H = 28;

    // Table header background
    doc.roundedRect(MARGIN, headerY, CONTENT, ROW_H, 4).fill(C.primary);

    // Header labels
    COLS.forEach((col) => {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(C.white)
        .text(col.label, col.x + 6, headerY + 9, {
          width: col.w - 12,
          align: col.align ?? 'left',
          lineBreak: false,
        });
    });

    // Rows
    let rowY = headerY + ROW_H;
    fees.forEach((fee, idx) => {
      // Alternating stripe
      if (idx % 2 === 0) {
        doc.rect(MARGIN, rowY, CONTENT, ROW_H).fill(C.light);
      } else {
        doc.rect(MARGIN, rowY, CONTENT, ROW_H).fill(C.white);
      }

      // Row divider
      doc
        .moveTo(MARGIN, rowY)
        .lineTo(MARGIN + CONTENT, rowY)
        .strokeColor(C.border)
        .lineWidth(0.5)
        .stroke();

      const sc = statusColors(fee.status);

      const cells = [
        { colIdx: 0, text: fee.title },
        { colIdx: 1, text: inr(fee.amount) },
        { colIdx: 2, text: inr(fee.paidAmount) },
        { colIdx: 3, text: inr(fee.pendingAmount) },
      ];

      cells.forEach(({ colIdx, text }) => {
        const col = COLS[colIdx];
        doc
          .fontSize(9.5)
          .font('Helvetica')
          .fillColor(C.text)
          .text(text, col.x + 6, rowY + 9, {
            width: col.w - 12,
            align: col.align ?? 'left',
            lineBreak: false,
          });
      });

      // Status badge (pill)
      const statusCol = COLS[4];
      const badgeW = 60;
      const badgeH = 16;
      const badgeX = statusCol.x + (statusCol.w - badgeW) / 2;
      const badgeY = rowY + (ROW_H - badgeH) / 2;

      doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 8).fill(sc.bg);
      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(sc.fg)
        .text(sc.label, badgeX, badgeY + 4, { width: badgeW, align: 'center', lineBreak: false });

      rowY += ROW_H;
    });

    // Bottom border
    doc
      .moveTo(MARGIN, rowY)
      .lineTo(MARGIN + CONTENT, rowY)
      .strokeColor(C.border)
      .lineWidth(1)
      .stroke();

    doc.y = rowY + 20;
  }

  // ── 4. Summary Cards ──────────────────────────────────────────────────────
  private drawSummaryCards(
    doc: PDFKit.PDFDocument,
    data: { totalFees: number; totalPaid: number; totalPending: number },
  ) {
    const cards = [
      { label: 'Total Fees', value: data.totalFees, accent: C.accent, light: '#E8F4FB' },
      { label: 'Total Paid', value: data.totalPaid, accent: C.success, light: C.successBg },
      { label: 'Total Pending', value: data.totalPending, accent: C.danger, light: C.dangerBg },
    ];

    const gap = 12;
    const cardW = (CONTENT - gap * 2) / 3;
    const cardH = 56;
    const y = doc.y;

    cards.forEach((card, i) => {
      const cx = MARGIN + i * (cardW + gap);

      doc.roundedRect(cx, y, cardW, cardH, 6).fill(card.light);
      // Top accent bar
      doc.roundedRect(cx, y, cardW, 4, 2).fill(card.accent);

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(C.muted)
        .text(card.label.toUpperCase(), cx + 10, y + 14, { width: cardW - 20, lineBreak: false });

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(card.accent)
        .text(inr(card.value), cx + 10, y + 28, { width: cardW - 20, lineBreak: false });
    });

    doc.y = y + cardH + 24;
  }

  // ── 5. Footer ─────────────────────────────────────────────────────────────
  private drawFooter(doc: PDFKit.PDFDocument) {
    // Draw footer right below the last content instead of at the absolute bottom.
    // This avoids PDFKit creating a second page when doc.y is near the margin.
    const y = doc.y + 12;
    doc
      .moveTo(MARGIN, y)
      .lineTo(PAGE_W - MARGIN, y)
      .strokeColor(C.border)
      .lineWidth(0.5)
      .stroke();
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(C.muted)
      .text('This is a system-generated document. No signature is required.', MARGIN, y + 8, {
        width: CONTENT,
        align: 'center',
        lineBreak: false,
      });
  }
}
