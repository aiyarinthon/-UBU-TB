import React from 'react';
import { 
  X, 
  Activity, 
  Calendar, 
  Building, 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  UserMinus, 
  Edit3, 
  Printer, 
  Trash2, 
  RotateCcw,
  TrendingUp,
  FileText,
  BadgeAlert,
  ArrowRight
} from 'lucide-react';
import { HealthcareWorker, HcwCxrRecord, UserProfile } from '../types';
import { formatThaiDate } from '../lib/dateUtils';

interface Props {
  worker: HealthcareWorker;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddCxr: (worker: HealthcareWorker) => void;
  onOpenResign: (worker: HealthcareWorker) => void;
  onOpenEdit: (worker: HealthcareWorker) => void;
  onDeleteCxrRecord?: (workerId: string, cxrId: string) => void;
  currentUserProfile?: UserProfile | null;
}

export const HcwDetailModal: React.FC<Props> = ({
  worker,
  isOpen,
  onClose,
  onOpenAddCxr,
  onOpenResign,
  onOpenEdit,
  onDeleteCxrRecord,
  currentUserProfile
}) => {
  if (!isOpen) return null;

  // Sort CXR records descending (latest first)
  const sortedRecords = [...(worker.cxrRecords || [])].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const totalCxrCount = sortedRecords.length;
  const latestCxr = sortedRecords[0];

  // Calculate Individual Trend (สถิติแนวโน้มรายบุคคล)
  const abnormalRecords = sortedRecords.filter(r => r.result === 'abnormal_suspect_tb');
  const oldCalcRecords = sortedRecords.filter(r => r.result === 'abnormal_calcification_old');
  const normalRecords = sortedRecords.filter(r => r.result === 'normal');

  let trendStatus: {
    label: string;
    description: string;
    badgeClass: string;
    icon: typeof CheckCircle;
  };

  if (totalCxrCount === 0) {
    trendStatus = {
      label: 'ยังไม่มีประวัติการตรวจ CXR',
      description: 'ยังไม่ได้บันทึกผลเอกซเรย์ปอดในระบบ แนะนำบันทึกผลแรกเข้าหรือประจำปี',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Clock
    };
  } else if (latestCxr.result === 'abnormal_suspect_tb') {
    trendStatus = {
      label: '⚠️ พบความผิดปกติใหม่ (Suspect Active TB)',
      description: 'ผลเอกซเรย์ครั้งล่าสุดพบรอยโรคสงสัยวัณโรค ต้องส่งตรวจเสมหะและติดตามเร่งด่วน',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: AlertTriangle
    };
  } else if (latestCxr.result === 'abnormal_calcification_old') {
    trendStatus = {
      label: 'รอยโรคเก่าคงที่ (Stable Inactive Lesion)',
      description: 'พบรอยโรคเดิม/หินปูนคงที่ ไม่มีการลุกลาม แนะนำเปรียบเทียบฟิล์มสม่ำเสมอ',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Clock
    };
  } else if (normalRecords.length === totalCxrCount) {
    trendStatus = {
      label: '🟢 ผลปกติสม่ำเสมอทุกรอบ (Consistently Normal)',
      description: `ตรวจเอกซเรย์ปอดแล้ว ${totalCxrCount} ครั้ง ผลอยู่ในเกณฑ์ปกติทุกครั้งต่อเนื่อง`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: CheckCircle
    };
  } else {
    trendStatus = {
      label: 'ผลตรวจปกติในรอบล่าสุด (Current Normal)',
      description: 'ผลตรวจครั้งล่าสุดปกติ ให้ตรวจติดตามสุขภาพตามรอบนัดประจำปี',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
      icon: CheckCircle
    };
  }

  // Symptoms check
  const symptoms = worker.symptoms || {
    chronicCough: false,
    coughBlood: false,
    fever: false,
    nightSweats: false,
    weightLoss: false,
    chestPain: false,
    fatigue: false
  };
  const activeSymptoms = Object.entries(symptoms)
    .filter(([k, v]) => v === true)
    .map(([k]) => {
      switch (k) {
        case 'chronicCough': return 'ไอเรื้อรัง';
        case 'coughBlood': return 'ไอเป็นเลือด';
        case 'fever': return 'มีไข้';
        case 'nightSweats': return 'เหงื่อออกตอนกลางคืน';
        case 'weightLoss': return 'น้ำหนักลด';
        case 'chestPain': return 'เจ็บหน้าอก';
        case 'fatigue': return 'อ่อนเพลียเรื้อรัง';
        default: return k;
      }
    });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-teal-200 text-lg font-black border border-white/20 shrink-0">
              {worker.fullName.substring(0, 2)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">{worker.fullName}</h2>
                
                {/* Status Badge */}
                {worker.status === 'active' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    กำลังปฏิบัติงาน (Active)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1">
                    <UserMinus className="w-3 h-3" />
                    <span>ลาออก/พ้นสภาพ ({worker.resignationReason || 'พ้นสภาพ'})</span>
                  </span>
                )}

                {/* Risk Level Badge */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  worker.riskLevel === 'high' 
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50' 
                    : worker.riskLevel === 'medium'
                    ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                    : 'bg-teal-500/30 text-teal-200 border border-teal-400/50'
                }`}>
                  เสี่ยง{worker.riskLevel === 'high' ? 'สูง' : worker.riskLevel === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-teal-100/90 mt-1.5">
                <span>ตำแหน่ง: <strong>{worker.position}</strong></span>
                <span>•</span>
                <span>แผนก: <strong>{worker.department}</strong></span>
                {worker.staffId && (
                  <>
                    <span>•</span>
                    <span>รหัสบุคลากร: <strong className="font-mono">{worker.staffId}</strong></span>
                  </>
                )}
                {worker.hn && (
                  <>
                    <span>•</span>
                    <span>HN: <strong className="font-mono">{worker.hn}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              title="พิมพ์ประวัติสุขภาพ"
              className="p-2 rounded-xl text-teal-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-teal-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddCxr(worker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มผลตรวจ CXR</span>
            </button>

            <button
              onClick={() => onOpenEdit(worker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไขประวัติ</span>
            </button>
          </div>

          <div>
            {worker.status === 'active' ? (
              <button
                onClick={() => onOpenResign(worker)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl transition cursor-pointer"
              >
                <UserMinus className="w-3.5 h-3.5" />
                <span>บันทึกการลาออก (เข้าฐานข้อมูล)</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenResign(worker)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-xl transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>แก้ไขสถานะลาออก / คืนสถานะ</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Individual Trend Analytics Banner (สถิติแนวโน้มรายบุคคล) */}
          <div className="bg-gradient-to-br from-teal-50/80 via-emerald-50/50 to-white border border-teal-200 rounded-3xl p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">สถิติและแนวโน้มการตรวจเอกซเรย์ปอดรายบุคคล</h3>
                  <p className="text-[11px] text-slate-500">Individual Longitudinal Screening Trend & Surveillance</p>
                </div>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${trendStatus.badgeClass}`}>
                <trendStatus.icon className="w-4 h-4" />
                <span>{trendStatus.label}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 mb-4 bg-white/70 p-3 rounded-2xl border border-teal-100">
              {trendStatus.description}
            </p>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium block">ตรวจแล้วทั้งหมด</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {totalCxrCount} <span className="text-xs font-normal text-slate-500">ครั้ง</span>
                </div>
                <span className="text-[10px] text-teal-700 font-medium block mt-0.5">
                  ปกติ {normalRecords.length} • ผิดปกติ {abnormalRecords.length + oldCalcRecords.length}
                </span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium block">ตรวจครั้งล่าสุด</span>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {latestCxr ? formatThaiDate(latestCxr.date) : 'ยังไม่เคยตรวจ'}
                </div>
                {latestCxr && (
                  <span className={`text-[10px] font-semibold block mt-0.5 ${
                    latestCxr.result === 'normal' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {latestCxr.result === 'normal' ? 'ผลปกติ' : latestCxr.resultDetail}
                  </span>
                )}
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium block">นัดตรวจรอบถัดไป</span>
                <div className="text-sm font-bold text-teal-800 mt-1">
                  {latestCxr?.nextScheduledDate ? formatThaiDate(latestCxr.nextScheduledDate) : 'ยังไม่กำหนดวัน'}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">รอบคัดกรองประจำปี</span>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 font-medium block">สถานะในฐานข้อมูล</span>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {worker.status === 'active' ? 'ปฏิบัติงานอยู่' : 'ลาออกแล้ว'}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {worker.status !== 'active' && worker.resignationDate ? `วันที่ ${formatThaiDate(worker.resignationDate)}` : `เริ่ม ${worker.startDate ? formatThaiDate(worker.startDate) : '-'}`}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Profile & Risk Data (เหมือนกลุ่มเสี่ยง) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: อาการ & ความเสี่ยง */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>การประเมินความเสี่ยงและอาการสงสัย</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">ประวัติสัมผัสผู้ป่วย TB ในงาน:</span>
                  <span className="font-semibold text-slate-900">
                    {worker.exposureHistory ? `เคยสัมผัส (${worker.exposureDetails || 'ในหอผู้ป่วย'})` : 'ไม่มีประวัติสัมผัสชัดเจน'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">ประวัติเคยป่วยเป็นวัณโรค:</span>
                  <span className="font-semibold text-slate-900">{worker.pastTbHistory ? 'เคยป่วยเป็นวัณโรคมาก่อน' : 'ไม่เคย'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">อาการสงสัยวัณโรค:</span>
                  <span className="font-semibold">
                    {activeSymptoms.length > 0 ? (
                      <span className="text-rose-700 font-bold">{activeSymptoms.join(', ')}</span>
                    ) : (
                      <span className="text-emerald-700">ไม่มีอาการสงสัย (Asymptomatic)</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">การตรวจ IGRA / TST (การติดเชื้อแฝง):</span>
                  <span className="font-semibold text-slate-900">
                    {worker.latentTbTestType === 'igra' ? `IGRA: ${worker.latentTbTestResult || '-'}` : worker.latentTbTestType === 'tst' ? `TST: ${worker.latentTbTestResult || '-'}` : 'ไม่ได้ส่งตรวจ'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">การรับยาป้องกันวัณโรค (TPT):</span>
                  <span className="font-semibold text-slate-900">
                    {worker.tptStatus === 'on_tpt' ? `กำลังรับยา TPT (${worker.tptRegimen || '3HP'})` : worker.tptStatus === 'completed' ? 'ทานยา TPT ครบถ้วนแล้ว' : 'ไม่ได้รับยาป้องกัน'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: ข้อมูลการติดต่อ & ตำแหน่งงาน */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-700" />
                <span>ข้อมูลการปฏิบัติงานและการติดต่อ</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">อายุ / เพศ:</span>
                  <span className="font-semibold text-slate-900">{worker.age} ปี • {worker.gender === 'male' ? 'ชาย' : worker.gender === 'female' ? 'หญิง' : 'อื่นๆ'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                  <span className="font-semibold text-slate-900 font-mono">{worker.phone || '-'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">อีเมล:</span>
                  <span className="font-semibold text-slate-900">{worker.email || '-'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">ประเภทการจ้างงาน:</span>
                  <span className="font-semibold text-slate-900">
                    {worker.employmentType === 'permanent' ? 'ข้าราชการ/พนักงานประจำ' : worker.employmentType === 'contract' ? 'พนักงานตามสัญญาจ้าง' : worker.employmentType === 'resident' ? 'แพทย์ประจำบ้าน' : 'ลูกจ้าง/อื่นๆ'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">สถานที่ปฏิบัติงาน / อาคาร:</span>
                  <span className="font-semibold text-slate-900">{worker.workLocation || worker.department}</span>
                </div>
              </div>
            </div>

          </div>

          {/* CXR Repeated Screening Timeline ("ปุ่มเพิ่มการเอเรย์ได้เรื่อยๆ และเก็บสถิติแนวโน้ม") */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-700" />
                <h4 className="text-sm font-bold text-slate-900">
                  ประวัติการตรวจเอกซเรย์ปอด (CXR Timeline)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  ทั้งหมด {totalCxrCount} ครั้ง
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenAddCxr(worker)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มผลตรวจเอกซเรย์รอบใหม่</span>
              </button>
            </div>

            {sortedRecords.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
                <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">ยังไม่มีประวัติการตรวจเอกซเรย์ปอด</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  ระบบรองรับการบันทึกผลเอกซเรย์ได้เรื่อยๆ ไม่จำกัดจำนวนครั้ง เพื่อติดตามแนวโน้มสุขภาพปอดของบุคลากรรายบุคคล
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAddCxr(worker)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกผลตรวจเอกซเรย์ครั้งแรก</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedRecords.map((record, index) => {
                  const isLatest = index === 0;
                  const roundNum = totalCxrCount - index;

                  let reasonLabel = 'ตรวจสุขภาพประจำปี';
                  if (record.reason === 'pre_employment') reasonLabel = 'ตรวจแรกเข้าทำงาน';
                  else if (record.reason === 'contact_investigation') reasonLabel = 'สัมผัสผู้ป่วย TB ในงาน';
                  else if (record.reason === 'symptomatic') reasonLabel = 'มีอาการสงสัย';
                  else if (record.reason === 'followup') reasonLabel = 'ตรวจติดตามผลรอยโรคเดิม';

                  return (
                    <div
                      key={record.id || index}
                      className={`p-4 rounded-2xl border transition ${
                        isLatest
                          ? record.result === 'normal'
                            ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                            isLatest ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            ครั้งที่ {roundNum}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {formatThaiDate(record.date)}
                          </span>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs text-slate-600 font-medium">
                            {reasonLabel}
                          </span>
                          {isLatest && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                              ผลตรวจล่าสุด
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            record.result === 'normal'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : record.result === 'abnormal_suspect_tb'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : record.result === 'abnormal_calcification_old'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {record.result === 'normal'
                              ? 'ปกติ (Normal)'
                              : record.result === 'abnormal_suspect_tb'
                              ? 'สงสัยวัณโรค (Suspect TB)'
                              : record.result === 'abnormal_calcification_old'
                              ? 'รอยโรคเก่าคงที่'
                              : record.result === 'pending'
                              ? 'รอผลตรวจ'
                              : 'ผิดปกติอื่นๆ'}
                          </span>

                          {onDeleteCxrRecord && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('ต้องการลบประวัติการตรวจเอกซเรย์ครั้งนี้ใช่หรือไม่?')) {
                                  onDeleteCxrRecord(worker.id, record.id);
                                }
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                              title="ลบผลตรวจครั้งนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reading Details */}
                      <div className="mt-2.5 bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 text-xs">
                        <div className="text-slate-800 font-semibold mb-1">
                          ผลการอ่านฟิล์ม: <span className="font-normal text-slate-700">{record.resultDetail}</span>
                        </div>
                        {record.actionTaken && (
                          <div className="text-teal-900 font-semibold mt-1">
                            แผนการดูแล: <span className="font-normal text-teal-800">{record.actionTaken}</span>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                          <span>สถานพยาบาล: {record.hospital || 'รพ.มหาวิทยาลัยอุบลราชธานี'}</span>
                          {record.radiologistOrDoctor && <span>แพทย์ผู้อ่าน: {record.radiologistOrDoctor}</span>}
                          {record.nextScheduledDate && (
                            <span className="font-medium text-teal-700">
                              นัดตรวจรอบถัดไป: {formatThaiDate(record.nextScheduledDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resignation / Archive Notes (if resigned) */}
          {worker.status !== 'active' && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-xs">
              <div className="flex items-center gap-2 text-rose-900 font-bold mb-1">
                <UserMinus className="w-4 h-4 text-rose-700" />
                <span>บันทึกการพ้นสภาพ / ลาออก (Historical Archive)</span>
              </div>
              <div className="text-rose-800 space-y-1 mt-2">
                <p>วันที่ลาออก / มีผล: <strong>{worker.resignationDate ? formatThaiDate(worker.resignationDate) : '-'}</strong></p>
                <p>เหตุผล: <strong>{worker.resignationReason || '-'}</strong></p>
                {worker.resignationNotes && <p>หมายเหตุเพิ่มเติม: {worker.resignationNotes}</p>}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
