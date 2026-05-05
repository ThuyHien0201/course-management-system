import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { User, MapPin, Calendar, Clock } from "lucide-react";

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

type CompanyInfo = {
  companyName: string; slogan: string; description: string;
  address: string; contact: string; logoUrl: string; qualityLogoUrl: string;
};

type Session = {
  id: number; sessionDate: string; sessionPeriod: string;
  lessonCount: number; content: string; instructorName?: string | null;
};

type Student = {
  studentId: number;
  studentCode: string;
  fullName: string;
  dateOfBirth?: string | null;
  idNumber?: string | null;
  idIssueDate?: string | null;
  idIssuePlace?: string | null;
  workplace?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  courseName?: string | null;
  courseContent?: string | null;
  courseDuration?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  printLocation?: string | null;
  locationLink?: string | null;
  testScore?: string | null;
  grade?: string | null;
  approvalStatus?: string | null;
  hasCertificate?: boolean;
};

type ClassData = {
  id?: number;
  name: string;
  courseName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  duration?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  classData: ClassData | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function genCode(classData: ClassData | null, issueDate?: string | null) {
  if (!classData) return "DT----";
  const year = issueDate ? new Date(issueDate).getFullYear() : new Date().getFullYear();
  const words = classData.courseName || classData.name;
  const slug = words
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join("") || "CC";
  return `DT${year}-${slug}-001`;
}

export function CertificatePreview({ open, onClose, student, classData }: Props) {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch(`${BASE}/api/company`)
      .then((r) => r.json())
      .then((d) => setCompany(d))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open || !classData?.id) return;
    fetch(`${BASE}/api/classes/${classData.id}/sessions`)
      .then((r) => r.json())
      .then((d) => setSessions(Array.isArray(d) ? d : []))
      .catch(() => setSessions([]));
  }, [open, classData?.id]);

  if (!student || !classData) return null;

  const certCode = genCode(classData, student.issueDate);
  const logo = company?.logoUrl || "";
  const qLogo = company?.qualityLogoUrl || "";
  const slogan = company?.slogan || "";
  const desc = company?.description || "";
  const courseName = classData.courseName || student.courseName || "";
  const courseContent = student.courseContent || (courseName
    ? `Khóa học ${courseName} trang bị kiến thức và kỹ năng chuyên môn cần thiết theo tiêu chuẩn quốc tế.`
    : "");
  const courseDuration = student.courseDuration || classData.duration || "";
  const printLoc = student.printLocation || company?.address || "";
  const locationLink = student.locationLink || "";
  const dateRange =
    classData.startDate && classData.endDate
      ? `${fmtDate(classData.startDate)} – ${fmtDate(classData.endDate)}`
      : fmtDate(classData.startDate) || "";

  const groupedSessions = sessions.reduce<Record<string, Session[]>>((acc, s) => {
    const key = s.sessionDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const sessionDates = Object.keys(groupedSessions).sort();

  const approvalStatusText = student.approvalStatus === "APPROVED"
    ? "Đã phê duyệt"
    : student.approvalStatus === "REJECTED"
      ? "Từ chối"
      : "Đang chờ duyệt";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[680px] p-0 overflow-hidden rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogTitle className="sr-only">Xem trước chứng chỉ</DialogTitle>
        <DialogDescription className="sr-only">Xem trước chứng chỉ đào tạo</DialogDescription>

        {/* ── HEADER ── */}
        <div className="bg-[#0047AB] px-6 py-6">
          <div className="flex justify-center gap-4 mb-4">
            <LogoBox src={logo} fallback="LOGO" />
            <LogoBox src={qLogo} fallback={<IsoMark />} />
          </div>
          {slogan && (
            <h1 className="text-white font-bold text-center text-lg leading-snug">
              {slogan}
            </h1>
          )}
          {desc && (
            <p className="text-white/85 text-center text-sm mt-2 leading-relaxed">
              {desc}
            </p>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="bg-white px-6 py-6 space-y-5">

          {/* Course intro box */}
          {courseContent && (
            <div className="rounded-xl border border-[#0047AB] px-4 py-3">
              <div className="flex gap-3 items-start">
                <div className="shrink-0 mt-0.5 text-[#0047AB]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{courseContent}</p>
              </div>
            </div>
          )}

          {/* KẾT QUẢ TRUY XUẤT */}
          <div className="text-center space-y-1 pt-1">
            <div className="flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0047AB" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <p className="text-[#0047AB] font-bold text-xl tracking-wide">KẾT QUẢ TRUY XUẤT</p>
            </div>
            <p className="text-gray-600 font-bold text-sm tracking-widest uppercase">Thông tin khóa đào tạo</p>
          </div>

          {/* Cert code */}
          <p className="text-center text-[#0047AB] font-bold text-lg tracking-widest">{certCode}</p>

          {/* Course name in blue box */}
          <div className="bg-[#0047AB] rounded-xl px-6 py-4 text-center">
            <p className="text-white font-bold text-base leading-snug">
              {courseName || <span className="opacity-50 italic text-sm">Tên khóa học</span>}
            </p>
          </div>

          {/* Validity badge */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#0047AB] rounded-lg px-3 py-1.5">
              <Clock className="h-4 w-4 text-white" />
              <span className="text-white font-semibold text-sm">
                Hiệu lực:{" "}
                {student.expiryDate
                  ? fmtDate(student.expiryDate)
                  : <span className="opacity-60 italic">chưa có</span>
                }
              </span>
            </div>
          </div>

          {/* ── THÔNG TIN HỌC VIÊN ── */}
          <Section title="Thông tin học viên">
            {/* Photo centered */}
            <div className="flex justify-center mb-4">
              <div className="h-[120px] w-[90px] rounded-xl border-4 border-[#0047AB] overflow-hidden flex items-center justify-center bg-gray-50">
                {student.photoUrl
                  ? <img src={student.photoUrl} alt="Ảnh thẻ" className="h-full w-full object-cover" />
                  : <div className="flex flex-col items-center gap-1 text-gray-300">
                      <User className="h-9 w-9" />
                      <span className="text-[10px]">Ảnh thẻ</span>
                    </div>
                }
              </div>
            </div>
            <div className="space-y-0">
              <InfoRow label="Mã học viên" value={student.studentCode} />
              <InfoRow label="Họ và tên" value={student.fullName} bold />
              <InfoRow label="Ngày tháng năm sinh" value={fmtDate(student.dateOfBirth)} />
              <InfoRow label="CCCD" value={student.idNumber} />
              <InfoRow label="Ngày cấp" value={fmtDate(student.idIssueDate)} />
              <InfoRow label="Nơi cấp" value={student.idIssuePlace} />
              <InfoRow label="Nơi công tác" value={student.workplace} />
              <InfoRow label="Nơi cư trú" value={student.address} />
              <InfoRow label="Số ĐT" value={student.phone} />
              <InfoRow label="Email" value={student.email} highlight />
            </div>
          </Section>

          {/* ── THÔNG TIN KHÓA HỌC ── */}
          <Section title="Thông tin khóa học">
            <div className="space-y-0">
              {dateRange && (
                <InfoRow
                  label="Thời gian"
                  value={dateRange}
                  icon={<Calendar className="h-3.5 w-3.5 text-[#0047AB]" />}
                />
              )}
              {courseDuration && (
                <InfoRow
                  label="Thời lượng / Số tiết"
                  value={courseDuration}
                  icon={<Clock className="h-3.5 w-3.5 text-[#0047AB]" />}
                />
              )}
              {printLoc && (
                <>
                  <InfoRow
                    label="Địa điểm"
                    value={printLoc}
                    icon={<MapPin className="h-3.5 w-3.5 text-[#0047AB]" />}
                  />
                  {locationLink && (
                    <div className="pl-[160px] pb-1">
                      <a
                        href={locationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0047AB] font-semibold text-sm hover:underline flex items-center gap-1"
                      >
                        📍 Xem trên bản đồ
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </Section>

          {/* ── CHƯƠNG TRÌNH ĐÀO TẠO ── */}
          <Section title="Chương trình đào tạo">
            <div className="space-y-3">

              {/* Step 1: Đăng ký */}
              <Step number={1} title="Đăng ký">
                <p className="text-sm text-gray-700">Hoàn tất đăng ký khóa học</p>
              </Step>

              {/* Step 2: Chương trình học (sessions) */}
              <Step number={2} title="Chương trình học">
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Chưa có dữ liệu buổi học</p>
                ) : (
                  <div className="space-y-2">
                    {sessionDates.map((date) => (
                      <div key={date}>
                        {groupedSessions[date].map((s) => (
                          <div key={s.id} className="mb-2">
                            <p className="text-sm font-bold text-[#0047AB]">
                              {fmtDate(date)} – {s.sessionPeriod}
                            </p>
                            <p className="text-sm text-gray-700">{s.content}</p>
                            {s.instructorName && (
                              <p className="text-xs text-gray-500">Giảng viên: {s.instructorName}</p>
                            )}
                            {s.lessonCount > 0 && (
                              <p className="text-xs text-gray-400">{s.lessonCount} tiết</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </Step>

              {/* Step 3: Kết quả */}
              <Step number={3} title="Bài kiểm tra / Kết quả">
                <p className="text-sm text-gray-700">
                  {student.testScore
                    ? `${student.grade ? student.grade + " – " : ""}${student.testScore}`
                    : student.grade || <span className="italic text-gray-400">Chưa có kết quả</span>
                  }
                </p>
              </Step>

              {/* Step 4: Quyết định cấp GCN */}
              <Step number={4} title="Quyết định cấp GCN">
                <p className="text-sm text-gray-700">
                  {student.hasCertificate
                    ? approvalStatusText
                    : <span className="italic text-gray-400">Chưa cấp</span>
                  }
                </p>
              </Step>

              {/* Step 5: Nơi in GCN */}
              <Step number={5} title="Nơi in GCN">
                {printLoc
                  ? <>
                      <p className="text-sm text-gray-700">{printLoc}</p>
                      {locationLink && (
                        <a
                          href={locationLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0047AB] font-semibold text-sm hover:underline flex items-center gap-1 mt-0.5"
                        >
                          📍 Xem bản đồ
                        </a>
                      )}
                    </>
                  : <p className="text-sm text-gray-400 italic">Chưa xác định</p>
                }
              </Step>
            </div>
          </Section>

          {/* Footer */}
          {company?.companyName && (
            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-xs font-semibold text-gray-500">{company.companyName}</p>
              {company.address && (
                <p className="text-xs text-gray-400 mt-0.5">{company.address}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LogoBox({ src, fallback }: { src: string; fallback: React.ReactNode }) {
  return (
    <div className="h-[88px] w-[88px] bg-white rounded-xl overflow-hidden flex items-center justify-center p-1.5 shadow">
      {src
        ? <img src={src} alt="Logo" className="h-full w-full object-contain" />
        : <div className="flex items-center justify-center w-full h-full text-[#0047AB] font-black text-xs text-center leading-tight">
            {fallback}
          </div>
      }
    </div>
  );
}

function IsoMark() {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-10 h-10 rounded-full border-2 border-[#0047AB] flex items-center justify-center">
        <span className="text-[#0047AB] font-black text-[8px] leading-tight text-center">ISO{"\n"}9001</span>
      </div>
      <span className="text-[7px] text-[#0047AB] font-bold">CERTIFIED</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t-4 border-[#0047AB] rounded-xl bg-white pt-4 pb-3 px-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-6 bg-[#0047AB] rounded-full" />
        <h3 className="text-[#0047AB] font-bold text-base">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  bold,
  highlight,
  icon,
}: {
  label: string;
  value?: string | null | React.ReactNode;
  bold?: boolean;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-1 py-1.5 border-b border-gray-100 last:border-0">
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span className="text-gray-700 font-semibold text-sm shrink-0 w-[140px]">{label}:</span>
      <span className={`text-sm flex-1 ${bold ? "font-bold text-gray-900" : highlight ? "font-semibold text-[#0047AB]" : "text-gray-700"}`}>
        {value || <span className="text-gray-300 italic">—</span>}
      </span>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-9 h-9 rounded-full bg-[#0047AB] border-4 border-[#0047AB] flex items-center justify-center">
        <span className="text-white font-bold text-sm">{number}</span>
      </div>
      <div className="flex-1 border border-[#0047AB] rounded-xl px-4 py-3">
        <p className="text-[#0047AB] font-bold text-sm mb-1">{title}</p>
        {children}
      </div>
    </div>
  );
}
