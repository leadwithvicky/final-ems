import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

// POST /api/employees/bulk-import
// Accepts JSON array or text/csv in request body. For CSV, fields should include:
// firstName,lastName,email,department,position,salary,hireDate,password,gender,dateOfBirth,employmentType,status
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    let rows: any[] = [];
    if (contentType.includes('application/json')) {
      rows = await request.json();
      if (!Array.isArray(rows)) return NextResponse.json({ message: 'Expected an array' }, { status: 400 });
    } else if (contentType.includes('text/csv')) {
      const text = await request.text();
      rows = parseCsv(text);
    } else {
      return NextResponse.json({ message: 'Unsupported content type' }, { status: 415 });
    }

    const results: { email: string; status: 'created' | 'skipped'; reason?: string }[] = [];

    for (const row of rows) {
      const { firstName, lastName, email, department, position, salary, hireDate, password } = row;
      if (!firstName || !lastName || !email || !department || !position || !salary || !hireDate || !password) {
        results.push({ email: email ?? '', status: 'skipped', reason: 'Missing required fields' });
        continue;
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        results.push({ email, status: 'skipped', reason: 'User exists' });
        continue;
      }
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        results.push({ email, status: 'skipped', reason: 'Employee exists' });
        continue;
      }

      const user = new User({
        name: `${firstName} ${lastName}`,
        email,
        password,
        role: 'employee'
      });
      await user.save();

      const employee = new Employee({
        user: user._id,
        firstName,
        lastName,
        email,
        department,
        position,
        salary: Number(salary),
        hireDate: new Date(hireDate),
        gender: row.gender,
        dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
        employmentType: row.employmentType,
        status: row.status ?? 'active',
        isActive: true
      });
      await employee.save();
      results.push({ email, status: 'created' });
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

function parseCsv(text: string): any[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',');
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => obj[h] = cols[i] ? cols[i].trim() : '');
    return obj;
  });
}


