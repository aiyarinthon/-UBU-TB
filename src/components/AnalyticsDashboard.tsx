import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  Activity, 
  Pill, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Heart, 
  Users, 
  HeartHandshake, 
  ArrowRight, 
  Filter, 
  Printer, 
  Award, 
  Stethoscope, 
  CheckCircle2, 
  Copy, 
  Check, 
  Home, 
  Building, 
  CalendarClock,
  FileCheck2,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import { Patient, DailyLog, ContactPerson, ContactFollowUp, UserProfile } from '../types';
import { ExecutiveKpiReportModal } from './ExecutiveKpiReportModal';

interface Props {
  patients: Patient[];
  logs: DailyLog[];
  contacts?: ContactPerson[];
  followUps?: ContactFollowUp[];
  currentUserProfile?: UserProfile | null;
  onNavigateTab?: (tab: 'patients' | 'contacts') => void;
}

export const AnalyticsDashboard: React.FC<Props> = ({ 
  patients, 
  logs, 
  contacts = [], 
  followUps = [],
  currentUserProfile,
  onNavigateTab 
}) => {
  // Date Filtering State
  const [dateFilterMode, setDateFilterMode] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isExecutiveModalOpen, setIsExecutiveModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Filter items according to selected date period
  const filterByDate = <T extends { date?: string; diagnosisDate?: string; createdAt?: string; scheduledDate?: string }>(items: T[]): T[] => {
    if (dateFilterMode === 'all') return items;

    let startDate = customStartDate;
    let endDate = customEndDate;
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
    } else if (dateFilterMode === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (dateFilterMode === 'fy2568') {
      startDate = '2024-10-01';
      endDate = '2025-09-30';
    } else if (dateFilterMode === 'fy2569') {
      startDate = '2025-10-01';
      endDate = '2026-09-30';
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

  const filteredPatients = useMemo(() => filterByDate<Patient>(patients), [patients, dateFilterMode, customStartDate, customEndDate]);
  const filteredLogs = useMemo(() => filterByDate<DailyLog>(logs), [logs, dateFilterMode, customStartDate, customEndDate]);
  const filteredContacts = useMemo(() => filterByDate<ContactPerson>(contacts), [contacts, dateFilterMode, customStartDate, customEndDate]);

  // General Cohort Stats
  const activePatients = filteredPatients.filter(p => p.status === 'active');
  const completedPatients = filteredPatients.filter(p => p.status === 'completed');
  const defaultedPatients = filteredPatients.filter(p => p.status === 'defaulted');

  // Contact tracing statistics
  const householdContacts = filteredContacts.filter(c => c.contactType === 'household');
  const nonHouseholdContacts = filteredContacts.filter(c => c.contactType === 'non_household');
  const under5Contacts = filteredContacts.filter(c => c.age <= 5 || c.protocolType === 'igra_tpt');
  const ntipRegistered = filteredContacts.filter(c => c.ntipStatus === 'entered');
  const cxrDone = filteredContacts.filter(c => 
    c.cxrStatus === 'done' || c.cxrResult === 'normal' || c.cxrResult === 'abnormal_suspect_tb' || c.cxrResult === 'abnormal_other' || (c.cxrDate && c.cxrDate.length > 0)
  );
  const onTpt = filteredContacts.filter(c => c.tptStatus === 'on_tpt' || c.tptStatus === 'completed');
  const under5OnTpt = under5Contacts.filter(c => c.tptStatus === 'on_tpt' || c.tptStatus === 'completed');

  // CXR Findings Breakdown
  const cxrNormal = filteredContacts.filter(c => c.cxrResult === 'normal').length;
  const cxrSuspectTb = filteredContacts.filter(c => c.cxrResult === 'abnormal_suspect_tb').length;
  const cxrOtherAbnormal = filteredContacts.filter(c => c.cxrResult === 'abnormal_other').length;
  const cxrPending = filteredContacts.filter(c => c.cxrStatus === 'pending' || c.cxrResult === 'pending' || (!c.cxrResult && !c.cxrStatus)).length;

  // TPT Regimen breakdown
  const tpt3hp = filteredContacts.filter(c => c.tptRegimen?.includes('3HP')).length;
  const tpt1hp = filteredContacts.filter(c => c.tptRegimen?.includes('1HP')).length;
  const tpt6h = filteredContacts.filter(c => c.tptRegimen?.includes('6H')).length;

  // CXR 4-Rounds Breakdown (DDC protocol)
  const cxrRound1Count = filteredContacts.filter(c => c.cxrDate || c.cxrRound === 'cxr_1_0m' || c.cxrStatus === 'done').length;
  const cxrRound2Count = followUps.filter(f => f.stepType === 'cxr_2_6m' && f.status === 'completed').length;
  const cxrRound3Count = followUps.filter(f => f.stepType === 'cxr_3_12m' && f.status === 'completed').length;
  const cxrRound4Count = followUps.filter(f => f.stepType === 'cxr_4_18m' && f.status === 'completed').length;

  // KPI Calculations
  const contactRatio = filteredPatients.length > 0 ? (filteredContacts.length / filteredPatients.length).toFixed(1) : '0';
  const isRatioPass = parseFloat(contactRatio) >= 3.0;

  const cxrCoveragePct = filteredContacts.length > 0 ? Math.round((cxrDone.length / filteredContacts.length) * 100) : 0;
  const isCxrCoveragePass = cxrCoveragePct >= 90;

  const ntipCoveragePct = filteredContacts.length > 0 ? Math.round((ntipRegistered.length / filteredContacts.length) * 100) : 0;
  const isNtipPass = ntipCoveragePct >= 90;

  const under5TptPct = under5Contacts.length > 0 ? Math.round((under5OnTpt.length / under5Contacts.length) * 100) : 100;
  const isUnder5TptPass = under5TptPct >= 90;

  const totalTaken = filteredLogs.filter(l => l.takenMedication).length;
  const overallAdherenceRate = filteredLogs.length > 0 ? Math.round((totalTaken / filteredLogs.length) * 100) : 100;
  const isAdherencePass = overallAdherenceRate >= 90;

  const closedCases = completedPatients.length + defaultedPatients.length;
  const treatmentSuccessRate = closedCases > 0 ? Math.round((completedPatients.length / closedCases) * 100) : (filteredPatients.length > 0 ? Math.round((completedPatients.length / filteredPatients.length) * 100) : 100);
  const isSuccessPass = treatmentSuccessRate >= 85;

  // Adherence trend for the selected view
  const adherenceTrendData = useMemo(() => {
    const daysCount = dateFilterMode === 'last30' ? 14 : 7;
    const result: { date: string; displayDate: string; taken: number; missed: number }[] = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });

      const dayLogs = filteredLogs.filter(l => l.date === dateStr);
      const taken = dayLogs.filter(l => l.takenMedication).length;
      const missed = dayLogs.filter(l => !l.takenMedication).length;

      result.push({
        date: dateStr,
        displayDate,
        taken,
        missed,
      });
    }
    return result;
  }, [filteredLogs, dateFilterMode]);

  // Symptom frequencies
  const symptomCounts = useMemo(() => {
    return [
      { name: 'ไอ/ไอเรื้อรัง', count: filteredLogs.filter(l => l.symptoms.cough).length },
      { name: 'ไข้/ตัวร้อน', count: filteredLogs.filter(l => l.symptoms.fever).length },
      { name: 'อ่อนเพลีย', count: filteredLogs.filter(l => l.symptoms.fatigue).length },
      { name: 'คลื่นไส้อาเจียน', count: filteredLogs.filter(l => l.symptoms.nauseaVomiting).length },
      { name: 'ผื่นคัน', count: filteredLogs.filter(l => l.symptoms.rashItch).length },
      { name: 'ปวดข้อ/กล้ามเนื้อ', count: filteredLogs.filter(l => l.symptoms.jointPain).length },
      { name: 'ตาเหลืองตัวเหลือง (ตับ)', count: filteredLogs.filter(l => l.symptoms.yellowSkinEyes).length },
      { name: 'ไอเป็นเลือด', count: filteredLogs.filter(l => l.symptoms.coughBlood).length },
      { name: 'ตามัว/สีเพี้ยน', count: filteredLogs.filter(l => l.symptoms.visionChanges).length },
    ].filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  }, [filteredLogs]);

  // Regimen distribution
  const regimenMap: Record<string, number> = {};
  filteredPatients.forEach(p => {
    const reg = p.treatmentRegimen || '2HRZE/4HR';
    regimenMap[reg] = (regimenMap[reg] || 0) + 1;
  });
  const regimenData = Object.entries(regimenMap).map(([name, value]) => ({ name, value }));
  const COLORS = ['#059669', '#0d9488', '#0284c7', '#f59e0b', '#e11d48'];

  // Contact CXR status pie
  const cxrPieData = [
    { name: 'ปกติ (Normal)', value: filteredContacts.filter(c => c.cxrResult === 'normal').length, color: '#059669' },
    { name: 'สงสัยวัณโรค (Suspect TB)', value: filteredContacts.filter(c => c.cxrResult === 'abnormal_suspect_tb').length, color: '#e11d48' },
    { name: 'ผิดปกติอื่นๆ (Other)', value: filteredContacts.filter(c => c.cxrResult === 'abnormal_other').length, color: '#f59e0b' },
    { name: 'รอตรวจ/ติดตาม (Pending)', value: filteredContacts.filter(c => c.cxrStatus === 'pending' || c.cxrResult === 'pending' || (!c.cxrResult && !c.cxrStatus)).length, color: '#64748b' },
  ].filter(d => d.value > 0);

  const getPeriodLabel = () => {
    switch (dateFilterMode) {
      case 'today': return 'ข้อมูลวันนี้';
      case 'last7': return '7 วันล่าสุด';
      case 'last30': return '30 วันล่าสุด';
      case 'thisMonth': return 'เดือนปัจจุบัน';
      case 'fy2568': return 'ปีงบประมาณ 2568';
      case 'fy2569': return 'ปีงบประมาณ 2569';
      case 'custom': return `${customStartDate || '-'} ถึง ${customEndDate || '-'}`;
      default: return 'ข้อมูลสะสมทั้งหมด';
    }
  };

  const handleCopySummary = async () => {
    const summaryText = `[รายงานสรุปตัวชี้วัดผู้บริหาร - งานควบคุมวัณโรคและติดตามผู้สัมผัสโรค]
โรงพยาบาลมหาวิทยาลัยอุบลราชธานี
ช่วงเวลา: ${getPeriodLabel()}

📊 สรุปผลการดำเนินงานตามตัวชี้วัดกระทรวงสาธารณสุข (NTIP & DDC):
1. อัตราการค้นหาผู้สัมผัสโรคต่อผู้ป่วยดัชนี: ${contactRatio} คน/ราย (เป้าหมาย ≥ 3.0) -> ${isRatioPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
2. ความครอบคลุมการตรวจ CXR ในผู้สัมผัส: ${cxrCoveragePct}% (${cxrDone.length}/${filteredContacts.length} คน, เป้าหมาย ≥ 90%) -> ${isCxrCoveragePass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
3. การขึ้นทะเบียนระบบ NTIP: ${ntipCoveragePct}% (${ntipRegistered.length}/${filteredContacts.length} คน, เป้าหมาย 100%) -> ${isNtipPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
4. การให้ยาป้องกัน TPT ในเด็ก ≤ 5 ปี: ${under5TptPct}% (${under5OnTpt.length}/${under5Contacts.length} คน, เป้าหมาย 100%) -> ${isUnder5TptPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
5. ความร่วมมือการรับประทานยา (DOTS Rate): ${overallAdherenceRate}% (เป้าหมาย ≥ 90%) -> ${isAdherencePass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
6. ผู้ป่วยวัณโรคที่รักษาหาย/ครบกำหนด: ${completedPatients.length} ราย (สำเร็จ ${treatmentSuccessRate}%)

ผู้รายงาน: ${currentUserProfile?.displayName || 'นางสาวไอญารินธร อุ้มบุญ'} (${currentUserProfile?.position || 'นักวิชาการสาธารณสุข'})`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Date Filter & Executive Action Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs mr-1">
            <Filter className="w-4 h-4 text-teal-700" />
            <span>กรองช่วงเวลา:</span>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-2xs flex-wrap gap-1">
            {[
              { key: 'all', label: 'ทั้งหมด' },
              { key: 'today', label: 'วันนี้' },
              { key: 'last7', label: '7 วันล่าสุด' },
              { key: 'last30', label: '30 วันล่าสุด' },
              { key: 'thisMonth', label: 'เดือนนี้' },
              { key: 'fy2568', label: 'ปีงบ 68' },
              { key: 'fy2569', label: 'ปีงบ 69' },
              { key: 'custom', label: 'กำหนดเอง' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setDateFilterMode(opt.key)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dateFilterMode === opt.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {dateFilterMode === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-800"
              />
              <span className="text-slate-400">ถึง</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Right: Executive Report Trigger Button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopySummary}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="คัดลอกข้อความสรุปผู้บริหาร"
          >
            {copiedSummary ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedSummary ? 'คัดลอกแล้ว' : 'คัดลอกสรุป'}</span>
          </button>

          <button
            onClick={() => setIsExecutiveModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 hover:from-teal-900 hover:to-emerald-950 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer border border-teal-700/50"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>ดึงรายงานผู้บริหาร (Executive KPI Report)</span>
          </button>
        </div>
      </div>

      {/* 2. Patient Cohort Overview Cards (Classic Dashboard Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Patients */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-teal-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ผู้ป่วยในการดูแลทั้งหมด</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">
            {filteredPatients.length} <span className="text-xs font-normal text-slate-500">ราย</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>กำลังรักษา {activePatients.length} ราย</span>
            <span className="text-teal-700 font-semibold">{getPeriodLabel()}</span>
          </div>
        </div>

        {/* Card 2: Active Patients */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-teal-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">กำลังรับการรักษา</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-900 mt-2">
            {activePatients.length} <span className="text-xs font-normal text-slate-500">ราย</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>สัดส่วน {filteredPatients.length > 0 ? Math.round((activePatients.length / filteredPatients.length) * 100) : 0}% ของทั้งหมด</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">Active</span>
          </div>
        </div>

        {/* Card 3: Treatment Success / Completed */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">รักษาหาย / ครบกำหนด</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-900 mt-2">
            {completedPatients.length} <span className="text-xs font-normal text-slate-500">ราย</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>ความสำเร็จ {treatmentSuccessRate}%</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {isSuccessPass ? 'ผ่านเกณฑ์ ≥85%' : 'กำลังสะสม'}
            </span>
          </div>
        </div>

        {/* Card 4: Medication Adherence Rate */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:border-blue-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ความร่วมมือการทานยา (DOTS)</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-900 mt-2">
            {overallAdherenceRate}%
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>บันทึก {totalTaken}/{filteredLogs.length} ครั้ง</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isAdherencePass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {isAdherencePass ? 'ดีเยี่ยม ≥90%' : 'ต้องติดตาม'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Contact Tracing Overview Cards */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              การติดตามกลุ่มเสี่ยงและผู้สัมผัสโรค (Contact Tracing Overview)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold ml-1">
              DDC Standard
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('contacts')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
              >
                <span>ไปที่แถบการติดตามกลุ่มเสี่ยง</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Contact Tracing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Contact 1: การค้นหาผู้สัมผัส */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition ${
            isRatioPass ? 'bg-emerald-50/50 border-emerald-300' : 'bg-amber-50/60 border-amber-300'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">การค้นหาผู้สัมผัส</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                isRatioPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isRatioPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {contactRatio} <span className="text-xs font-normal text-slate-600">คน/ผู้ป่วยดัชนี</span>
            </div>
            <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center justify-between gap-1">
              <span>เป้าหมาย: &ge; 3.0</span>
              <span>รวม {filteredContacts.length} คน ({filteredPatients.length} ดัชนี)</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full ${isRatioPass ? 'bg-emerald-600' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, (parseFloat(contactRatio) / 4) * 100)}%` }}
              />
            </div>
          </div>

          {/* Contact 2: ความครอบคลุม CXR */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition ${
            isCxrCoveragePass ? 'bg-emerald-50/50 border-emerald-300' : 'bg-rose-50/60 border-rose-300'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">ความครอบคลุม CXR</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                isCxrCoveragePass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {isCxrCoveragePass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {cxrCoveragePct}%
            </div>
            <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center justify-between gap-1">
              <span>เป้าหมาย: &ge; 90%</span>
              <span>ตรวจแล้ว {cxrDone.length}/{filteredContacts.length} คน</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full ${isCxrCoveragePass ? 'bg-emerald-600' : 'bg-rose-500'}`}
                style={{ width: `${cxrCoveragePct}%` }}
              />
            </div>
          </div>

          {/* Contact 3: ขึ้นทะเบียน n-tip */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition ${
            isNtipPass ? 'bg-emerald-50/50 border-emerald-300' : 'bg-amber-50/60 border-amber-300'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">ขึ้นทะเบียน n-tip</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                isNtipPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isNtipPass ? '✅ ผ่านเกณฑ์' : '⚠️ เฝ้าระวัง'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {ntipCoveragePct}%
            </div>
            <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center justify-between gap-1">
              <span>เป้าหมาย: 100%</span>
              <span>ลงแล้ว {ntipRegistered.length}/{filteredContacts.length} คน</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full ${isNtipPass ? 'bg-emerald-600' : 'bg-amber-500'}`}
                style={{ width: `${ntipCoveragePct}%` }}
              />
            </div>
          </div>

          {/* Contact 4: TPT ในเด็ก ≤ 5 ปี */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition ${
            isUnder5TptPass ? 'bg-emerald-50/50 border-emerald-300' : 'bg-amber-50/60 border-amber-300'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">TPT ในเด็ก ≤ 5 ปี</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                isUnder5TptPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isUnder5TptPass ? '✅ ผ่านเกณฑ์' : '⚠️ เฝ้าระวัง'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {under5TptPct}%
            </div>
            <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center justify-between gap-1">
              <span>เป้าหมาย: 100%</span>
              <span>รับยา {under5OnTpt.length}/{under5Contacts.length} คน</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full ${isUnder5TptPass ? 'bg-emerald-600' : 'bg-amber-500'}`}
                style={{ width: `${under5TptPct}%` }}
              />
            </div>
          </div>

        </div>

      </div>

      {/* 4. Charts & Surveillance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Adherence Trend Chart */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>แนวโน้มการทานยาตามรอบบันทึก (DOTS Adherence Trend)</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">เฉลี่ย {overallAdherenceRate}%</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            จำนวนผู้ป่วยที่ทานยาครบตรงเวลาเปรียบเทียบกับผู้ที่ขาดทานยา
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adherenceTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${val} คน`,
                    name === 'taken' ? 'ทานยาแล้ว' : 'ขาดทานยา'
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="taken" name="taken" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" name="missed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Symptoms & Adverse Events Monitoring */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>ความถี่อาการและผลข้างเคียงที่ตรวจพบ (Symptom Monitoring)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            ช่วยเฝ้าระวังผลข้างเคียงจากสูตรยาวัณโรค เช่น พิษต่อตับ (Hepatotoxicity) หรือเส้นประสาท
          </p>

          {symptomCounts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="text-xs">ยังไม่พบรายงานอาการข้างเคียงรุนแรงในช่วงเวลานี้</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {symptomCounts.slice(0, 6).map((item, idx) => {
                const isRed = item.name.includes('ตับ') || item.name.includes('เลือด') || item.name.includes('ตามัว');
                const maxCount = symptomCounts[0]?.count || 1;
                const pct = Math.round((item.count / maxCount) * 100);

                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-medium ${isRed ? 'text-rose-700 font-bold flex items-center gap-1' : 'text-slate-700'}`}>
                        {isRed && <AlertTriangle className="w-3.5 h-3.5 text-rose-600 inline" />}
                        {item.name}
                      </span>
                      <span className="text-slate-500 font-semibold">{item.count} ครั้ง</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${isRed ? 'bg-rose-500' : 'bg-teal-500'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 5. Distribution Charts (Regimens & Contact CXR Findings) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Treatment Regimens */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-600" />
            <span>สัดส่วนสูตรยารักษาวัณโรค (Treatment Regimens)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            จำแนกตามสูตรมาตรฐาน Category 1 (2HRZE/4HR), สูตรปรับเปลี่ยน และยาวัณโรคดื้อยา
          </p>

          <div className="h-56 w-full flex items-center justify-center">
            {regimenData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regimenData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {regimenData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} ราย`, 'จำนวนผู้ป่วย']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">ไม่มีข้อมูลผู้ป่วย</div>
            )}
          </div>
        </div>

        {/* CXR Screening Findings */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>ผลการตรวจภาพถ่ายรังสีทรวงอกผู้สัมผัส (CXR Findings)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            ผลการตรวจคัดกรองปอดในกลุ่มผู้สัมผัสโรคเพื่อค้นหาผู้ป่วยเชิงรุก
          </p>

          <div className="h-56 w-full flex items-center justify-center">
            {cxrPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cxrPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {cxrPieData.map((entry, index) => (
                      <Cell key={`cell-cxr-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} คน`, 'จำนวนผู้สัมผัส']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">ไม่มีข้อมูลการตรวจ CXR</div>
            )}
          </div>
        </div>

      </div>

      {/* 6. Executive KPI Report Modal */}
      {isExecutiveModalOpen && (
        <ExecutiveKpiReportModal
          isOpen={isExecutiveModalOpen}
          onClose={() => setIsExecutiveModalOpen(false)}
          patients={filteredPatients}
          logs={filteredLogs}
          contacts={filteredContacts}
          followUps={followUps}
          currentUserProfile={currentUserProfile}
          initialDateRange={{
            start: customStartDate,
            end: customEndDate,
            label: dateFilterMode
          }}
        />
      )}

    </div>
  );
};
