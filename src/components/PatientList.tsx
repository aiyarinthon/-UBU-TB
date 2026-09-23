import React, { useState } from 'react';
import { 
  Users, 
  Pill, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Plus, 
  Calendar, 
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Home,
  Building,
  Phone,
  Mail,
  FileKey,
  LayoutGrid,
  Table as TableIcon,
  UserCheck,
  ShieldCheck,
  Shield,
  Download,
  FileSpreadsheet,
  Printer,
  UploadCloud
} from 'lucide-react';
import { Patient, DailyLog, InvestigationForm, ContactPerson, UserProfile } from '../types';
import { Permissions } from '../lib/userStore';
import { PatientReportPdfModal } from './PatientReportPdfModal';
import { ExportTablePdfModal } from './ExportTablePdfModal';
import { exportPatientsToExcel } from '../lib/exportUtils';
import { formatThaiDate, formatThaiDateTime } from '../lib/dateUtils';

interface Props {
  patients: Patient[];
  logs: DailyLog[];
  investigations?: InvestigationForm[];
  contacts?: ContactPerson[];
  currentUserProfile?: UserProfile | null;
  onSelectPatient: (patient: Patient) => void;
  onOpenNewPatient: () => void;
  onOpenQuickLog: (patient: Patient) => void;
  onOpenInvestigation: (patient: Patient) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onOpenImportModal?: (mode: 'patient' | 'contact') => void;
}

export const PatientList: React.FC<Props> = ({
  patients,
  logs,
  investigations = [],
  contacts = [],
  currentUserProfile,
  onSelectPatient,
  onOpenNewPatient,
  onOpenQuickLog,
  onOpenInvestigation,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenImportModal,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [pdfModalPatient, setPdfModalPatient] = useState<Patient | null>(null);
  const [isTablePdfModalOpen, setIsTablePdfModalOpen] = useState(false);
  const userRole = currentUserProfile?.role || 'admin';
  const canAdd = Permissions.canAddEditPatients(userRole);
  const canInvestigate = Permissions.canInvestigate(userRole);
  const canLog = Permissions.canLogDailyMedication(userRole);
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper for formatting date
  const formatDateTime = (isoString?: string) => {
    return formatThaiDateTime(isoString);
  };

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      p.fullName.toLowerCase().includes(q) ||
      (p.hn && p.hn.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q) ||
      (p.phone && p.phone.includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.lastUpdatedBy && p.lastUpdatedBy.toLowerCase().includes(q)) ||
      (p.ntipRegistrationDate && p.ntipRegistrationDate.includes(q));
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate high-level stats
  const activePatients = patients.filter(p => p.status === 'active');
  const todayLogs = logs.filter(l => l.date === todayStr);
  const todayTaken = todayLogs.filter(l => l.takenMedication).length;
  const severeAlerts = logs
    .filter(l => l.date === todayStr && l.severityLevel === 'severe')
    .length;

  return (
    <div className="space-y-6">
      {/* Overview Metric Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ผู้ป่วยในระบบ</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {patients.length} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            กำลังรักษา {activePatients.length} คน
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ทานยาวันนี้ (DOTS)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {todayTaken} <span className="text-xs font-normal text-slate-500">/ {activePatients.length} คน</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            บันทึกแล้ว {todayLogs.length} รายการ
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ยังไม่ได้บันทึกวันนี้</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {Math.max(0, activePatients.length - todayTaken)} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            ต้องติดตามการทานยา
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">แจ้งเตือนอาการเสี่ยง</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {severeAlerts} <span className="text-xs font-normal text-slate-500">เคสวันนี้</span>
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            ผลข้างเคียงยา/อาการกำเริบ
          </div>
        </div>
      </div>

      {/* Action Bar, Filters & View Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาชื่อผู้ป่วย, HN, เบอร์โทร, ผู้แก้ไขล่าสุด, n-tip..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 focus:bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">กำลังรักษา (Active)</option>
            <option value="completed">รักษาหาย/ครบกำหนด (Completed)</option>
            <option value="transferred">ส่งต่อ (Transferred)</option>
            <option value="defaulted">ขาดการรักษา (Defaulted)</option>
          </select>

          {/* View Mode Toggle & Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportPatientsToExcel(filteredPatients)}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="ดาวน์โหลดรายชื่อผู้ป่วยทั้งหมดเป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">ดาวน์โหลด Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>

            <button
              onClick={() => setIsTablePdfModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="พิมพ์หรือดาวน์โหลดรายงาน PDF ทะเบียนผู้ป่วย"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">พิมพ์ / PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="มุมมองตาราง (Table View) แสดงคอลัมน์ผู้แก้ไขล่าสุด"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>ตาราง</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="มุมมองการ์ด (Card View)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>การ์ด</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenImportModal && (
            <button
              onClick={() => onOpenImportModal('patient')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="นำเข้าข้อมูลผู้ป่วยจาก Google Sheet"
            >
              <UploadCloud className="w-3.5 h-3.5 text-teal-700" />
              <span>นำเข้าจาก Sheet</span>
            </button>
          )}

          {canAdd && (
            <button
              onClick={onOpenNewPatient}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ลงทะเบียนผู้ป่วยรายใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient List Content */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            {searchTerm || statusFilter !== 'all' ? 'ไม่พบข้อมูลผู้ป่วยที่ตรงตามเงื่อนไข' : 'ยังไม่มีข้อมูลผู้ป่วยในระบบ'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองสถานะ'
              : 'เริ่มต้นลงทะเบียนผู้ป่วยวัณโรคปอดรายแรกเพื่อติดตามอาการและการทานยาใน Google Sheet'}
          </p>
          {patients.length === 0 && canAdd && (
            <button
              onClick={onOpenNewPatient}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
            >
              + ลงทะเบียนผู้ป่วยคนแรก
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ------------------ TABLE VIEW (With 'แก้ไขล่าสุดโดย' column) ------------------ */
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">HN / รหัส</th>
                  <th className="py-3 px-4">ชื่อ-นามสกุล / ข้อมูล</th>
                  <th className="py-3 px-4">วัน n-tip / รักษา</th>
                  <th className="py-3 px-4">ผู้สัมผัสโรค</th>
                  <th className="py-3 px-4">DOTS วันนี้</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 bg-teal-50/60 text-teal-900 border-x border-teal-100/80">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                      <span>แก้ไขล่าสุดโดย</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredPatients.map((patient) => {
                  const patientLogs = logs.filter(l => l.patientId === patient.id);
                  const todayLog = patientLogs.find(l => l.date === todayStr);
                  const inv = investigations.find(i => i.patientId === patient.id || (i.patientHN && patient.hn && i.patientHN.toLowerCase() === patient.hn.toLowerCase()));
                  const pContacts = contacts.filter(c => c.indexPatientId === patient.id || (c.indexPatientHN && patient.hn && c.indexPatientHN.toLowerCase() === patient.hn.toLowerCase()));
                  const regHousehold = pContacts.filter(c => c.contactType === 'household').length;
                  const regNonHousehold = pContacts.filter(c => c.contactType === 'non_household').length;
                  const householdC = regHousehold > 0 ? regHousehold : (inv ? inv.householdContactsCount : (patient.householdContactsCount || 0));
                  const nonHouseholdC = regNonHousehold > 0 ? regNonHousehold : (inv ? inv.nonHouseholdContactsCount : (patient.nonHouseholdContactsCount || 0));

                  return (
                    <tr key={patient.id} className="hover:bg-teal-50/20 transition group">
                      {/* HN / ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold font-mono text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {patient.hn || patient.id}
                        </span>
                      </td>

                      {/* Name & Basic info */}
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => onSelectPatient(patient)}
                          className="font-bold text-slate-900 group-hover:text-teal-700 cursor-pointer transition hover:underline"
                        >
                          {patient.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{patient.age} ปี ({patient.gender === 'female' ? 'หญิง' : 'ชาย'})</span>
                          <span>•</span>
                          <span>{patient.treatmentRights}</span>
                        </div>
                      </td>

                      {/* Registration / Treatment Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {patient.ntipRegistrationDate ? (
                          <div className="text-[11px] font-semibold text-purple-900 flex items-center gap-1">
                            <FileKey className="w-3 h-3 text-purple-700" />
                            <span>{patient.ntipRegistrationDate}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          สูตรยา: {patient.treatmentRegimen || '2HRZE/4HR'}
                        </div>
                      </td>

                      {/* Contacts Tracing */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold border border-emerald-200" title="ผู้สัมผัสร่วมบ้าน">
                            🏠 {householdC}
                          </span>
                          <span className="text-[11px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-bold border border-blue-200" title="ผู้สัมผัสนอกบ้าน">
                            🏢 {nonHouseholdC}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {inv ? (
                            <span className="text-teal-700 font-semibold">✓ สอบสวนแล้ว</span>
                          ) : (
                            <button 
                              onClick={() => onOpenInvestigation(patient)} 
                              className="text-amber-700 hover:underline font-semibold"
                            >
                              + รอกรอกสอบสวน
                            </button>
                          )}
                        </div>
                      </td>

                      {/* DOTS Today */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {todayLog ? (
                          todayLog.takenMedication ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ทานแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              ขาดทานยา
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-amber-600" />
                            รอยืนยัน
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                          patient.status === 'active' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                          patient.status === 'completed' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {patient.status === 'active' ? 'กำลังรักษา' : patient.status === 'completed' ? 'รักษาครบ' : 'ส่งต่อ'}
                        </span>
                      </td>

                      {/* แก้ไขล่าสุดโดย (Audit column) */}
                      <td className="py-3 px-4 whitespace-nowrap bg-teal-50/30 border-x border-teal-100/60">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                            {patient.lastUpdatedBy ? patient.lastUpdatedBy.charAt(0) : '—'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 truncate max-w-[140px]" title={patient.lastUpdatedBy || 'เจ้าหน้าที่'}>
                              {patient.lastUpdatedBy || 'เจ้าหน้าที่ (ระบบ)'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {formatDateTime(patient.updatedAt || patient.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPdfModalPatient(patient)}
                            className="px-2 py-1 text-[11px] font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg transition flex items-center gap-1 cursor-pointer border border-teal-200/60"
                            title="ส่งออกรายงานประวัติและผลสอบสวนโรค (PDF)"
                          >
                            <Download className="w-3 h-3 text-teal-700" />
                            <span>PDF</span>
                          </button>
                          {canLog && (
                            <button
                              onClick={() => onOpenQuickLog(patient)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition cursor-pointer"
                              title="บันทึกการทานยาประจำวัน"
                            >
                              + DOTS
                            </button>
                          )}
                          <button
                            onClick={() => onSelectPatient(patient)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>ดูประวัติ</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ------------------ CARD VIEW ------------------ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const patientLogs = logs.filter(l => l.patientId === patient.id);
            const todayLog = patientLogs.find(l => l.date === todayStr);
            const inv = investigations.find(i => i.patientId === patient.id || (i.patientHN && patient.hn && i.patientHN.toLowerCase() === patient.hn.toLowerCase()));
            const pContacts = contacts.filter(c => c.indexPatientId === patient.id || (c.indexPatientHN && patient.hn && c.indexPatientHN.toLowerCase() === patient.hn.toLowerCase()));
            const regHousehold = pContacts.filter(c => c.contactType === 'household').length;
            const regNonHousehold = pContacts.filter(c => c.contactType === 'non_household').length;
            const cardHouseholdC = regHousehold > 0 ? regHousehold : (inv ? inv.householdContactsCount : (patient.householdContactsCount || 0));
            const cardNonHouseholdC = regNonHousehold > 0 ? regNonHousehold : (inv ? inv.nonHouseholdContactsCount : (patient.nonHouseholdContactsCount || 0));

            const hasSevereRecent = patientLogs.slice(0, 3).some(l => l.severityLevel === 'severe');

            return (
              <div
                key={patient.id}
                className="bg-white border border-slate-200/80 hover:border-teal-400/80 rounded-3xl p-5 shadow-2xs transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          HN: {patient.hn || patient.id}
                        </span>
                        {patient.ntipRegistrationDate && (
                          <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <FileKey className="w-3 h-3 text-purple-700" />
                            n-tip: {patient.ntipRegistrationDate}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5 group-hover:text-teal-700 transition">
                        {patient.fullName}
                      </h3>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                      patient.status === 'active' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                      patient.status === 'completed' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {patient.status === 'active' ? 'กำลังรักษา' : patient.status === 'completed' ? 'รักษาครบ' : 'ส่งต่อ'}
                    </span>
                  </div>

                  {/* Patient Quick Info */}
                  <div className="text-xs text-slate-600 space-y-1.5 mb-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>อายุ / เพศ:</span>
                      <span className="font-semibold text-slate-800">
                        {patient.age} ปี ({patient.gender === 'male' ? 'ชาย' : 'หญิง'})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> เบอร์โทร:</span>
                      <span className="font-medium text-slate-800">{patient.phone || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>สูตรยา:</span>
                      <span className="font-bold text-teal-800 font-mono" title={patient.treatmentRegimen}>
                        {patient.treatmentRegimen || '2HRZE/4HR'}
                      </span>
                    </div>
                  </div>

                  {/* Investigation & Contact Status Badges */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-[11px]">
                    <div 
                      onClick={() => onOpenInvestigation(patient)}
                      className="p-2 rounded-xl border border-teal-200/80 bg-teal-50/50 hover:bg-teal-100/70 cursor-pointer transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-teal-950">สอบสวนโรค</div>
                        <div className="text-[10px] text-teal-700 font-medium">
                          {inv ? 'กรอกแล้ว' : '+ รอกรอก'}
                        </div>
                      </div>
                    </div>

                    <div 
                      onClick={() => onSelectPatient(patient)}
                      className="p-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100/70 cursor-pointer transition flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-emerald-950">ผู้สัมผัส</div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          ร่วม {cardHouseholdC} / นอก {cardNonHouseholdC}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Today Status Badge */}
                  <div className="pt-2 border-t border-slate-100 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">ทานยาวันนี้ (DOTS):</span>
                      {todayLog ? (
                        todayLog.takenMedication ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ทานยาแล้ว ({todayLog.medicationTime || 'DOTS'})
                          </span>
                        ) : (
                          <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> ยังไม่ทาน/ขาดทานยา
                          </span>
                        )
                      ) : (
                        <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> รอการบันทึก
                        </span>
                      )}
                    </div>

                    {hasSevereRecent && (
                      <div className="mt-2 text-[11px] font-bold text-rose-700 bg-rose-50 p-1.5 rounded-lg flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        มีอาการเตือนข้างเคียงจากยา
                      </div>
                    )}
                  </div>

                  {/* Audit Metadata Badge */}
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-500 mb-3">
                    <span className="flex items-center gap-1 truncate max-w-[170px]" title={patient.lastUpdatedBy || 'เจ้าหน้าที่'}>
                      <UserCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      <span className="truncate">แก้ไขโดย: <strong>{patient.lastUpdatedBy || 'เจ้าหน้าที่'}</strong></span>
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {formatDateTime(patient.updatedAt || patient.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setPdfModalPatient(patient)}
                    className="py-2 px-3 bg-teal-50 hover:bg-teal-100 active:bg-teal-200 text-teal-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer border border-teal-200/60"
                    title="ส่งออกรายงานประวัติและผลสอบสวนโรค (PDF)"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-700" />
                    <span>PDF</span>
                  </button>

                  {canLog && (
                    <button
                      onClick={() => onOpenQuickLog(patient)}
                      className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      title="บันทึกการทานยาประจำวัน"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      บันทึกยา (DOTS)
                    </button>
                  )}

                  <button
                    onClick={() => onSelectPatient(patient)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
                    title="ดูประวัติและอาการอย่างละเอียด"
                  >
                    <span>ดูประวัติ</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Report & Investigation PDF Modal */}
      {pdfModalPatient && (
        <PatientReportPdfModal
          isOpen={!!pdfModalPatient}
          onClose={() => setPdfModalPatient(null)}
          patient={pdfModalPatient}
          investigation={investigations.find(
            i => i.patientId === pdfModalPatient.id || i.patientHN === pdfModalPatient.hn
          )}
          contacts={contacts}
          logs={logs}
          currentUserProfile={currentUserProfile}
        />
      )}

      {/* Patients Table PDF Export Modal */}
      <ExportTablePdfModal
        isOpen={isTablePdfModalOpen}
        onClose={() => setIsTablePdfModalOpen(false)}
        reportType="patients"
        patients={filteredPatients}
        currentUser={currentUserProfile?.name || 'เจ้าหน้าที่เวชกรรมสังคม'}
      />
    </div>
  );
};

