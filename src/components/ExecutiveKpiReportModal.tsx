import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  HeartHandshake, 
  Stethoscope, 
  CheckCircle2, 
  Calendar,
  Building2,
  Filter,
  BarChart3,
  Award,
  ChevronRight
} from 'lucide-react';
import { Patient, DailyLog, ContactPerson, ContactFollowUp, UserProfile } from '../types';
import { formatThaiDate, formatThaiDateTime } from '../lib/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  logs: DailyLog[];
  contacts: ContactPerson[];
  followUps: ContactFollowUp[];
  currentUserProfile?: UserProfile | null;
  initialDateRange?: { start: string; end: string; label: string };
}

export const ExecutiveKpiReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  patients,
  logs,
  contacts,
  followUps,
  currentUserProfile,
  initialDateRange
}) => {
  const [dateFilterMode, setDateFilterMode] = useState<string>(initialDateRange?.label || 'all');
  const [customStart, setCustomStart] = useState<string>(initialDateRange?.start || '');
  const [customEnd, setCustomEnd] = useState<string>(initialDateRange?.end || '');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter calculations based on dates
  const filterByDate = <T extends { date?: string; diagnosisDate?: string; createdAt?: string; scheduledDate?: string }>(items: T[]): T[] => {
    if (dateFilterMode === 'all') return items;
    
    let startDate = customStart;
    let endDate = customEnd;

    const now = new Date();
    if (dateFilterMode === 'today') {
      startDate = now.toISOString().split('T')[0];
      endDate = startDate;
    } else if (dateFilterMode === 'last7') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (dateFilterMode === 'last30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    }

    if (!startDate && !endDate) return items;

    return items.filter(item => {
      const itemDate = item.diagnosisDate || item.date || item.createdAt || item.scheduledDate;
      if (!itemDate) return true;
      const cleanDate = itemDate.split('T')[0];
      if (startDate && cleanDate < startDate) return false;
      if (endDate && cleanDate > endDate) return false;
      return true;
    });
  };

  const filteredPatients = filterByDate<Patient>(patients);
  const filteredLogs = filterByDate<DailyLog>(logs);
  const filteredContacts = filterByDate<ContactPerson>(contacts);

  // --- 1. KPI Calculations (National TB Control Program - 3 Key Indicators) ---
  const totalIndexPatients = filteredPatients.length;
  const activePatients = filteredPatients.filter(p => p.status === 'active').length;
  const curedOrCompleted = filteredPatients.filter(p => p.status === 'completed').length;
  const defaulted = filteredPatients.filter(p => p.status === 'defaulted').length;
  const closedCases = curedOrCompleted + defaulted;

  const totalContacts = filteredContacts.length;
  const householdContacts = filteredContacts.filter(c => c.contactType === 'household');
  const nonHouseholdContacts = filteredContacts.filter(c => c.contactType === 'non_household');
  const under5Contacts = filteredContacts.filter(c => c.age <= 5 || c.protocolType === 'igra_tpt');
  
  // KPI 1: อัตราความสำเร็จการรักษาผู้ป่วยวัณโรค (Target: > 85%)
  const treatmentSuccessRate = closedCases > 0 
    ? Math.round((curedOrCompleted / closedCases) * 100) 
    : (totalIndexPatients > 0 ? Math.round((curedOrCompleted / totalIndexPatients) * 100) : 100);
  const isSuccessPass = treatmentSuccessRate >= 85;

  // KPI 2: อัตราความครอบคลุมของการสอบสวนโรค (Target: > 85%)
  const investigatedPatients = filteredPatients.filter(p => 
    p.investigationStatus === 'completed' ||
    filteredContacts.some(c => c.indexPatientId === p.id) ||
    ((p.householdContactsCount ?? 0) + (p.nonHouseholdContactsCount ?? 0) > 0)
  );
  const investigatedPatientsCount = investigatedPatients.length;
  const investigationCoveragePct = totalIndexPatients > 0 
    ? Math.round((investigatedPatientsCount / totalIndexPatients) * 100) 
    : 0;
  const isInvestigationPass = investigationCoveragePct >= 85;

  // KPI 3: อัตราการติดตามกลุ่มเสี่ยงตรวจคัดกรองเอกเรย์ปอด (Target: > 85%)
  const contactsWithCxr = filteredContacts.filter(c => 
    c.cxrStatus === 'done' || c.cxrResult === 'normal' || c.cxrResult === 'abnormal_suspect_tb' || c.cxrResult === 'abnormal_other' ||
    (c.cxrDate && c.cxrDate.length > 0)
  );
  const cxrCoveragePct = totalContacts > 0 ? Math.round((contactsWithCxr.length / totalContacts) * 100) : 0;
  const isCxrCoveragePass = cxrCoveragePct >= 85;

  // Additional stats for clinical breakdown
  const contactRatio = totalIndexPatients > 0 ? (totalContacts / totalIndexPatients).toFixed(1) : '0';
  const ntipRegisteredContacts = filteredContacts.filter(c => c.ntipStatus === 'entered');
  const under5OnTpt = under5Contacts.filter(c => c.tptStatus === 'on_tpt' || c.tptStatus === 'completed');
  const under5TptCoveragePct = under5Contacts.length > 0 ? Math.round((under5OnTpt.length / under5Contacts.length) * 100) : 100;
  const totalOnTpt = filteredContacts.filter(c => c.tptStatus === 'on_tpt' || c.tptStatus === 'completed');

  // CXR Findings Breakdown
  const cxrNormal = filteredContacts.filter(c => c.cxrResult === 'normal').length;
  const cxrSuspectTb = filteredContacts.filter(c => c.cxrResult === 'abnormal_suspect_tb').length;
  const cxrOtherAbnormal = filteredContacts.filter(c => c.cxrResult === 'abnormal_other').length;
  const cxrPending = filteredContacts.filter(c => c.cxrStatus === 'pending' || c.cxrResult === 'pending' || (!c.cxrResult && !c.cxrStatus)).length;

  // TPT Regimen breakdown
  const tpt3hp = filteredContacts.filter(c => c.tptRegimen?.includes('3HP')).length;
  const tpt1hp = filteredContacts.filter(c => c.tptRegimen?.includes('1HP')).length;
  const tpt6h = filteredContacts.filter(c => c.tptRegimen?.includes('6H')).length;

  // Format Date Range Label
  const getPeriodLabel = () => {
    switch (dateFilterMode) {
      case 'today': return 'ข้อมูลประจำวันนี้';
      case 'last7': return 'ย้อนหลัง 7 วัน';
      case 'last30': return 'ย้อนหลัง 30 วัน';
      case 'custom': return `ช่วงวันที่ ${customStart || '-'} ถึง ${customEnd || '-'}`;
      default: return 'ข้อมูลสะสมทั้งหมด (Cumulative All-Time)';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = async () => {
    const summaryText = `[รายงานสรุปตัวชี้วัดผู้บริหาร - งานควบคุมวัณโรคและติดตามผู้สัมผัสโรค]
โรงพยาบาลมหาวิทยาลัยอุบลราชธานี
ช่วงเวลา: ${getPeriodLabel()}

📊 สรุปผลการดำเนินงานตามตัวชี้วัดหลัก:
1. อัตราความสำเร็จการรักษาผู้ป่วยวัณโรค: ${treatmentSuccessRate}% (${curedOrCompleted}/${closedCases || totalIndexPatients} ราย, เป้าหมาย > 85%) -> ${isSuccessPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
2. อัตราความครอบคลุมของการสอบสวนโรค: ${investigationCoveragePct}% (${investigatedPatientsCount}/${totalIndexPatients} ราย, เป้าหมาย > 85%) -> ${isInvestigationPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
3. อัตราการติดตามกลุ่มเสี่ยงตรวจคัดกรองเอกเรย์ปอด: ${cxrCoveragePct}% (${contactsWithCxr.length}/${totalContacts} คน, เป้าหมาย > 85%) -> ${isCxrCoveragePass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}

ผู้รายงาน: ${currentUserProfile?.displayName || 'นางสาวไอญารินธร อุ้มบุญ'} (${currentUserProfile?.position || 'นักวิชาการสาธารณสุข'})
วันที่ออกรายงาน: ${formatThaiDate(new Date(), { short: false })}`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Screen only */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white px-6 py-5 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/30 shadow-inner">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  รายงานสรุปตัวชี้วัดสำหรับผู้บริหาร (Executive KPI Dashboard)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  DDC & WHO Standard
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-0.5">
                โรงพยาบาลมหาวิทยาลัยอุบลราชธานี • งานควบคุมโรคและติดตามผู้สัมผัสวัณโรค
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
              title="คัดลอกข้อความสรุปผู้บริหาร"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'คัดลอกแล้ว' : 'คัดลอกสรุป'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ / ส่งออก PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Filter Toolbar - Screen only */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-slate-700">กรองช่วงเวลาข้อมูล:</span>
            <div className="inline-flex rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
              {[
                { key: 'all', label: 'ทั้งหมด' },
                { key: 'today', label: 'วันนี้' },
                { key: 'last7', label: '7 วัน' },
                { key: 'last30', label: '30 วัน' },
                { key: 'custom', label: 'กำหนดเอง' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setDateFilterMode(opt.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    dateFilterMode === opt.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {dateFilterMode === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              />
              <span className="text-slate-400">ถึง</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
          )}

          <div className="text-slate-500 text-[11px]">
            แสดงผล: <strong className="text-slate-800">{getPeriodLabel()}</strong>
          </div>
        </div>

        {/* Scrollable Printable Report Content */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 print:p-0 print:overflow-visible print:space-y-4">
          
          {/* Official Hospital Document Header */}
          <div className="border-b-2 border-teal-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-teal-600 print:w-12 print:h-12">
                UBU
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                  โรงพยาบาลมหาวิทยาลัยอุบลราชธานี
                </h1>
                <h2 className="text-sm sm:text-base font-bold text-teal-800">
                  รายงานสรุปผลการดำเนินงานและตัวชี้วัดการควบคุมวัณโรคและการติดตามผู้สัมผัสโรค (TB Executive KPI Report)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ตามเกณฑ์มาตรฐานกองวัณโรค กรมควบคุมโรค (DDC) และองค์การอนามัยโลก (WHO)
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs space-y-1 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
              <div><strong>ช่วงเวลาที่ประเมิน:</strong> <span className="text-teal-900 font-semibold">{getPeriodLabel()}</span></div>
              <div><strong>วันที่จัดทำรายงาน:</strong> {formatThaiDateTime(new Date())}</div>
              <div><strong>ผู้จัดทำ:</strong> {currentUserProfile?.displayName || 'นางสาวไอญารินธร อุ้มบุญ'} ({currentUserProfile?.position || 'นักวิชาการสาธารณสุข'})</div>
            </div>
          </div>

          {/* Section 1: Top KPI Executive Scorecards (3 Key Indicators) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-700" />
                <span>1. สรุปผลการดำเนินงานตามตัวชี้วัดหลัก (Key Performance Indicators)</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">เปรียบเทียบผลงานกับเกณฑ์เป้าหมาย &gt; 85%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* KPI 1: อัตราความสำเร็จการรักษาผู้ป่วยวัณโรค */}
              <div className={`p-4 rounded-2xl border transition ${
                isSuccessPass ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">อัตราความสำเร็จการรักษา</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    isSuccessPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {isSuccessPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {treatmentSuccessRate}%
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center justify-between gap-1">
                  <span>เป้าหมาย: &gt; 85%</span>
                  <span>สำเร็จ {curedOrCompleted}/{closedCases || totalIndexPatients} ราย</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${isSuccessPass ? 'bg-emerald-600' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, treatmentSuccessRate)}%` }}
                  />
                </div>
              </div>

              {/* KPI 2: อัตราความครอบคลุมของการสอบสวนโรค */}
              <div className={`p-4 rounded-2xl border transition ${
                isInvestigationPass ? 'bg-emerald-50/70 border-emerald-300' : 'bg-amber-50/70 border-amber-300'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">ความครอบคลุมการสอบสวนโรค</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    isInvestigationPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {isInvestigationPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {investigationCoveragePct}%
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center justify-between gap-1">
                  <span>เป้าหมาย: &gt; 85%</span>
                  <span>สอบสวนแล้ว {investigatedPatientsCount}/{totalIndexPatients} ราย</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${isInvestigationPass ? 'bg-emerald-600' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, investigationCoveragePct)}%` }}
                  />
                </div>
              </div>

              {/* KPI 3: อัตราการติดตามกลุ่มเสี่ยงตรวจคัดกรองเอกเรย์ปอด */}
              <div className={`p-4 rounded-2xl border transition ${
                isCxrCoveragePass ? 'bg-emerald-50/70 border-emerald-300' : 'bg-rose-50/70 border-rose-300'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800">การติดตามตรวจ CXR กลุ่มเสี่ยง</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    isCxrCoveragePass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {isCxrCoveragePass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {cxrCoveragePct}%
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center justify-between gap-1">
                  <span>เป้าหมาย: &gt; 85%</span>
                  <span>ตรวจแล้ว {contactsWithCxr.length}/{totalContacts} คน</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${isCxrCoveragePass ? 'bg-emerald-600' : 'bg-rose-500'}`}
                    style={{ width: `${Math.min(100, cxrCoveragePct)}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Full KPI Standard Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>2. ตารางตัวชี้วัดมาตรฐานกองวัณโรค กรมควบคุมโรค และผลการดำเนินงานโรงพยาบาล</span>
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-200 font-bold">
                    <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                    <th className="py-2.5 px-3">ตัวชี้วัด (KPI Description)</th>
                    <th className="py-2.5 px-3 text-center">เกณฑ์เป้าหมาย</th>
                    <th className="py-2.5 px-3 text-center">ตัวตั้ง / ตัวหาร</th>
                    <th className="py-2.5 px-3 text-center">ผลงานที่ทำได้</th>
                    <th className="py-2.5 px-3 text-center">ผลการประเมิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  
                  {/* KPI 1 */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center font-medium">1</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      อัตราความสำเร็จการรักษาผู้ป่วยวัณโรค (Treatment Success Rate)
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium">&gt; 85%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {curedOrCompleted} / {closedCases || totalIndexPatients} ราย
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{treatmentSuccessRate}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSuccessPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isSuccessPass ? 'ดีเยี่ยม' : 'ต้องเร่งรัด'}
                      </span>
                    </td>
                  </tr>

                  {/* KPI 2 */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center font-medium">2</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      อัตราความครอบคลุมของการสอบสวนโรค (Contact Investigation Coverage Rate)
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium">&gt; 85%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {investigatedPatientsCount} / {totalIndexPatients} ราย
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{investigationCoveragePct}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isInvestigationPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isInvestigationPass ? 'ดีเยี่ยม' : 'ต้องเร่งรัด'}
                      </span>
                    </td>
                  </tr>

                  {/* KPI 3 */}
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-center font-medium">3</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      อัตราการติดตามกลุ่มเสี่ยงตรวจคัดกรองเอกเรย์ปอด (CXR Screening Rate in Risk Group)
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium">&gt; 85%</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">
                      {contactsWithCxr.length} / {totalContacts} คน
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-900">{cxrCoveragePct}%</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCxrCoveragePass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isCxrCoveragePass ? 'ดีเยี่ยม' : 'ต้องเร่งรัด'}
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Contact Tracing & Clinical Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Box: Contact Groups & High Risk */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Users className="w-4 h-4 text-teal-700" />
                <span>จำแนกกลุ่มสัมผัสและความเสี่ยง (Risk Stratification)</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">ผู้สัมผัสร่วมบ้าน (Household Contacts):</span>
                  <span className="font-bold text-emerald-950">{householdContacts.length} คน ({totalContacts > 0 ? Math.round((householdContacts.length / totalContacts) * 100) : 0}%)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">ผู้สัมผัสนอกบ้าน (Non-household Contacts):</span>
                  <span className="font-bold text-slate-800">{nonHouseholdContacts.length} คน ({totalContacts > 0 ? Math.round((nonHouseholdContacts.length / totalContacts) * 100) : 0}%)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">เด็กอายุ ≤ 5 ปี (High-risk Age Group):</span>
                  <span className="font-bold text-amber-900">{under5Contacts.length} คน (ตรวจ TPT {under5OnTpt.length} คน)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">การให้ยาป้องกัน TPT ทั้งหมด:</span>
                  <span className="font-bold text-cyan-900">{totalOnTpt.length} คน (สูตร 3HP: {tpt3hp}, 1HP: {tpt1hp}, 6H: {tpt6h})</span>
                </div>
              </div>
            </div>

            {/* Right Box: CXR Screening Results */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Stethoscope className="w-4 h-4 text-emerald-700" />
                <span>สรุปผลภาพถ่ายรังสีทรวงอก (CXR Findings Breakdown)</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">ผลปกติ (Normal - ไม่พบรอยโรค):</span>
                  <span className="font-bold text-emerald-800">{cxrNormal} คน</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">พบความผิดปกติ สงสัยวัณโรค (Suspect TB):</span>
                  <span className={`font-bold ${cxrSuspectTb > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                    {cxrSuspectTb} คน {cxrSuspectTb > 0 ? '(ส่งตรวจยืนยันเสมหะแล้ว)' : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">พบความผิดปกติอื่นๆ (Other Abnormalities):</span>
                  <span className="font-bold text-amber-800">{cxrOtherAbnormal} คน</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">รอผลตรวจ / อยู่ระหว่างติดตาม:</span>
                  <span className="font-bold text-slate-600">{cxrPending} คน</span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 4: Executive Conclusion & Next Action Plan */}
          <div className="bg-teal-50/80 border border-teal-200 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
              <span>3. บทสรุปเชิงบริหารและข้อเสนอแนะในการดำเนินงาน (Executive Recommendations)</span>
            </h4>
            <div className="text-xs text-slate-700 leading-relaxed space-y-1">
              <p>• <strong>ด้านความสำเร็จการรักษา (Treatment Success Rate):</strong> ผลการรักษาสำเร็จอยู่ที่ <strong>{treatmentSuccessRate}%</strong> {isSuccessPass ? 'ผ่านเกณฑ์เป้าหมาย (> 85%)' : 'ควรติดตามการทานยาและกำกับการกินยาต่อเนื่อง (DOTS) อย่างใกล้ชิด'}</p>
              <p>• <strong>ด้านความครอบคลุมการสอบสวนโรค (Investigation Coverage):</strong> ความครอบคลุมการสอบสวนโรคอยู่ที่ <strong>{investigationCoveragePct}%</strong> {isInvestigationPass ? 'บรรลุตามเกณฑ์เป้าหมาย (> 85%)' : 'ควรเร่งรัดการลงพื้นที่สอบสวนและค้นหากลุ่มสัมผัสร่วมบ้านของผู้ป่วยดัชนีให้ครบถ้วน'}</p>
              <p>• <strong>ด้านการติดตามกลุ่มเสี่ยงตรวจคัดกรอง CXR:</strong> อัตราการตรวจเอกซเรย์ปอดกลุ่มเสี่ยงอยู่ที่ <strong>{cxrCoveragePct}%</strong> {isCxrCoveragePass ? 'ผ่านเกณฑ์เป้าหมาย (> 85%)' : 'ควรประสานงานนัดหมายตรวจเอกซเรย์ปอดในกลุ่มที่ยังค้างตรวจให้ครอบคลุม'}</p>
            </div>
          </div>

          {/* Section 5: Official Sign-off Block */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-12">
              <p className="text-slate-600 font-medium">ผู้จัดทำรายงาน</p>
              <div>
                <p className="font-bold text-slate-900 border-b border-slate-400 pb-1 max-w-[180px] mx-auto">
                  {currentUserProfile?.displayName || 'นางสาวไอญารินธร อุ้มบุญ'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{currentUserProfile?.position || 'นักวิชาการสาธารณสุข'}</p>
              </div>
            </div>

            <div className="space-y-12">
              <p className="text-slate-600 font-medium">ผู้ตรวจสอบ</p>
              <div>
                <p className="font-bold text-slate-900 border-b border-slate-400 pb-1 max-w-[180px] mx-auto">
                  นางสาวชุดาภา มากดี
                </p>
                <p className="text-[11px] text-slate-500 mt-1">พยาบาลวิชาชีพปฏิบัติการ</p>
                <p className="text-[11px] text-slate-500">หัวหน้างานเวชกรรมสังคม</p>
              </div>
            </div>

            <div className="space-y-12">
              <p className="text-slate-600 font-medium">ผู้อนุมัติ</p>
              <div>
                <p className="font-bold text-slate-900 border-b border-slate-400 pb-1 max-w-[180px] mx-auto">
                  นางสาวกุลนันทน์  สายบุตร
                </p>
                <p className="text-[11px] text-slate-500 mt-1">พยาบาลวิชาชีพปฏิบัติการ</p>
                <p className="text-[11px] text-slate-500">หัวหน้างานบริการปฐมภูมิ</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
