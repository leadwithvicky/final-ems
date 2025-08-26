import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payroll from '@/lib/models/Payroll';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

const COMPANY = {
  name: 'VisionTech',
  logoUrl: 'https://i.imghippo.com/files/nY7145UDk.webp',
  address: 'Module No.1, Q3-A3, Quadrant 3, 1st Floor, Cyber Towers, HITEC City, Hyderabad, Telangana, 500081',
  contact: '+91 7207376333'
};

function numberToWords(n: number): string {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function inHundreds(num: number): string {
    let str = '';
    if (num > 99) { str += a[Math.floor(num/100)] + ' Hundred'; num = num % 100; if (num) str += ' '; }
    if (num > 19) { str += b[Math.floor(num/10)] + (num%10? ' ' + a[num%10] : ''); }
    else if (num > 0) { str += a[num]; }
    return str.trim();
  }
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n = n % 10000000;
  const lakh = Math.floor(n / 100000); n = n % 100000;
  const thousand = Math.floor(n / 1000); n = n % 1000;
  const hundred = n;
  if (crore) parts.push(inHundreds(crore) + ' Crore');
  if (lakh) parts.push(inHundreds(lakh) + ' Lakh');
  if (thousand) parts.push(inHundreds(thousand) + ' Thousand');
  if (hundred) parts.push(inHundreds(hundred));
  return (parts.join(' ') + ' Only').trim();
}

function addHeader(doc: any, month: number, year: number) {
  const width = doc.page.width;
  const height = 80;
  const grad = doc.linearGradient(0, 0, width, 0);
  grad.stop(0, '#f97316');
  grad.stop(1, '#7c3aed');
  doc.rect(0, 0, width, height).fill(grad);

  const logoSize = 48;
  const logoX = 40;
  const logoY = 16;
  try { doc.image(COMPANY.logoUrl, logoX, logoY, { width: logoSize, height: logoSize }); } catch {}

  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(COMPANY.name, 100, 20, { align: 'left' });
  const title = `Salary Slip for ${new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
  doc.fontSize(12).font('Helvetica').text(title, 100, 44, { align: 'left' });
  doc.moveTo(40, height).lineTo(width - 40, height).strokeColor('#eeeeee').stroke();
  doc.fillColor('#000000');
}

function addFooter(doc: any) {
  const y = doc.page.height - 80;
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).strokeColor('#e5e7eb').stroke();
  doc.fillColor('#6b7280').fontSize(9);
  doc.text('This is a computer-generated payslip and does not require a signature.', 40, y + 10, { width: doc.page.width - 80, align: 'center' });
  doc.text(`${COMPANY.address}  •  Contact: ${COMPANY.contact}`, 40, y + 26, { width: doc.page.width - 80, align: 'center' });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

    const payroll = await Payroll.findById(params.id)
      .populate('employeeId', 'firstName lastName email department position user')
      .lean();

    if (!payroll) return NextResponse.json({ message: 'Payroll not found' }, { status: 404 });

    const { default: PDFDocument } = await import('pdfkit');

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (d: any) => chunks.push(Buffer.from(d)));
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    addHeader(doc, payroll.month, payroll.year);

    const emp: any = payroll.employeeId || {};
    const fullName = emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : 'Employee';
    doc.moveDown().moveTo(40, 110);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Employee Information');
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('#374151');

    const leftX = 40; const rightX = 320; let y = doc.y;
    const rowGap = 16;
    const drawRow = (label: string, value: string, x: number, y: number) => {
      doc.fillColor('#6b7280').text(label, x, y);
      doc.fillColor('#111827').text(value || '-', x + 120, y);
    };
    drawRow('Employee Name', fullName, leftX, y); y += rowGap;
    drawRow('Employee ID', emp._id?.toString() || '-', leftX, y); y += rowGap;
    drawRow('Department', emp.department || '-', leftX, y); y += rowGap;
    drawRow('Designation', emp.position || '-', leftX, y);
    y = doc.y - (rowGap * 3);
    drawRow('PAN / Tax ID', '-', rightX, y); y += rowGap;
    drawRow('Bank A/C No.', '-', rightX, y); y += rowGap;
    const startDate = new Date(payroll.year, payroll.month - 1, 1);
    const endDate = new Date(payroll.year, payroll.month, 0);
    drawRow('Pay Period', `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`, rightX, y); y += rowGap;
    const payDate = payroll.paymentDate ? new Date(payroll.paymentDate) : endDate;
    drawRow('Pay Date', payDate.toLocaleDateString(), rightX, y);

    doc.moveDown(1.2);
    const tableTop = doc.y + 8;
    const colWidth = (doc.page.width - 80) / 2 - 10;

    const drawTable = (
      x: number,
      title: string,
      rows: Array<{label: string; amount: number}>,
      highlightLabel?: string
    ) => {
      doc.roundedRect(x, tableTop, colWidth, 220, 6).strokeColor('#e5e7eb').stroke();
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(title, x + 10, tableTop + 8);
      let yPos = tableTop + 30;
      doc.font('Helvetica').fontSize(10).fillColor('#374151');
      rows.forEach((r) => {
        const isHighlight = highlightLabel && r.label === highlightLabel;
        if (isHighlight) doc.font('Helvetica-Bold');
        doc.text(r.label, x + 12, yPos);
        doc.text(`₹${(r.amount || 0).toLocaleString('en-IN')}`, x + colWidth - 110, yPos, { width: 100, align: 'right' });
        if (isHighlight) doc.font('Helvetica');
        yPos += 18;
      });
    };

    const allowances = payroll.allowances || { housing: 0, transport: 0, meal: 0, other: 0 };
    const earningsRows = [
      { label: 'Basic Pay', amount: payroll.basicSalary || 0 },
      { label: 'HRA', amount: allowances.housing || 0 },
      { label: 'Special Allowance', amount: (allowances.other || 0) + (allowances.meal || 0) + (allowances.transport || 0) },
      { label: 'Bonus / Incentives', amount: payroll.bonus || 0 },
      { label: 'Gross Earnings', amount: payroll.totalEarnings || 0 },
    ];

    const deductions = payroll.deductions || { tax: 0, insurance: 0, pension: 0, other: 0 };
    const deductionRows = [
      { label: 'Provident Fund (PF)', amount: deductions.pension || 0 },
      { label: 'Professional Tax', amount: deductions.insurance || 0 },
      { label: 'Income Tax (TDS)', amount: deductions.tax || 0 },
      { label: 'Loan/Advance Recovery', amount: deductions.other || 0 },
      { label: 'Total Deductions', amount: payroll.totalDeductions || 0 },
    ];

    drawTable(40, 'Earnings & Allowances', earningsRows, 'Gross Earnings');
    drawTable(40 + colWidth + 20, 'Deductions', deductionRows, 'Total Deductions');

    doc.moveDown(2);
    const net = Math.round(payroll.netSalary || 0);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Net Pay Summary', 40, tableTop + 240 + 30);
    doc.font('Helvetica').fontSize(11).fillColor('#111827');
    doc.text(`Net Salary (in words): ${numberToWords(net)}`, 40);
    doc.text(`Net Salary (in numbers): ₹${net.toLocaleString('en-IN')}`);

    addFooter(doc);

    doc.end();
    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="payslip_${payroll.year}_${payroll.month}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating payslip PDF:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
