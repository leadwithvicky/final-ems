
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Employee from "@/lib/models/Employee";
import Attendance from "@/lib/models/Attendance";
import { verifyToken } from "@/lib/auth";
import CIDR from "ip-cidr";

// ✅ Utility: Check if IP is inside allowed CIDRs
function isIpAllowed(ip: string, allowedCidrs: string[]): boolean {
  return allowedCidrs.some((cidr) => {
    const range = new CIDR(cidr);
    return range.contains(ip);
  });
}

// =========================
// 📌 GET: Fetch attendance
// =========================
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // 🔍 Detect client IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "Unknown";
    console.log("📡 [GET /attendance] Client IP detected:", clientIp);

    // ✅ Verify token
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("❌ No token provided");
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("❌ Invalid token");
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const date = searchParams.get('date');

    let query: any = {};

    if (decoded.role === 'employee') {
      // Only allow employee to see their own attendance
      const employee = await Employee.findOne({ user: decoded.id });
      if (!employee) {
        return NextResponse.json({ message: "Employee record not found" }, { status: 404 });
      }
      query.employeeId = employee._id;
    } else if (decoded.role === 'admin' || decoded.role === 'superadmin') {
      // Admin/superadmin can filter by employeeId or department
      if (employeeId) query.employeeId = employeeId;
      if (department) {
        // Find all employees in department
        const employees = await Employee.find({ department });
        const ids = employees.map(e => e._id);
        query.employeeId = { $in: ids };
      }
    } else {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (date) {
      // Filter by date (YYYY-MM-DD)
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    // Fetch attendance with employee info
    const records = await Attendance.find(query).populate('employeeId', 'firstName lastName email department').sort({ date: -1 });
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("🔥 Error fetching attendance:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// =========================
// 📌 POST: Mark attendance
// =========================
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // 🔍 Detect client IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "Unknown";
    console.log("📡 [POST /attendance] Client IP detected:", clientIp);

    // ✅ Verify token
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("❌ No token provided");
      return NextResponse.json({ message: "No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log("❌ Invalid token");
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // ✅ CIDR Restriction
    const allowedCidrs = process.env.ALLOWED_CIDRS
      ? process.env.ALLOWED_CIDRS.split(",")
      : [];

    if (!isIpAllowed(clientIp, allowedCidrs)) {
      console.log(`🚫 IP ${clientIp} not allowed`);
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // ✅ Parse request body
    const body = await request.json();
    const { action, location } = body;

    console.log(`📝 User ${decoded.id} attempting to ${action} from IP ${clientIp} at ${location}`);

    if (!["clock-in", "clock-out"].includes(action)) {
      console.log("❌ Invalid action:", action);
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    // ✅ Find employee for this user
    const employee = await Employee.findOne({ user: decoded.id });
    if (!employee) {
      return NextResponse.json({ message: "Employee record not found" }, { status: 404 });
    }
    const today = new Date().toISOString().split("T")[0];
    let attendance = await Attendance.findOne({ employeeId: employee._id, date: today });

    if (!attendance) {
      attendance = new Attendance({
        employeeId: employee._id,
        date: today,
        clockIn: action === "clock-in" ? new Date() : undefined,
        clockOut: action === "clock-out" ? new Date() : undefined,
        location,
        ip: clientIp,
      });
      await attendance.save();
      console.log("✅ New attendance record created:", attendance);
    } else {
      if (action === "clock-in") attendance.clockIn = new Date();
      if (action === "clock-out") attendance.clockOut = new Date();
      attendance.location = location;
      attendance.ip = clientIp;
      await attendance.save();
      console.log("✅ Attendance updated:", attendance);
    }

    return NextResponse.json({ message: "Attendance marked", attendance }, { status: 200 });
  } catch (error) {
    console.error("🔥 Error marking attendance:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
