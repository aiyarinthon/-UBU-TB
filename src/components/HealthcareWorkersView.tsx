import React, { useState, useMemo } from 'react';
import { 
  Stethoscope, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building, 
  User, 
  Activity, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Edit2, 
  Trash2, 
  Download, 
  UserMinus, 
  TrendingUp, 
  Table as TableIcon, 
  LayoutGrid, 
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { HealthcareWorker, HcwCxrRecord, UserProfile } from '../types';
import { formatThaiDate } from '../lib/dateUtils';
import { HcwModal } from './HcwModal';
import { HcwAddCxrModal } from './HcwAddCxrModal';
import { HcwDetailModal } from './HcwDetailModal';
import { HcwResignModal } from './HcwResignModal';

interface Props {
  workers: HealthcareWorker[];
  currentUserProfile?: UserProfile | null;
  spreadsheetUrl?: string | null;
  onSaveWorker: (worker: HealthcareWorker) => void;
  onSaveCxr: (workerId: string, record: Omit<HcwCxrRecord, 'id' | 'createdAt'>) => void;
  onResignWorker: (
    workerId: string, 
    status: HealthcareWorker['status'], 
    resignationDate: string, 
    resignationReason: string, 
    resignationNotes?: string
  ) => void;
  onReactivateWorker?: (workerId: string) => void;
  onDeleteWorker?: (workerId: string) => void;
  onDeleteCxrRecord?: (workerId: string, cxrId: string) => void;
  onResetInitialData?: () => void;
  isExternalAddModalOpen?: boolean;
  onExternalAddModalClosed?: () => void;
}

export const HealthcareWorkersView: React.FC<Props> = ({
  workers = [],
  currentUserProfile,
  spreadsheetUrl,
  onSaveWorker,
  onSaveCxr,
  onResignWorker,
  onReactivateWorker,
  onDeleteWorker,
  onDeleteCxrRecord,
  onResetInitialData,
  isExternalAddModalOpen,
  onExternalAddModalClosed
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'resigned' | 'all'>('active');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [cxrFilter, setCxrFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state (unified single-source of truth)
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<HealthcareWorker | null>(null);

  React.useEffect(() => {
    if (isExternalAddModalOpen) {
      setEditingWorker(null);
      setIsWorkerModalOpen(true);
      if (onExternalAddModalClosed) onExternalAddModalClosed();
    }
  }, [isExternalAddModalOpen, onExternalAddModalClosed]);

  const [isAddCxrOpen, setIsAddCxrOpen] = useState(false);
  const [selectedWorkerForCxr, setSelectedWorkerForCxr] = useState<HealthcareWorker | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedWorkerForDetail, setSelectedWorkerForDetail] = useState<HealthcareWorker | null>(null);

  const [isResignOpen, setIsResignOpen] = useState(false);
  const [selectedWorkerForResign, setSelectedWorkerForResign] = useState<HealthcareWorker | null>(null);

  // Departments List
  const departments = useMemo(() => {
    const set = new Set<string>();
    workers.forEach(w => {
      if (w.department) set.add(w.department);
    });
    return Array.from(set).sort();
  }, [workers]);

  // Current year for annual screening evaluation
  const currentYear = new Date().getFullYear();

  // Filtered Workers
  const filteredWorkers = useMemo(() => {
    return workers.filter(w => {
      // 1. Status filter (Active vs Resigned Archive vs All)
      if (statusFilter === 'active' && w.status !== 'active') return false;
      if (statusFilter === 'resigned' && w.status === 'active') return false;

      // 2. Department filter
      if (departmentFilter !== 'all' && w.department !== departmentFilter) return false;

      // 3. Risk level filter
      if (riskFilter !== 'all' && w.riskLevel !== riskFilter) return false;

      // 4. Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = w.fullName.toLowerCase().includes(query);
        const matchesId = w.staffId?.toLowerCase().includes(query);
        const matchesHn = w.hn?.toLowerCase().includes(query);
        const matchesDept = w.department.toLowerCase().includes(query);
        const matchesPosition = w.position.toLowerCase().includes(query);
        const matchesPhone = w.phone?.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesHn && !matchesDept && !matchesPosition && !matchesPhone) {
          return false;
        }
      }

      // 5. CXR status filter
      if (cxrFilter !== 'all') {
        const records = w.cxrRecords || [];
        const latest = records.length > 0
          ? [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
          : null;

        const isScreenedThisYear = latest && new Date(latest.date).getFullYear() === currentYear;

        if (cxrFilter === 'screened_this_year' && !isScreenedThisYear) return false;
        if (cxrFilter === 'overdue' && isScreenedThisYear) return false;
        if (cxrFilter === 'abnormal' && (!latest || latest.result !== 'abnormal_suspect_tb')) return false;
        if (cxrFilter === 'normal' && (!latest || latest.result !== 'normal')) return false;
        if (cxrFilter === 'calcification' && (!latest || latest.result !== 'abnormal_calcification_old')) return false;
      }

      return true;
    });
  }, [workers, statusFilter, departmentFilter, riskFilter, searchTerm, cxrFilter, currentYear]);

  // Overall Statistics for Category Cards
  const stats = useMemo(() => {
    const activeWorkers = workers.filter(w => w.status === 'active');
    const resignedWorkers = workers.filter(w => w.status !== 'active');
    
    // Risk groups among active staff
    const highRisk = activeWorkers.filter(w => w.riskLevel === 'high').length;
    const mediumRisk = activeWorkers.filter(w => w.riskLevel === 'medium').length;
    const lowRisk = activeWorkers.filter(w => w.riskLevel === 'low').length;

    // Annual CXR screening evaluation
    let screenedThisYear = 0;
    let normalCount = 0;
    let suspectTbCount = 0;
    let oldCalcCount = 0;

    activeWorkers.forEach(w => {
      const records = w.cxrRecords || [];
      if (records.length > 0) {
        const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sorted[0];
        const recordYear = new Date(latest.date).getFullYear();

        if (recordYear === currentYear) {
          screenedThisYear += 1;
        }

        if (latest.result === 'normal') normalCount += 1;
        else if (latest.result === 'abnormal_suspect_tb') suspectTbCount += 1;
        else if (latest.result === 'abnormal_calcification_old') oldCalcCount += 1;
      }
    });

    const overdueCount = activeWorkers.length - screenedThisYear;
    const coveragePct = activeWorkers.length > 0 ? Math.round((screenedThisYear / activeWorkers.length) * 100) : 0;

    return {
      total: workers.length,
      active: activeWorkers.length,
      resigned: resignedWorkers.length,
      highRisk,
      mediumRisk,
      lowRisk,
      screenedThisYear,
      overdueCount,
      coveragePct,
      normalCount,
      suspectTbCount,
      oldCalcCount
    };
  }, [workers, currentYear]);

  // Handlers for Opening Modals
  const handleOpenNewWorker = () => {
    setEditingWorker(null);
    setIsWorkerModalOpen(true);
  };

  const handleOpenEditWorker = (w: HealthcareWorker) => {
    setEditingWorker(w);
    setIsWorkerModalOpen(true);
  };

  const handleOpenAddCxr = (w: HealthcareWorker) => {
    setSelectedWorkerForCxr(w);
    setIsAddCxrOpen(true);
  };

  const handleOpenDetail = (w: HealthcareWorker) => {
    setSelectedWorkerForDetail(w);
    setIsDetailOpen(true);
  };

  const handleOpenResign = (w: HealthcareWorker) => {
    setSelectedWorkerForResign(w);
    setIsResignOpen(true);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'รหัสบุคลากร',
      'HN',
      'ชื่อ-นามสกุล',
      'เพศ',
      'อายุ',
      'เบอร์โทร',
      'แผนก/ฝ่าย',
      'ตำแหน่ง',
      'ประเภทการจ้าง',
      'สถานะการปฏิบัติงาน',
      'วันที่ลาออก',
      'เหตุผลการลาออก',
      'ระดับความเสี่ยง TB',
      'ประวัติสัมผัส TB ในงาน',
      'จำนวนครั้งตรวจ CXR',
      'วันที่ตรวจ CXR ล่าสุด',
      'ผลตรวจ CXR ล่าสุด',
      'รายละเอียดผลอ่านฟิล์ม',
      'วันนัดตรวจครั้งถัดไป'
    ];

    const rows = filteredWorkers.map(w => {
      const records = w.cxrRecords || [];
      const latest = records.length > 0
        ? [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

      const cxrResultLabel = latest
        ? latest.result === 'normal'
          ? 'ปกติ (Normal)'
          : latest.result === 'abnormal_suspect_tb'
          ? 'ผิดปกติสงสัยวัณโรค'
          : latest.result === 'abnormal_calcification_old'
          ? 'รอยโรคเก่าสงบ (Calcification)'
          : 'ผิดปกติอื่นๆ'
        : 'ยังไม่เคยตรวจ';

      return [
        `"${w.staffId || ''}"`,
        `"${w.hn || ''}"`,
        `"${w.fullName}"`,
        `"${w.gender === 'female' ? 'หญิง' : w.gender === 'male' ? 'ชาย' : 'อื่นๆ'}"`,
        w.age,
        `"${w.phone || ''}"`,
        `"${w.department}"`,
        `"${w.position}"`,
        `"${w.employmentType}"`,
        `"${w.status === 'active' ? 'ปฏิบัติงานอยู่' : 'ลาออก/พ้นสภาพ'}"`,
        `"${w.resignationDate || ''}"`,
        `"${w.resignationReason || ''}"`,
        `"${w.riskLevel === 'high' ? 'สูง' : w.riskLevel === 'medium' ? 'ปานกลาง' : 'ต่ำ'}"`,
        `"${w.exposureHistory ? 'เคยสัมผัส' : 'ไม่เคย'}"`,
        records.length,
        `"${latest?.date || ''}"`,
        `"${cxrResultLabel}"`,
        `"${(latest?.resultDetail || '').replace(/"/g, '""')}"`,
        `"${latest?.nextScheduledDate || ''}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `รายงานคัดกรองวัณโรคบุคลากรทางการแพทย์_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Primary Actions */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                คัดกรองวัณโรคในบุคลากรทางการแพทย์
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                HCW TB Surveillance
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              เฝ้าระวังกลุ่มเสี่ยงในโรงพยาบาล ตรวจเอกซเรย์ปอดประจำปี เพิ่มประวัติ CXR ได้ต่อเนื่อง และเก็บฐานข้อมูลผู้ที่ลาออก
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onResetInitialData && (
            <button
              onClick={onResetInitialData}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="โหลดข้อมูลตัวอย่างบุคลากรทางการแพทย์"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>โหลดตัวอย่าง</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>

          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheet</span>
            </a>
          )}

          <button
            onClick={handleOpenNewWorker}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-700/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มบุคลากรใหม่</span>
          </button>
        </div>
      </div>

      {/* 2. Distinct Color-Coded Category Cards (แยกสีแต่ละกลุ่มให้ดูข้อมูลที่ง่ายขึ้น) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Card 1: บุคลากรปฏิบัติงาน (Active Staff) - Emerald Theme */}
        <div 
          onClick={() => {
            setStatusFilter('active');
            setRiskFilter('all');
            setCxrFilter('all');
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'active' && riskFilter === 'all' && cxrFilter === 'all'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">กำลังปฏิบัติงาน</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-1.5 tabular-nums">
            {stats.active} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1">
            ตรวจ CXR ปีนี้แล้ว {stats.coveragePct}%
          </div>
        </div>

        {/* Card 2: กลุ่มเสี่ยงสูง (High Risk) - Rose/Red Theme */}
        <div 
          onClick={() => {
            setStatusFilter('active');
            setRiskFilter('high');
            setCxrFilter('all');
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            riskFilter === 'high'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">กลุ่มเสี่ยงสูง</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-950 mt-1.5 tabular-nums">
            {stats.highRisk} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-rose-700 font-medium mt-1 truncate">
            ER, ICU, TB, Lab ชันสูตร
          </div>
        </div>

        {/* Card 3: กลุ่มเสี่ยงปานกลาง (Medium Risk) - Amber/Orange Theme */}
        <div 
          onClick={() => {
            setStatusFilter('active');
            setRiskFilter('medium');
            setCxrFilter('all');
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            riskFilter === 'medium'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">กลุ่มเสี่ยงปานกลาง</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-1.5 tabular-nums">
            {stats.mediumRisk} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-amber-700 font-medium mt-1 truncate">
            วอร์ดสามัญ, OPD, รังสี
          </div>
        </div>

        {/* Card 4: กลุ่มเสี่ยงต่ำ (Low Risk) - Teal/Cyan Theme */}
        <div 
          onClick={() => {
            setStatusFilter('active');
            setRiskFilter('low');
            setCxrFilter('all');
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            riskFilter === 'low'
              ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">กลุ่มเสี่ยงต่ำ</span>
            <span className="w-2 h-2 rounded-full bg-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-950 mt-1.5 tabular-nums">
            {stats.lowRisk} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-teal-700 font-medium mt-1 truncate">
            ธุรการ, เวชระเบียน, คลังยา
          </div>
        </div>

        {/* Card 5: สงสัยวัณโรค / ผิดปกติ (Suspect TB Alert) - High Alert Theme */}
        <div 
          onClick={() => {
            setStatusFilter('active');
            setCxrFilter('abnormal');
            setRiskFilter('all');
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            cxrFilter === 'abnormal'
              ? 'bg-red-50 border-red-400 ring-2 ring-red-300 shadow-xs'
              : stats.suspectTbCount > 0
              ? 'bg-red-50/50 border-red-300 hover:border-red-400'
              : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">สงสัยวัณโรค</span>
            {stats.suspectTbCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            )}
          </div>
          <div className={`text-2xl font-black mt-1.5 tabular-nums ${stats.suspectTbCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {stats.suspectTbCount} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className={`text-[10px] font-bold mt-1 ${stats.suspectTbCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
            {stats.suspectTbCount > 0 ? '⚠️ ส่งตรวจเสมหะด่วน' : 'ไม่พบผู้สงสัย TB'}
          </div>
        </div>

        {/* Card 6: ฐานข้อมูลผู้ที่ลาออก (Resigned Archive) - Slate Theme */}
        <div 
          onClick={() => {
            setStatusFilter('resigned');
            setRiskFilter('all');
            setCxrFilter('all');
          }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'resigned'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">ฐานข้อมูลผู้ลาออก</span>
            <UserMinus className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1.5 tabular-nums">
            {stats.resigned} <span className="text-xs font-normal text-slate-500">คน</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            เก็บบันทึกประวัติถาวร
          </div>
        </div>

      </div>

      {/* 3. Unified Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        
        {/* Top Filter Row: Status Segmented Control & View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>กำลังปฏิบัติงาน</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold tabular-nums">
                {stats.active}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('resigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'resigned'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>ลาออกแล้ว (ฐานข้อมูลประวัติ)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold tabular-nums">
                {stats.resigned}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>ทั้งหมด</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold tabular-nums">
                {stats.total}
              </span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="มุมมองการ์ด"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="มุมมองตาราง"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Second Filter Row: Search & Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัสบุคลากร, HN, แผนก, ตำแหน่ง..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50/50"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="all">ทุกแผนก / ฝ่าย ({departments.length} แผนก)</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="all">ทุกระดับความเสี่ยง</option>
              <option value="high">🔴 เสี่ยงสูง (High Risk)</option>
              <option value="medium">🟡 เสี่ยงปานกลาง (Medium Risk)</option>
              <option value="low">🟢 เสี่ยงต่ำ (Low Risk)</option>
            </select>
          </div>

          {/* CXR Status Filter */}
          <div>
            <select
              value={cxrFilter}
              onChange={(e) => setCxrFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="all">ทุกสถานะการตรวจ CXR</option>
              <option value="screened_this_year">✓ ตรวจคัดกรองแล้วรอบปีนี้</option>
              <option value="overdue">⏱️ ยังค้างตรวจในรอบปีนี้</option>
              <option value="abnormal">⚠️ ผลผิดปกติ / สงสัยวัณโรค</option>
              <option value="calcification">รอยโรคเก่าสงบ (Calcification)</option>
              <option value="normal">ผลตรวจปอดปกติ</option>
            </select>
          </div>

        </div>

        {/* Active Filter Clear Indicator */}
        {(searchTerm || departmentFilter !== 'all' || riskFilter !== 'all' || cxrFilter !== 'all' || statusFilter !== 'active') && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
            <span>
              พบข้อมูลที่ตรงกับเงื่อนไข: <strong className="text-slate-800">{filteredWorkers.length}</strong> รายการ
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
                setRiskFilter('all');
                setCxrFilter('all');
                setStatusFilter('active');
              }}
              className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )}

      </div>

      {/* 4. Main Content: Grid or Table View */}
      {filteredWorkers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {workers.length === 0 ? 'ยังไม่มีข้อมูลบุคลากรทางการแพทย์ในระบบ' : 'ไม่พบบุคลากรที่ตรงกับเงื่อนไขการค้นหา'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {workers.length === 0 
              ? 'ท่านสามารถกดปุ่ม "โหลดข้อมูลตัวอย่าง" เพื่อเริ่มต้นดูรูปแบบระบบคัดกรองบุคลากร หรือกด "เพิ่มบุคลากรใหม่" เพื่อบันทึกข้อมูลเจ้าหน้าที่จริง'
              : 'ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อดูข้อมูลบุคลากรทั้งหมด'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {workers.length === 0 && onResetInitialData && (
              <button
                onClick={onResetInitialData}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>โหลดข้อมูลตัวอย่างบุคลากร (10 ท่าน)</span>
              </button>
            )}
            <button
              onClick={handleOpenNewWorker}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ ลงทะเบียนบุคลากรใหม่</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Grid Mode (Distinct Color Stripe & Non-redundant Layout) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map(w => {
            const records = w.cxrRecords || [];
            const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latestCxr = sortedRecords[0];
            const isScreenedThisYear = latestCxr && new Date(latestCxr.date).getFullYear() === currentYear;

            // Risk color coding
            const riskConfig = {
              high: {
                stripe: 'border-l-4 border-l-rose-500',
                badge: 'bg-rose-50 text-rose-700 border-rose-200',
                label: 'เสี่ยงสูง',
                cardRing: latestCxr?.result === 'abnormal_suspect_tb' ? 'ring-2 ring-rose-300' : ''
              },
              medium: {
                stripe: 'border-l-4 border-l-amber-500',
                badge: 'bg-amber-50 text-amber-700 border-amber-200',
                label: 'เสี่ยงปานกลาง',
                cardRing: ''
              },
              low: {
                stripe: 'border-l-4 border-l-teal-500',
                badge: 'bg-teal-50 text-teal-700 border-teal-200',
                label: 'เสี่ยงต่ำ',
                cardRing: ''
              }
            }[w.riskLevel] || {
              stripe: 'border-l-4 border-l-slate-400',
              badge: 'bg-slate-100 text-slate-700 border-slate-200',
              label: 'ทั่วไป',
              cardRing: ''
            };

            return (
              <div
                key={w.id}
                className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between overflow-hidden ${riskConfig.stripe} ${riskConfig.cardRing} ${
                  w.status !== 'active' ? 'bg-slate-50/60 opacity-90' : ''
                }`}
              >
                {/* Card Body */}
                <div className="p-4 space-y-3">
                  
                  {/* Row 1: Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Risk Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${riskConfig.badge}`}>
                        {riskConfig.label}
                      </span>

                      {/* Employment Status Badge */}
                      {w.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ปฏิบัติงาน
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          ลาออก/พ้นสภาพ
                        </span>
                      )}
                    </div>

                    {w.staffId && (
                      <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                        {w.staffId}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Staff Profile */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                      {w.fullName.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 
                        onClick={() => handleOpenDetail(w)}
                        className="text-sm font-bold text-slate-900 hover:text-teal-700 transition cursor-pointer truncate"
                      >
                        {w.fullName}
                      </h3>
                      <p className="text-xs text-slate-600 truncate mt-0.5">
                        {w.position}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 shrink-0" />
                        <span>{w.department}</span>
                      </p>
                    </div>
                  </div>

                  {/* Row 3: CXR Screening Status & History Timeline */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">ผลตรวจ CXR ล่าสุด:</span>
                      {latestCxr ? (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          latestCxr.result === 'normal'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : latestCxr.result === 'abnormal_suspect_tb'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 font-black animate-pulse'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {latestCxr.result === 'normal' 
                            ? '✓ ปอดปกติ' 
                            : latestCxr.result === 'abnormal_suspect_tb' 
                            ? '⚠️ สงสัยวัณโรค' 
                            : 'รอยโรคเก่าสงบ'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                          ยังไม่มีประวัติ CXR
                        </span>
                      )}
                    </div>

                    {latestCxr && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>วันที่ตรวจล่าสุด:</span>
                        <span className="font-semibold text-slate-700">
                          {formatThaiDate(latestCxr.date)} ({records.length} ครั้ง)
                        </span>
                      </div>
                    )}

                    {latestCxr?.nextScheduledDate && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>นัดรอบถัดไป:</span>
                        <span className="font-semibold text-teal-800">
                          {formatThaiDate(latestCxr.nextScheduledDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Resignation Archive Note */}
                  {w.status !== 'active' && w.resignationDate && (
                    <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-700 space-y-0.5">
                      <div className="font-bold flex items-center gap-1 text-slate-800">
                        <UserMinus className="w-3 h-3 text-slate-500" />
                        <span>ลาออกเมื่อ: {formatThaiDate(w.resignationDate)}</span>
                      </div>
                      <div className="text-slate-600 truncate">
                        เหตุผล: {w.resignationReason || 'พ้นสภาพการปฏิบัติงาน'}
                      </div>
                    </div>
                  )}

                </div>

                {/* Card Footer Actions */}
                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* ปุ่มเพิ่มผล CXR ได้เรื่อยๆ */}
                    <button
                      onClick={() => handleOpenAddCxr(w)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg transition cursor-pointer shadow-2xs text-[11px]"
                      title="เพิ่มผลตรวจเอกซเรย์รอบใหม่"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ ผล CXR</span>
                    </button>

                    {/* ปุ่มดูประวัติและแนวโน้มรายบุคคล */}
                    <button
                      onClick={() => handleOpenDetail(w)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg transition cursor-pointer text-[11px]"
                      title="ดูประวัติและสถิติแนวโน้ม"
                    >
                      <TrendingUp className="w-3 h-3 text-teal-600" />
                      <span>ประวัติ/แนวโน้ม</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* ปุ่มกดลาออก เพื่อทำเป็นฐานข้อมูล */}
                    <button
                      onClick={() => handleOpenResign(w)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        w.status === 'active'
                          ? 'bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-slate-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                      }`}
                      title={w.status === 'active' ? 'บันทึกการลาออก (เก็บในฐานข้อมูลประวัติ)' : 'แก้ไขสถานะลาออก/คืนสถานะ'}
                    >
                      {w.status === 'active' ? (
                        <UserMinus className="w-3.5 h-3.5" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* ปุ่มแก้ไขข้อมูล */}
                    <button
                      onClick={() => handleOpenEditWorker(w)}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 transition cursor-pointer"
                      title="แก้ไขข้อมูลบุคลากร"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* ปุ่มลบ */}
                    {onDeleteWorker && (
                      <button
                        onClick={() => {
                          if (confirm(`ต้องการลบข้อมูลบุคลากร "${w.fullName}" ออกจากระบบใช่หรือไม่?`)) {
                            onDeleteWorker(w.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-300 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
                        title="ลบข้อมูล"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      ) : (
        
        /* Table Mode */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">บุคลากร / ตำแหน่ง</th>
                  <th className="py-3 px-4">แผนก / ฝ่าย</th>
                  <th className="py-3 px-4">กลุ่มความเสี่ยง TB</th>
                  <th className="py-3 px-4">สถานะการปฏิบัติงาน</th>
                  <th className="py-3 px-4">ตรวจ CXR ล่าสุด</th>
                  <th className="py-3 px-4">ผลอ่านฟิล์ม</th>
                  <th className="py-3 px-4">รอบตรวจถัดไป</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkers.map(w => {
                  const records = w.cxrRecords || [];
                  const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  const latest = sorted[0];

                  const riskConfig = {
                    high: { badge: 'bg-rose-50 text-rose-700 border-rose-200', label: 'เสี่ยงสูง' },
                    medium: { badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'เสี่ยงปานกลาง' },
                    low: { badge: 'bg-teal-50 text-teal-700 border-teal-200', label: 'เสี่ยงต่ำ' }
                  }[w.riskLevel] || { badge: 'bg-slate-50 text-slate-700 border-slate-200', label: 'ทั่วไป' };

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => handleOpenDetail(w)}
                          className="font-bold text-slate-900 hover:text-teal-700 transition cursor-pointer"
                        >
                          {w.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {w.position} {w.staffId && `• รหัส ${w.staffId}`}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {w.department}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${riskConfig.badge}`}>
                          {riskConfig.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {w.status === 'active' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ปฏิบัติงาน
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200" title={w.resignationReason}>
                            ลาออกแล้ว
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {latest ? (
                          <div>
                            <span className="font-semibold text-slate-800">{formatThaiDate(latest.date)}</span>
                            <span className="text-[10px] text-slate-400 block">ตรวจแล้ว {records.length} ครั้ง</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">ยังไม่เคยตรวจ</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {latest ? (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            latest.result === 'normal' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : latest.result === 'abnormal_suspect_tb' 
                              ? 'bg-rose-50 text-rose-700 border-rose-300 font-black' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {latest.result === 'normal' 
                              ? '✓ ปอดปกติ' 
                              : latest.result === 'abnormal_suspect_tb' 
                              ? '⚠️ สงสัยวัณโรค' 
                              : 'รอยโรคเก่า'}
                          </span>
                        ) : '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {latest?.nextScheduledDate ? formatThaiDate(latest.nextScheduledDate) : '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAddCxr(w)}
                            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                            title="+ เพิ่มผลตรวจ CXR"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenDetail(w)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="ดูประวัติและแนวโน้มรายบุคคล"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenResign(w)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="บันทึกการลาออก (ฐานข้อมูลประวัติ)"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEditWorker(w)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit2 className="w-4 h-4" />
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
      )}

      {/* 5. Unified Modals (Single-source modal controls) */}
      {isWorkerModalOpen && (
        <HcwModal
          isOpen={isWorkerModalOpen}
          onClose={() => {
            setIsWorkerModalOpen(false);
            setEditingWorker(null);
          }}
          onSaveWorker={(worker) => {
            onSaveWorker(worker);
            setIsWorkerModalOpen(false);
            setEditingWorker(null);
          }}
          editingWorker={editingWorker}
          currentUserProfile={currentUserProfile}
        />
      )}

      {isAddCxrOpen && selectedWorkerForCxr && (
        <HcwAddCxrModal
          isOpen={isAddCxrOpen}
          worker={selectedWorkerForCxr}
          onClose={() => {
            setIsAddCxrOpen(false);
            setSelectedWorkerForCxr(null);
          }}
          onSaveCxr={(workerId, record) => {
            onSaveCxr(workerId, record);
            setIsAddCxrOpen(false);
            setSelectedWorkerForCxr(null);
          }}
          currentUserProfile={currentUserProfile}
        />
      )}

      {isDetailOpen && selectedWorkerForDetail && (
        <HcwDetailModal
          isOpen={isDetailOpen}
          worker={selectedWorkerForDetail}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedWorkerForDetail(null);
          }}
          onOpenAddCxr={(w) => {
            setSelectedWorkerForCxr(w);
            setIsAddCxrOpen(true);
          }}
          onOpenResign={(w) => {
            setSelectedWorkerForResign(w);
            setIsResignOpen(true);
          }}
          onOpenEdit={(w) => {
            setEditingWorker(w);
            setIsWorkerModalOpen(true);
          }}
          onDeleteCxrRecord={onDeleteCxrRecord}
          currentUserProfile={currentUserProfile}
        />
      )}

      {isResignOpen && selectedWorkerForResign && (
        <HcwResignModal
          isOpen={isResignOpen}
          worker={selectedWorkerForResign}
          onClose={() => {
            setIsResignOpen(false);
            setSelectedWorkerForResign(null);
          }}
          onConfirmResign={(workerId, status, resignationDate, resignationReason, resignationNotes) => {
            onResignWorker(workerId, status, resignationDate, resignationReason, resignationNotes);
            setIsResignOpen(false);
            setSelectedWorkerForResign(null);
          }}
          onReactivate={(workerId) => {
            if (onReactivateWorker) onReactivateWorker(workerId);
            setIsResignOpen(false);
            setSelectedWorkerForResign(null);
          }}
        />
      )}

    </div>
  );
};
