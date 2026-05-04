import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("Seeding demo data...");

  // Clear existing data
  await db.delete(schema.certificatesTable);
  await db.delete(schema.approvalHistoryTable);
  await db.delete(schema.sessionsTable);
  await db.delete(schema.studentsTable);
  await db.delete(schema.classesTable);
  await db.delete(schema.coursesTable);
  await db.delete(schema.instructorsTable);

  // Instructors
  const instructors = await db.insert(schema.instructorsTable).values([
    {
      fullName: "PGS.TS. Nguyễn Văn An",
      academicTitle: "PGS.TS",
      position: "Trưởng khoa",
      specialization: "An toàn lao động, Phòng cháy chữa cháy",
      email: "nguyenvanan@example.com",
      phone: "0901234567",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-01-10"),
    },
    {
      fullName: "TS. Trần Thị Bích",
      academicTitle: "TS",
      position: "Giảng viên chính",
      specialization: "Quản lý chất lượng, ISO",
      email: "tranthib@example.com",
      phone: "0912345678",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-01-12"),
    },
    {
      fullName: "ThS. Lê Minh Cường",
      academicTitle: "ThS",
      position: "Giảng viên",
      specialization: "Kỹ thuật điện, An toàn điện",
      email: "leminhcuong@example.com",
      phone: "0923456789",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-01-15"),
    },
    {
      fullName: "KS. Phạm Thị Dung",
      academicTitle: "KS",
      position: "Giảng viên",
      specialization: "Hóa chất công nghiệp, Môi trường",
      email: "phamthidung@example.com",
      phone: "0934567890",
      approvalStatus: "PENDING",
    },
  ]).returning();

  console.log(`Inserted ${instructors.length} instructors`);

  // Courses
  const courses = await db.insert(schema.coursesTable).values([
    {
      name: "An toàn lao động cơ bản",
      content: "Kiến thức cơ bản về an toàn lao động, nhận biết nguy cơ rủi ro, quy trình xử lý sự cố tại nơi làm việc",
      duration: "40 tiết (5 ngày)",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-01-20"),
    },
    {
      name: "Phòng cháy chữa cháy",
      content: "Nguyên lý cháy nổ, thiết bị PCCC, kỹ năng thoát hiểm và cứu nạn cứu hộ, thực hành chữa cháy",
      duration: "32 tiết (4 ngày)",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-01-22"),
    },
    {
      name: "An toàn điện",
      content: "Nguyên tắc an toàn khi làm việc với điện, sơ cứu người bị điện giật, bảo hộ lao động điện",
      duration: "24 tiết (3 ngày)",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-01"),
    },
    {
      name: "Vệ sinh an toàn thực phẩm",
      content: "Quy trình VSATTP, nhận biết thực phẩm không an toàn, tiêu chuẩn HACCP cơ bản",
      duration: "16 tiết (2 ngày)",
      approvalStatus: "PENDING",
    },
  ]).returning();

  console.log(`Inserted ${courses.length} courses`);

  // Classes
  const classes = await db.insert(schema.classesTable).values([
    {
      name: "ATLĐ-2025-01",
      courseId: courses[0].id,
      startDate: "2025-02-10",
      endDate: "2025-02-14",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-08"),
    },
    {
      name: "ATLĐ-2025-02",
      courseId: courses[0].id,
      startDate: "2025-03-17",
      endDate: "2025-03-21",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-03-15"),
    },
    {
      name: "PCCC-2025-01",
      courseId: courses[1].id,
      startDate: "2025-02-24",
      endDate: "2025-02-27",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-22"),
    },
    {
      name: "ATĐ-2025-01",
      courseId: courses[2].id,
      startDate: "2025-04-07",
      endDate: "2025-04-09",
      approvalStatus: "PENDING",
    },
    {
      name: "PCCC-2025-02",
      courseId: courses[1].id,
      startDate: "2025-05-12",
      endDate: "2025-05-15",
      approvalStatus: "PENDING",
    },
  ]).returning();

  console.log(`Inserted ${classes.length} classes`);

  // Sessions for class 1 (ATLĐ-2025-01)
  await db.insert(schema.sessionsTable).values([
    {
      classId: classes[0].id,
      sessionDate: "2025-02-10",
      sessionPeriod: "Sáng",
      lessonCount: 4,
      content: "Giới thiệu chương trình, Tổng quan về an toàn lao động",
      instructorId: instructors[0].id,
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-12"),
    },
    {
      classId: classes[0].id,
      sessionDate: "2025-02-10",
      sessionPeriod: "Chiều",
      lessonCount: 4,
      content: "Nhận biết các mối nguy hiểm trong môi trường làm việc",
      instructorId: instructors[0].id,
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-12"),
    },
    {
      classId: classes[0].id,
      sessionDate: "2025-02-11",
      sessionPeriod: "Sáng",
      lessonCount: 4,
      content: "Trang bị bảo hộ lao động cá nhân (PPE)",
      instructorId: instructors[0].id,
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-12"),
    },
    {
      classId: classes[0].id,
      sessionDate: "2025-02-11",
      sessionPeriod: "Chiều",
      lessonCount: 4,
      content: "Kỹ năng sơ cấp cứu tại nơi làm việc",
      instructorId: instructors[1].id,
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-12"),
    },
    {
      classId: classes[0].id,
      sessionDate: "2025-02-12",
      sessionPeriod: "Sáng",
      lessonCount: 4,
      content: "Quy trình báo cáo tai nạn lao động",
      instructorId: instructors[1].id,
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-14"),
    },
  ]);

  // Sessions for class 3 (PCCC-2025-01)
  await db.insert(schema.sessionsTable).values([
    {
      classId: classes[2].id,
      sessionDate: "2025-02-24",
      sessionPeriod: "Sáng",
      lessonCount: 4,
      content: "Lý thuyết về cháy nổ, nguyên nhân và hậu quả",
      instructorId: instructors[0].id,
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-26"),
    },
    {
      classId: classes[2].id,
      sessionDate: "2025-02-24",
      sessionPeriod: "Chiều",
      lessonCount: 4,
      content: "Thiết bị PCCC: bình cứu hỏa, vòi rồng, hệ thống báo cháy",
      instructorId: instructors[0].id,
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-26"),
    },
    {
      classId: classes[2].id,
      sessionDate: "2025-02-25",
      sessionPeriod: "Sáng",
      lessonCount: 4,
      content: "Kỹ năng thoát hiểm, cứu nạn cứu hộ",
      instructorId: instructors[0].id,
      approvalStatus: "PENDING",
    },
    {
      classId: classes[2].id,
      sessionDate: "2025-02-25",
      sessionPeriod: "Chiều",
      lessonCount: 4,
      content: "Thực hành chữa cháy bằng bình CO2 và bột ABC",
      instructorId: instructors[0].id,
      approvalStatus: "PENDING",
    },
  ]);

  console.log("Inserted sessions");

  // Students for class 1 (ATLĐ-2025-01)
  const studentsClass1 = await db.insert(schema.studentsTable).values([
    {
      studentCode: "HV001",
      fullName: "Nguyễn Thị Hoa",
      dateOfBirth: "1990-05-15",
      idNumber: "001090012345",
      idIssueDate: "2015-06-20",
      idIssuePlace: "Hà Nội",
      workplace: "Công ty TNHH ABC",
      address: "123 Phố Huế, Hai Bà Trưng, Hà Nội",
      phone: "0945123456",
      email: "nguyenthihoa@abc.com",
      classId: classes[0].id,
      instructorId: instructors[0].id,
      testScore: "8.5",
      grade: "Khá",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-15"),
      resultApprovalStatus: "APPROVED",
      resultApprovedAt: new Date("2025-02-20"),
    },
    {
      studentCode: "HV002",
      fullName: "Trần Văn Bình",
      dateOfBirth: "1988-11-22",
      idNumber: "001088034567",
      idIssueDate: "2013-08-10",
      idIssuePlace: "Hà Nội",
      workplace: "Công ty Cổ phần XYZ",
      address: "45 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      phone: "0956234567",
      email: "tranvanbinh@xyz.com",
      classId: classes[0].id,
      instructorId: instructors[0].id,
      testScore: "9.0",
      grade: "Giỏi",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-15"),
      resultApprovalStatus: "APPROVED",
      resultApprovedAt: new Date("2025-02-20"),
    },
    {
      studentCode: "HV003",
      fullName: "Lê Thị Cẩm",
      dateOfBirth: "1995-03-08",
      idNumber: "001095056789",
      workplace: "Nhà máy Thép Hòa Phát",
      address: "78 Lê Lợi, Đống Đa, Hà Nội",
      phone: "0967345678",
      classId: classes[0].id,
      instructorId: instructors[0].id,
      testScore: "7.0",
      grade: "Trung bình",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-15"),
      resultApprovalStatus: "APPROVED",
      resultApprovedAt: new Date("2025-02-20"),
    },
    {
      studentCode: "HV004",
      fullName: "Phạm Minh Đức",
      dateOfBirth: "1992-07-30",
      idNumber: "036092087654",
      workplace: "Tập đoàn Vingroup",
      address: "99 Bạch Mai, Hai Bà Trưng, Hà Nội",
      phone: "0978456789",
      classId: classes[0].id,
      instructorId: instructors[1].id,
      testScore: "9.5",
      grade: "Xuất sắc",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-15"),
      resultApprovalStatus: "APPROVED",
      resultApprovedAt: new Date("2025-02-20"),
    },
    {
      studentCode: "HV005",
      fullName: "Hoàng Thị Lan",
      dateOfBirth: "1991-12-18",
      idNumber: "036091109876",
      workplace: "Công ty TNHH Samsung",
      address: "12 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
      phone: "0989567890",
      classId: classes[0].id,
      instructorId: instructors[1].id,
      testScore: "8.0",
      grade: "Khá",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-15"),
      resultApprovalStatus: "PENDING",
    },
  ]).returning();

  // Students for class 2 (ATLĐ-2025-02)
  const studentsClass2 = await db.insert(schema.studentsTable).values([
    {
      studentCode: "HV006",
      fullName: "Vũ Quang Hùng",
      dateOfBirth: "1987-04-12",
      idNumber: "001087145678",
      workplace: "Công ty Xây dựng Sông Đà",
      address: "56 Tây Sơn, Đống Đa, Hà Nội",
      phone: "0901678901",
      classId: classes[1].id,
      instructorId: instructors[0].id,
      testScore: "7.5",
      grade: "Khá",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-03-22"),
      resultApprovalStatus: "APPROVED",
      resultApprovedAt: new Date("2025-03-25"),
    },
    {
      studentCode: "HV007",
      fullName: "Ngô Thị Mai",
      dateOfBirth: "1993-08-25",
      idNumber: "001093167890",
      workplace: "Bệnh viện Bạch Mai",
      address: "34 Giải Phóng, Đống Đa, Hà Nội",
      phone: "0912789012",
      classId: classes[1].id,
      instructorId: instructors[0].id,
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-03-22"),
      resultApprovalStatus: "PENDING",
    },
    {
      studentCode: "HV008",
      fullName: "Đỗ Văn Nam",
      dateOfBirth: "1985-01-05",
      idNumber: "036085189012",
      workplace: "Công ty Điện lực Hà Nội",
      address: "89 Láng Hạ, Đống Đa, Hà Nội",
      phone: "0923890123",
      classId: classes[1].id,
      instructorId: instructors[2].id,
      approvalStatus: "PENDING",
    },
  ]).returning();

  // Students for class 3 (PCCC-2025-01)
  const studentsClass3 = await db.insert(schema.studentsTable).values([
    {
      studentCode: "HV009",
      fullName: "Bùi Thị Oanh",
      dateOfBirth: "1994-06-14",
      idNumber: "001094201234",
      workplace: "Siêu thị Vinmart",
      address: "23 Cầu Giấy, Cầu Giấy, Hà Nội",
      phone: "0934901234",
      classId: classes[2].id,
      instructorId: instructors[0].id,
      testScore: "8.5",
      grade: "Khá",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-28"),
      resultApprovalStatus: "APPROVED",
      resultApprovedAt: new Date("2025-03-05"),
    },
    {
      studentCode: "HV010",
      fullName: "Đinh Văn Phúc",
      dateOfBirth: "1989-09-20",
      idNumber: "036089212345",
      workplace: "Tổng kho Xăng dầu Đức Giang",
      address: "67 Kim Mã, Ba Đình, Hà Nội",
      phone: "0945012345",
      classId: classes[2].id,
      instructorId: instructors[0].id,
      testScore: "9.0",
      grade: "Giỏi",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-28"),
      resultApprovalStatus: "APPROVED",
      resultApprovedAt: new Date("2025-03-05"),
    },
    {
      studentCode: "HV011",
      fullName: "Cao Thị Quỳnh",
      dateOfBirth: "1996-02-28",
      idNumber: "001096223456",
      workplace: "Khách sạn Melia Hanoi",
      address: "11 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
      phone: "0956123456",
      classId: classes[2].id,
      instructorId: instructors[0].id,
      testScore: "8.0",
      grade: "Khá",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-28"),
      resultApprovalStatus: "APPROVED",
      resultApprovedAt: new Date("2025-03-05"),
    },
    {
      studentCode: "HV012",
      fullName: "Trịnh Văn Sơn",
      dateOfBirth: "1991-11-11",
      idNumber: "036091234567",
      workplace: "Công ty BĐS Hòa Bình",
      address: "45 Hoàng Quốc Việt, Cầu Giấy, Hà Nội",
      phone: "0967234567",
      classId: classes[2].id,
      instructorId: instructors[0].id,
      testScore: "5.5",
      grade: "Trung bình",
      approvalStatus: "APPROVED",
      approvedAt: new Date("2025-02-28"),
      resultApprovalStatus: "APPROVED",
      resultApprovedAt: new Date("2025-03-05"),
    },
  ]).returning();

  console.log(`Inserted students`);

  // Certificates for completed students in class 1 and class 3
  const certStudents = [
    { student: studentsClass1[0], classId: classes[0].id },
    { student: studentsClass1[1], classId: classes[0].id },
    { student: studentsClass1[2], classId: classes[0].id },
    { student: studentsClass1[3], classId: classes[0].id },
    { student: studentsClass3[0], classId: classes[2].id },
    { student: studentsClass3[1], classId: classes[2].id },
    { student: studentsClass3[2], classId: classes[2].id },
    { student: studentsClass3[3], classId: classes[2].id },
  ];

  for (const { student, classId } of certStudents) {
    await db.insert(schema.certificatesTable).values({
      studentId: student.id,
      classId: classId,
      issueDate: "2025-03-01",
      expiryDate: "2027-03-01",
      instructorId: instructors[0].id,
      printLocation: "Trung tâm Đào tạo An toàn Lao động Quốc gia, 12 Viên, Hà Nội",
      locationLink: "https://maps.google.com",
    });
  }

  console.log("Inserted certificates");

  // Approval history
  await db.insert(schema.approvalHistoryTable).values([
    { entityType: "instructor", entityId: instructors[0].id, action: "approve", status: "APPROVED", note: "Hồ sơ đầy đủ, đạt yêu cầu" },
    { entityType: "instructor", entityId: instructors[1].id, action: "approve", status: "APPROVED", note: "Đạt tiêu chuẩn giảng viên" },
    { entityType: "course", entityId: courses[0].id, action: "approve", status: "APPROVED", note: "Nội dung chương trình đáp ứng quy định" },
    { entityType: "course", entityId: courses[1].id, action: "approve", status: "APPROVED", note: "Đã kiểm duyệt và phê duyệt" },
    { entityType: "class", entityId: classes[0].id, action: "approve", status: "APPROVED", note: "Lớp học đủ điều kiện khai giảng" },
    { entityType: "class", entityId: classes[1].id, action: "approve", status: "APPROVED", note: "Đủ học viên và giảng viên" },
    { entityType: "class", entityId: classes[2].id, action: "approve", status: "APPROVED", note: "Đã xác nhận địa điểm và thiết bị" },
  ]);

  console.log("Inserted approval history");
  console.log("Demo data seeded successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
