import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Pill, 
  Clock, 
  UserCheck, 
  Activity, 
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  Award,
  FileText,
  Users,
  Home,
  Building,
  Mail,
  Phone,
  Plus,
  Stethoscope,
  Edit2,
  ClipboardList,
  Printer,
  Download
} from 'lucide-react';
import { Patient, DailyLog, InvestigationForm, ContactPerson, UserProfile } from '../types';
import { PatientReportPdfModal } from './PatientReportPdfModal';

interface Props {
  patient: Patient;
  logs: DailyLog[];
  investigation?: InvestigationForm | null;
  contacts?: ContactPerson[];
  onOpenLogModal: () => void;
  onEditPatient: () => void;
  onOpenInvestigationModal: () => void;
  onOpenNewContact: (patient: Patient, defaultType?: 'household' | 'non_household') => void;
  onEditContact: (contact: ContactPerson) => void;
  onClose: () => void;
  spreadsheetUrl?: string | null;
  currentUserProfile?: UserProfile | null;
  onDeletePatient?: (patientId: string) => void;
}

export const PatientDetailView: React.FC<Props> = ({
  patient,
  logs,
  investigation,
  contacts = [],
  onOpenLogModal,
  onEditPatient,
  onOpenInvestigationModal,
  onOpenNewContact,
  onEditContact,
  onClose,
  spreadsheetUrl,
  currentUserProfile,
  onDeletePatient,
}) => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sort logs descending by date
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate adherence statistics
  const totalDays = sortedLogs.length;
  const takenDays = sortedLogs.filter(l => l.takenMedication).length;
  const adherenceRate = totalDays > 0 ? Math.round((takenDays / totalDays) * 100) : 0;
  
  // Calculate current continuous streak
  let currentStreak = 0;
  for (const log of sortedLogs) {
    if (log.takenMedication) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Filter contacts belonging to this patient
  const patientContacts = contacts.filter(c => c.indexPatientId === patient.id || c.indexPatientHN === patient.hn);
  const householdContacts = patientContacts.filter(c => c.contactType === 'household');
  const nonHouseholdContacts = patientContacts.filter(c => c.contactType === 'non_household');

  // Symptom counts
  const recentRedFlags = sortedLogs.slice(0, 7).filter(l => l.severityLevel === 'severe' || l.symptoms.yellowSkinEyes || l.symptoms.visionChanges || l.symptoms.coughBlood);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium mr-2"
            >
              ← กลับสู่หน้ารายชื่อ
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
              HN: {patient.hn || patient.id}
            </span>
            <span className="text-xs font-semibold text-purple-800 bg-purple-100/70 px-2.5 py-0.5 rounded-full">
              ขึ้นทะเบียน n-tip: {patient.ntipRegistrationDate || '-'}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              patient.status === 'active' ? 'bg-teal-100 text-teal-800' :
              patient.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {patient.status === 'active' ? 'กำลังรักษา' : patient.status === 'completed' ? 'รักษาครบแล้ว' : 'ส่งต่อ/อื่นๆ'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {patient.fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
            <span>อายุ {patient.age} ปี ({patient.gender === 'male' ? 'เพศชาย' : patient.gender === 'female' ? 'เพศหญิง' : 'เพศอื่นๆ'})</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {patient.phone || '-'}</span>
            {patient.email && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {patient.email}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPdfModal(true)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="ส่งออกรายงานสรุปประวัติผู้ป่วยและผลสอบสวนโรคเป็นไฟล์ PDF"
          >
            <Download className="w-4 h-4 text-teal-200" />
            <span>ส่งออกรายงาน PDF</span>
          </button>

          {investigation && (
            <button
              onClick={() => setShowPdfModal(true)}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="พิมพ์แบบฟอร์มการสอบสวนโรคทางการแพทย์"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>พิมพ์แบบสอบสวนโรค</span>
            </button>
          )}
          <button
            onClick={onEditPatient}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            แก้ไขประวัติ
          </button>
          <button
            onClick={onOpenInvestigationModal}
            className="px-3.5 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-teal-700" />
            {investigation ? 'ดู/แก้ไขใบสอบสวนโรค' : '+ บันทึกใบสอบสวนโรค (DDC)'}
          </button>
          {onDeletePatient && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2 text-xs font-medium text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
              title="ลบข้อมูลผู้ป่วยรายนี้"
            >
              ลบผู้ป่วย
            </button>
          )}
          <button
            onClick={onOpenLogModal}
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Pill className="w-4 h-4" />
            บันทึกการทานยาวันนี้ (DOTS)
          </button>
        </div>
      </div>

      {/* Delete Patient Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">ยืนยันการลบข้อมูลผู้ป่วย</h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณต้องการลบข้อมูลของ <strong className="text-slate-800">{patient.fullName} (HN: {patient.hn})</strong> ใช่หรือไม่? 
                ข้อมูลประวัติการสอบสวนโรคและบันทึกอาการจะถูกลบออกจากระบบและ Google Sheet
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeletePatient) onDeletePatient(patient.id);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning banner if severe symptoms detected recently */}
      {recentRedFlags.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-sm block mb-0.5">พบอาการข้างเคียงหรือสัญญาณเตือนในรอบ 7 วันที่ผ่านมา</span>
            มีบันทึกอาการที่ต้องเฝ้าระวัง (เช่น ตาเหลือง/ตัวเหลือง, ตามัว, หรือไอเป็นเลือด) แนะนำให้ประสานงานเจ้าหน้าที่พยาบาลหรือแพทย์เพื่อประเมินภาวะตับอักเสบจากยาวัณโรค
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-4">
          <div className="text-emerald-700 text-xs font-bold uppercase mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> อัตราการทานยา (Adherence)
          </div>
          <div className="text-2xl font-black text-slate-800">
            {adherenceRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ทานยาแล้ว {takenDays} จาก {totalDays} วันที่บันทึก
          </div>
        </div>

        <div className="bg-teal-50/60 border border-teal-200/60 rounded-2xl p-4">
          <div className="text-teal-700 text-xs font-bold uppercase mb-1 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> ความต่อเนื่อง (Streak)
          </div>
          <div className="text-2xl font-black text-slate-800">
            {currentStreak} วัน
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ทานยาต่อเนื่องล่าสุด
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
          <div className="text-slate-600 text-xs font-bold uppercase mb-1 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" /> กลุ่มการรักษา
          </div>
          <div className="text-sm font-bold text-slate-800 truncate" title={patient.treatmentCategory}>
            {patient.treatmentCategory || 'ผู้ป่วยรายใหม่ (Cat 1)'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {patient.hospitalName || 'รพ.มหาวิทยาลัยอุบลราชธานี'}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
          <div className="text-slate-600 text-xs font-bold uppercase mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> วันที่เริ่มรักษา
          </div>
          <div className="text-sm font-bold text-slate-800">
            {patient.diagnosisDate ? new Date(patient.diagnosisDate).toLocaleDateString('th-TH') : '-'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            {patient.hospitalName || 'สถานพยาบาลหลัก'}
          </div>
        </div>
      </div>

      {/* Disease Investigation and Contact Tracing Summary Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Investigation summary card */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">การสอบสวนโรค (DDC Investigation)</h3>
                <p className="text-[10px] text-slate-500">ตามใบสอบสวนโรค กรมควบคุมโรค</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {investigation && (
                <button
                  onClick={() => setShowPdfModal(true)}
                  className="p-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 px-2 transition cursor-pointer"
                  title="พิมพ์และดาวน์โหลดรายงาน PDF"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span>PDF / พิมพ์</span>
                </button>
              )}
              <button
                onClick={onOpenInvestigationModal}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                {investigation ? 'แก้ไข' : '+ กรอกข้อมูล'}
              </button>
            </div>
          </div>

          {investigation ? (
            <div className="text-xs space-y-2 pt-2 border-t border-slate-200/60">
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>วันที่สอบสวน: <strong className="text-slate-800">{investigation.investigationDate}</strong></div>
                <div>ผู้สอบสวน: <strong className="text-slate-800">{investigation.investigatorName}</strong></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>ผล AFB Smear: <strong className="text-rose-700">{investigation.afbSmearResult}</strong></div>
                <div>GeneXpert: <strong className="text-blue-700">{investigation.geneXpertResult}</strong></div>
              </div>
              {investigation.initialCxrResult && (
                <div className="text-slate-600">
                  ผล CXR แรกรับ: <span className="font-medium text-slate-800">{investigation.initialCxrResult}</span>
                </div>
              )}
              {investigation.symptomOnsetDate && (
                <div className="text-[11px] text-slate-500 bg-teal-50/50 p-1.5 rounded-lg border border-teal-100">
                  ช่วงเวลาแพร่เชื้อ: <strong className="text-teal-900">{investigation.infectiousPeriodStart || '-'} ถึง {investigation.infectiousPeriodEnd || '-'}</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-500 bg-white/60 rounded-2xl border border-dashed border-slate-200">
              <p>ยังไม่ได้กรอกใบสอบสวนโรคของกรมควบคุมโรค</p>
              <button
                onClick={onOpenInvestigationModal}
                className="mt-2 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold rounded-lg"
              >
                กรอกแบบฟอร์มสอบสวนโรค
              </button>
            </div>
          )}
        </div>

        {/* Contacts breakdown card */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">กลุ่มผู้สัมผัสโรค (Contact Tracing)</h3>
                <p className="text-[10px] text-slate-500">ลงทะเบียนในระบบ {patientContacts.length} คน</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenNewContact(patient, 'household')}
                className="text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-1 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                เพิ่มผู้สัมผัส
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                <Home className="w-3.5 h-3.5" /> ร่วมบ้าน (Household)
              </div>
              <div className="text-xl font-black text-emerald-950 mt-1">
                {householdContacts.length} <span className="text-xs font-normal text-emerald-700">คน</span>
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">
                (ระบุจากการสอบสวน: {patient.householdContactsCount || 0} คน)
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold text-[11px]">
                <Building className="w-3.5 h-3.5" /> นอกบ้าน (Non-household)
              </div>
              <div className="text-xl font-black text-blue-950 mt-1">
                {nonHouseholdContacts.length} <span className="text-xs font-normal text-blue-700">คน</span>
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5">
                (ระบุจากการสอบสวน: {patient.nonHouseholdContactsCount || 0} คน)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient's Registered Contact List */}
      {patientContacts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              รายชื่อผู้สัมผัสที่เชื่อมโยงกับผู้ป่วยรายนี้ ({patientContacts.length} คน)
            </h3>
            <button
              onClick={() => onOpenNewContact(patient)}
              className="text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              + เพิ่มผู้สัมผัสใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {patientContacts.map(c => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{c.fullName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                      c.contactType === 'household' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {c.contactType === 'household' ? 'ร่วมบ้าน' : 'นอกบ้าน'}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    HN: {c.hn || '-'} • อายุ {c.age} ปี • {c.relationship} • โทร: {c.phone || '-'}
                  </div>
                  <div className="text-[10px] text-teal-700 font-semibold mt-1">
                    {c.age > 5 ? '📌 เกณฑ์ CXR 4 ครั้ง' : '📌 เกณฑ์ IGRA/TPT (เด็กเล็ก)'} {c.ntipStatus === 'entered' && `• n-tip: ${c.ntipKeyCode || 'คีย์แล้ว'}`}
                  </div>
                </div>

                <button
                  onClick={() => onEditContact(c)}
                  className="p-2 text-slate-400 hover:text-teal-700 hover:bg-white rounded-xl transition"
                  title="แก้ไขข้อมูล"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs History Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              ประวัติการติดตามการทานยาและอาการประจำวัน (Daily Tracking History)
            </h2>
            <p className="text-xs text-slate-500">
              ข้อมูลทั้งหมดซิงค์กับชีท Google Sheets แผ่น "บันทึกอาการและยา (Daily Logs)"
            </p>
          </div>
          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              ดูใน Sheet
            </a>
          )}
        </div>

        {sortedLogs.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">ยังไม่มีบันทึกการทานยาสำหรับผู้ป่วยรายนี้</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">เริ่มต้นบันทึกการทานยาและการประเมินอาการเพื่อติดตามการรักษา</p>
            <button
              onClick={onOpenLogModal}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
            >
              + บันทึกการทานยาวันนี้
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">วันที่</th>
                  <th className="py-3 px-4">สถานะการทานยา</th>
                  <th className="py-3 px-4">เวลาทาน</th>
                  <th className="py-3 px-4">ผู้กำกับยา (DOTS)</th>
                  <th className="py-3 px-4">อาการและผลข้างเคียง</th>
                  <th className="py-3 px-4">ระดับการเฝ้าระวัง</th>
                  <th className="py-3 px-4">ผู้บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedLogs.map((log) => {
                  const activeSymptoms = Object.entries(log.symptoms)
                    .filter(([_, active]) => active)
                    .map(([k]) => {
                      const labels: Record<string, string> = {
                        cough: 'ไอ',
                        coughBlood: 'ไอเป็นเลือด🩸',
                        fever: 'มีไข้🌡️',
                        nightSweats: 'เหงื่อออกกลางคืน',
                        weightLoss: 'น้ำหนักลด',
                        chestPain: 'เจ็บหน้าอก',
                        fatigue: 'อ่อนเพลีย',
                        nauseaVomiting: 'คลื่นไส้',
                        rashItch: 'ผื่นคัน',
                        yellowSkinEyes: 'ตัว/ตาเหลือง⚠️',
                        jointPain: 'ปวดข้อ',
                        visionChanges: 'ตามัว👁️',
                        numbnessHandsFeet: 'ชาปลายมือเท้า',
                      };
                      return labels[k] || k;
                    });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString('th-TH', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.takenMedication ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ทานยาแล้ว
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            ขาด/ไม่ทาน
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {log.medicationTime ? `${log.medicationTime} น.` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <span className="block font-medium">
                          {log.supervisorType === 'vhv' ? 'อสม.' : log.supervisorType === 'health_worker' ? 'จนท.สาธารณสุข' : log.supervisorType === 'family' ? 'ญาติ' : 'ตนเอง'}
                        </span>
                        {log.supervisorName && (
                          <span className="text-[10px] text-slate-400 block">{log.supervisorName}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        {activeSymptoms.length === 0 ? (
                          <span className="text-slate-400">ไม่มีอาการผิดปกติ</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {activeSymptoms.map((s, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {log.sideEffectsNotes && (
                          <div className="text-[11px] text-slate-500 italic mt-1 truncate">
                            "{log.sideEffectsNotes}"
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.severityLevel === 'severe' ? (
                          <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md text-[11px] inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ระดับวิกฤต/พบแพทย์
                          </span>
                        ) : log.severityLevel === 'moderate' ? (
                          <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                            เฝ้าระวัง
                          </span>
                        ) : log.severityLevel === 'mild' ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[11px]">
                            อาการเล็กน้อย
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium text-[11px]">
                            ปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {log.recordedBy || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comprehensive Medical & Investigation Report PDF Modal */}
      {showPdfModal && (
        <PatientReportPdfModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          patient={patient}
          investigation={investigation}
          contacts={patientContacts}
          logs={logs}
          currentUserProfile={currentUserProfile}
        />
      )}
    </div>
  );
};
