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
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Patient, DailyLog, ContactPerson, ContactFollowUp, InvestigationForm, UserProfile, HealthcareWorker } from '../types';
import { normalizePatientStatus, isContactTracked } from '../lib/patientUtils';
import { ExecutiveKpiReportModal } from './ExecutiveKpiReportModal';
import { GettingStartedGuide } from './GettingStartedGuide';

interface Props {
  patients: Patient[];
  logs: DailyLog[];
  contacts?: ContactPerson[];
  followUps?: ContactFollowUp[];
  investigations?: InvestigationForm[];
  healthcareWorkers?: HealthcareWorker[];
  currentUserProfile?: UserProfile | null;
  spreadsheetId?: string | null;
  spreadsheetUrl?: string | null;
  hasAccessToken?: boolean;
  onNavigateTab?: (tab: 'patients' | 'contacts' | 'hcw') => void;
}

export const AnalyticsDashboard: React.FC<Props> = ({ 
  patients, 
  logs, 
  contacts = [], 
  followUps = [],
  investigations = [],
  healthcareWorkers = [],
  currentUserProfile,
  spreadsheetId,
  spreadsheetUrl,
  hasAccessToken,
  onNavigateTab 
}) => {
  // Date Filtering State
  const [dateFilterMode, setDateFilterMode] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isExecutiveModalOpen, setIsExecutiveModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showGuide, setShowGuide] = useState<boolean>(() => {
    // If spreadsheet is already connected, hide guide by default unless user has saved preference
    if (!spreadsheetId) return true;
    return localStorage.getItem('tb_care_show_guide') === 'true';
  });

  const toggleGuide = (val: boolean) => {
    setShowGuide(val);
    localStorage.setItem('tb_care_show_guide', val ? 'true' : 'false');
  };

  // Filter items according to selected date period
  const filterByDate = <T extends { date?: string; diagnosisDate?: string; createdAt?: string; scheduledDate?: string; investigationDate?: string; updatedAt?: string }>(items: T[]): T[] => {
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
    }

    if (!startDate && !endDate) return items;

    return items.filter(item => {
      const itemDate = item.diagnosisDate || item.date || item.investigationDate || item.createdAt || item.updatedAt || item.scheduledDate;
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
  const filteredInvestigations = useMemo(() => filterByDate<InvestigationForm>(investigations), [investigations, dateFilterMode, customStartDate, customEndDate]);

  // General Cohort Stats (Robust status normalization)
  const activePatients = filteredPatients.filter(p => normalizePatientStatus(p.status) === 'active');
  const completedPatients = filteredPatients.filter(p => normalizePatientStatus(p.status) === 'completed');
  const defaultedPatients = filteredPatients.filter(p => normalizePatientStatus(p.status) === 'defaulted');
  const transferredPatients = filteredPatients.filter(p => normalizePatientStatus(p.status) === 'transferred');

  // Contact statistics from Disease Investigation (กลุ่มเสี่ยงที่ต้องติดตาม ดึงจากการสอบสวนโรค)
  const investigatedStats = useMemo(() => {
    let householdCount = 0;
    let nonHouseholdCount = 0;
    let under5Count = 0;
    let investigatedPatientsCount = 0;
    const countedHns = new Set<string>();

    filteredPatients.forEach(p => {
      // Find matching investigation form if any
      const inv = filteredInvestigations.find(i => 
        (i.patientId && p.id && i.patientId === p.id) ||
        (i.patientHN && p.hn && i.patientHN.trim().toLowerCase() === p.hn.trim().toLowerCase())
      );

      // Contact count from registered contact table for this patient
      const regHousehold = filteredContacts.filter(c => 
        (c.indexPatientId === p.id || (c.indexPatientHN && p.hn && c.indexPatientHN.toLowerCase() === p.hn.toLowerCase())) &&
        c.contactType === 'household'
      ).length;

      const regNonHousehold = filteredContacts.filter(c => 
        (c.indexPatientId === p.id || (c.indexPatientHN && p.hn && c.indexPatientHN.toLowerCase() === p.hn.toLowerCase())) &&
        c.contactType === 'non_household'
      ).length;

      // Prioritize investigation form count, then patient.householdContactsCount, or registered count
      let house = 0;
      if (inv?.householdContactsCount !== undefined && inv.householdContactsCount !== null) {
        house = Number(inv.householdContactsCount) || 0;
      } else if (p.householdContactsCount !== undefined && p.householdContactsCount !== null) {
        house = Math.max(Number(p.householdContactsCount) || 0, regHousehold);
      } else {
        house = regHousehold;
      }

      let nonHouse = 0;
      if (inv?.nonHouseholdContactsCount !== undefined && inv.nonHouseholdContactsCount !== null) {
        nonHouse = Number(inv.nonHouseholdContactsCount) || 0;
      } else if (p.nonHouseholdContactsCount !== undefined && p.nonHouseholdContactsCount !== null) {
        nonHouse = Math.max(Number(p.nonHouseholdContactsCount) || 0, regNonHousehold);
      } else {
        nonHouse = regNonHousehold;
      }

      const u5 = inv?.under5ContactsCount !== undefined && inv.under5ContactsCount !== null
        ? Number(inv.under5ContactsCount) || 0
        : filteredContacts.filter(c => 
            (c.indexPatientId === p.id || (c.indexPatientHN && p.hn && c.indexPatientHN.toLowerCase() === p.hn.toLowerCase())) && 
            (c.age <= 5 || c.protocolType === 'igra_tpt')
          ).length;

      const isInvestigated = inv !== undefined || p.investigationStatus === 'completed' || (house + nonHouse > 0);
      if (isInvestigated) {
        investigatedPatientsCount += 1;
      }

      householdCount += house;
      nonHouseholdCount += nonHouse;
      under5Count += u5;

      if (p.hn) countedHns.add(p.hn.trim().toLowerCase());
      if (p.id) countedHns.add(p.id);
    });

    // Also include any standalone investigations that weren't directly mapped to filteredPatients
    filteredInvestigations.forEach(inv => {
      const alreadyCounted = (inv.patientHN && countedHns.has(inv.patientHN.trim().toLowerCase())) ||
        (inv.patientId && countedHns.has(inv.patientId));
      if (!alreadyCounted) {
        householdCount += Number(inv.householdContactsCount) || 0;
        nonHouseholdCount += Number(inv.nonHouseholdContactsCount) || 0;
        under5Count += Number(inv.under5ContactsCount) || 0;
        investigatedPatientsCount += 1;
      }
    });

    const totalInvestigated = householdCount + nonHouseholdCount;
    // กลุ่มเสี่ยงที่ต้องติดตาม (ดึงจากการสอบสวน) หรือถ้ามีผู้สัมผัสที่ลงทะเบียนมากกว่าให้ครอบคลุม
    const targetContactsToTrack = totalInvestigated > 0 ? totalInvestigated : filteredContacts.length;

    return {
      householdCount,
      nonHouseholdCount,
      under5Count,
      totalInvestigated,
      targetContactsToTrack,
      investigatedPatientsCount,
    };
  }, [filteredPatients, filteredContacts, filteredInvestigations]);

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

  // Tracked Contacts (CXR, IGRA, TPT, NTIP or follow-up recorded)
  const trackedContacts = useMemo(() => {
    return filteredContacts.filter(c => isContactTracked(c, followUps));
  }, [filteredContacts, followUps]);
  const trackedContactsCount = trackedContacts.length;
  const trackedCoveragePct = filteredContacts.length > 0 ? Math.round((trackedContactsCount / filteredContacts.length) * 100) : 0;
  const trackedCoverageAgainstTargetPct = investigatedStats.targetContactsToTrack > 0 
    ? Math.round((trackedContactsCount / investigatedStats.targetContactsToTrack) * 100) 
    : (filteredContacts.length > 0 ? Math.round((trackedContactsCount / filteredContacts.length) * 100) : 0);

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

  // KPI Calculations (ดึงจากผลการสอบสวนโรคตามเกณฑ์ สธ./DDC)
  const contactRatio = filteredPatients.length > 0 
    ? (investigatedStats.targetContactsToTrack / filteredPatients.length).toFixed(1) 
    : '0';
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

  // Healthcare Worker Screening Statistics (บุคลากรทางการแพทย์)
  const hcwStats = useMemo(() => {
    const activeWorkers = healthcareWorkers.filter(w => w.status === 'active');
    const resignedWorkers = healthcareWorkers.filter(w => w.status !== 'active');
    const highRiskWorkers = activeWorkers.filter(w => w.riskLevel === 'high');

    const currentYear = new Date().getFullYear();
    let screenedThisYearCount = 0;
    let normalCount = 0;
    let suspectTbCount = 0;
    let oldCalcCount = 0;
    let otherAbnormalCount = 0;
    let totalCxrCount = 0;
    let consistentlyNormalCount = 0;

    activeWorkers.forEach(w => {
      const records = w.cxrRecords || [];
      totalCxrCount += records.length;
      if (records.length > 0) {
        const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sorted[0];
        const year = new Date(latest.date).getFullYear();
        if (year === currentYear || year === currentYear - 1) {
          screenedThisYearCount += 1;
        }
        if (latest.result === 'normal') normalCount += 1;
        else if (latest.result === 'abnormal_suspect_tb') suspectTbCount += 1;
        else if (latest.result === 'abnormal_calcification_old') oldCalcCount += 1;
        else if (latest.result === 'abnormal_other') otherAbnormalCount += 1;

        if (records.length > 0 && records.every(r => r.result === 'normal')) {
          consistentlyNormalCount += 1;
        }
      }
    });

    const annualCoveragePct = activeWorkers.length > 0
      ? Math.round((screenedThisYearCount / activeWorkers.length) * 100)
      : 0;

    const isHcwCoveragePass = annualCoveragePct >= 90;

    return {
      total: healthcareWorkers.length,
      active: activeWorkers.length,
      resigned: resignedWorkers.length,
      highRisk: highRiskWorkers.length,
      screenedThisYear: screenedThisYearCount,
      annualCoveragePct,
      isHcwCoveragePass,
      normalCount,
      suspectTbCount,
      oldCalcCount,
      otherAbnormalCount,
      totalCxrCount,
      consistentlyNormalCount
    };
  }, [healthcareWorkers]);

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
      case 'custom': return `${customStartDate || '-'} ถึง ${customEndDate || '-'}`;
      default: return 'ข้อมูลสะสมทั้งหมด';
    }
  };

  const handleCopySummary = async () => {
    const summaryText = `[รายงานสรุปตัวชี้วัดผู้บริหาร - งานควบคุมวัณโรคและติดตามผู้สัมผัสโรค]
โรงพยาบาลมหาวิทยาลัยอุบลราชธานี
ช่วงเวลา: ${getPeriodLabel()}

📊 สรุปผลการดำเนินงานตามตัวชี้วัดกระทรวงสาธารณสุข (NTIP & DDC):
1. การค้นหาและติดตามผู้สัมผัสโรค (จากการสอบสวน): กลุ่มเสี่ยง ${investigatedStats.targetContactsToTrack} คน (ร่วมบ้าน ${investigatedStats.householdCount}, นอกบ้าน ${investigatedStats.nonHouseholdCount}), ติดตามได้แล้ว ${trackedContactsCount} คน (อัตราส่วน ${contactRatio} คน/ดัชนี, เป้าหมาย ≥ 3.0, สอบสวนแล้ว ${investigatedStats.investigatedPatientsCount}/${filteredPatients.length} ราย) -> ${isRatioPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
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
      {/* 0. Getting Started & Setup Guide (Collapsible/Hideable) */}
      {showGuide && (
        <div className="relative">
          <GettingStartedGuide
            spreadsheetId={spreadsheetId}
            spreadsheetUrl={spreadsheetUrl}
            hasAccessToken={hasAccessToken}
          />
          <button
            onClick={() => toggleGuide(false)}
            className="absolute top-4 right-4 px-2.5 py-1 bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            title="ซ่อนกล่องคู่มือเริ่มต้นนี้"
          >
            ซ่อนคู่มือ
          </button>
        </div>
      )}
      
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

        {/* Right: Executive Report Trigger Button & Guide Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {!showGuide && (
            <button
              onClick={() => toggleGuide(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
              title="แสดงคู่มือเริ่มต้นใช้งาน"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-700" />
              <span>คู่มือเริ่มต้น</span>
            </button>
          )}

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
                <span>ไปที่ระบบติดตามกลุ่มเสี่ยง</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Contact Tracing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Contact 1: การค้นหาและกลุ่มเสี่ยงที่ต้องติดตาม (ดึงจากการสอบสวน) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col justify-between ${
            isRatioPass ? 'bg-emerald-50/50 border-emerald-300' : 'bg-amber-50/60 border-amber-300'
          }`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">กลุ่มเสี่ยงที่ต้องติดตาม (จากการสอบสวน)</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  isRatioPass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {isRatioPass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
                </span>
              </div>

              {/* Sub-cards: กลุ่มเสี่ยงที่ต้องติดตาม (ดึงจากการสอบสวน) vs ติดตามได้แล้ว */}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/90 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-600 block leading-tight">กลุ่มเสี่ยงที่ต้องติดตาม</span>
                  <span className="text-[9px] text-teal-700 font-medium block">(ดึงจากการสอบสวน)</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {investigatedStats.targetContactsToTrack} <span className="text-xs font-normal text-slate-500">คน</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium leading-tight">
                    ร่วมบ้าน {investigatedStats.householdCount} • นอกบ้าน {investigatedStats.nonHouseholdCount}
                  </div>
                </div>
                <div className="bg-white/90 rounded-xl p-2.5 border border-teal-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-teal-800 block leading-tight">ติดตามได้แล้ว</span>
                  <span className="text-[9px] text-teal-600 font-medium block">(ตรวจ/คัดกรองแล้ว)</span>
                  <div className="text-xl sm:text-2xl font-black text-teal-800 mt-1">
                    {trackedContactsCount} <span className="text-xs font-semibold text-teal-600">คน</span>
                  </div>
                  <div className="text-[10px] text-teal-700 mt-1 font-medium leading-tight">
                    {trackedCoverageAgainstTargetPct}% ของกลุ่มเสี่ยง
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1">
              <div className="text-xs text-slate-600 flex flex-wrap items-center justify-between gap-1">
                <span>อัตราค้นหา: <strong className="text-slate-900 font-bold">{contactRatio}</strong> คน/ดัชนี (เป้าหมาย &ge; 3.0)</span>
                <span className="text-slate-500 text-[10px]">ผู้ป่วยดัชนี {filteredPatients.length} ราย (สอบสวน {investigatedStats.investigatedPatientsCount}/{filteredPatients.length})</span>
              </div>

              {filteredContacts.length > 0 && (
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                  <span>ขึ้นทะเบียนรายชื่อในระบบ: <strong className="text-slate-700">{filteredContacts.length}</strong> คน</span>
                  {investigatedStats.targetContactsToTrack > filteredContacts.length ? (
                    <span className="text-amber-700 font-medium">รอขึ้นทะเบียนอีก {investigatedStats.targetContactsToTrack - filteredContacts.length} คน</span>
                  ) : (
                    <span className="text-emerald-700 font-medium">ครบตามยอดสอบสวน</span>
                  )}
                </div>
              )}

              <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-1 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full ${isRatioPass ? 'bg-emerald-600' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, (parseFloat(contactRatio) / 3.0) * 100)}%` }}
                />
              </div>
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

      {/* 4. Healthcare Workers Screening Overview (การคัดกรองในบุคลากรทางการแพทย์) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-700" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  การคัดกรองวัณโรคในบุคลากรทางการแพทย์ (Healthcare Personnel TB Screening)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                  Infection Control
                </span>
              </div>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                ติดตามการตรวจเอกซเรย์ปอดประจำปี เพิ่มประวัติ CXR ได้เรื่อยๆ วิเคราะห์แนวโน้มสุขภาพปอดรายบุคคล และเก็บฐานข้อมูลผู้ที่ลาออก
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('hcw')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition"
              >
                <span>ไปที่ระบบจัดการบุคลากรทางการแพทย์</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Healthcare Worker Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: บุคลากรปฏิบัติงาน & ฐานข้อมูลประวัติ */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/60 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">บุคลากรปฏิบัติงานทั้งหมด</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {hcwStats.active} <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>เสี่ยงสูง (ER, ICU, TB, Lab):</span>
                  <span className="font-semibold text-amber-700">{hcwStats.highRisk} คน</span>
                </div>
                <div className="flex justify-between">
                  <span>ฐานข้อมูลผู้ลาออกแล้ว:</span>
                  <span className="font-semibold text-slate-700">{hcwStats.resigned} คน</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
              รวมในฐานข้อมูลทั้งหมด {hcwStats.total} คน
            </div>
          </div>

          {/* Card 2: ความครอบคลุม CXR ประจำปี */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col justify-between ${
            hcwStats.isHcwCoveragePass ? 'bg-emerald-50/50 border-emerald-300' : 'bg-amber-50/60 border-amber-300'
          }`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">ความครอบคลุม CXR ประจำปี</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  hcwStats.isHcwCoveragePass ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {hcwStats.isHcwCoveragePass ? '✅ ผ่านเกณฑ์' : '⚠️ ต้องเร่งรัด'}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {hcwStats.annualCoveragePct}%
              </div>
              <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center justify-between gap-1">
                <span>เป้าหมาย: 100%</span>
                <span>ตรวจแล้ว {hcwStats.screenedThisYear}/{hcwStats.active} คน</span>
              </div>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full ${hcwStats.isHcwCoveragePass ? 'bg-emerald-600' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(hcwStats.annualCoveragePct, 100)}%` }}
              />
            </div>
          </div>

          {/* Card 3: ผลการตรวจ CXR ประจำปี */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col justify-between ${
            hcwStats.suspectTbCount > 0 ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300' : 'bg-white border-slate-200'
          }`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">ผลการตรวจคัดกรองปอด (CXR)</span>
                {hcwStats.suspectTbCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                    ⚠️ พบสงสัย TB
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ปลอดภัย
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-2 text-slate-900">
                {hcwStats.normalCount} <span className="text-xs font-normal text-slate-500">คนปกติ</span>
              </div>
              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>ปกติ (Normal Clear):</span>
                  <span className="font-semibold text-emerald-700">{hcwStats.normalCount} คน</span>
                </div>
                <div className="flex justify-between">
                  <span>สงสัยวัณโรค (Suspect TB):</span>
                  <span className={`font-bold ${hcwStats.suspectTbCount > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                    {hcwStats.suspectTbCount} คน
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>รอยโรคเดิมคงที่ (Old Scar):</span>
                  <span className="font-semibold text-amber-700">{hcwStats.oldCalcCount} คน</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
              {hcwStats.suspectTbCount > 0 ? 'ส่งตรวจเสมหะและปรึกษาแพทย์ทันที' : 'ทุกรายได้รับการบันทึกผลเรียบร้อย'}
            </div>
          </div>

          {/* Card 4: สถิติแนวโน้มรายบุคคล */}
          <div className="p-4 sm:p-5 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800">สถิติแนวโน้มรายบุคคล</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  Longitudinal
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-teal-950 mt-2">
                {hcwStats.totalCxrCount} <span className="text-xs font-normal text-teal-700">ครั้งที่ตรวจสะสม</span>
              </div>
              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>ปกติสม่ำเสมอทุกรอบ:</span>
                  <span className="font-semibold text-emerald-700">{hcwStats.consistentlyNormalCount} คน</span>
                </div>
                <div className="flex justify-between">
                  <span>ระบบบันทึกซ้ำ:</span>
                  <span className="font-medium text-teal-800">เพิ่มผล CXR ได้ไม่จำกัด</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-teal-200/60 text-[11px] text-teal-800 flex items-center justify-between">
              <span>ฐานข้อมูลเฝ้าระวังระยะยาว</span>
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            </div>
          </div>

        </div>

      </div>

      {/* 5. Charts & Surveillance Analytics */}
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
          investigations={filteredInvestigations}
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
