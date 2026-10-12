import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Building, 
  Stethoscope, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { HealthcareWorker, HcwCxrRecord, UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveWorker: (worker: HealthcareWorker) => void;
  editingWorker?: HealthcareWorker | null;
  currentUserProfile?: UserProfile | null;
}

const DEPARTMENTS = [
  'แผนกอายุรกรรม (Medicine)',
  'ห้องอุบัติเหตุและฉุกเฉิน (ER)',
  'หอผู้ป่วยวิกฤต (ICU)',
  'คลินิกวัณโรค/โรคระบบทางเดินหายใจ (TB Clinic)',
  'แผนกผู้ป่วยนอก (OPD)',
  'กลุ่มงานเวชกรรมสังคม / บริการปฐมภูมิ',
  'ห้องชันสูตรทางการแพทย์ (Laboratory)',
  'กลุ่มงานรังสีวิทยา (X-Ray)',
  'กลุ่มงานทันตกรรม (Dental)',
  'กลุ่มงานเภสัชกรรม (Pharmacy)',
  'หอผู้ป่วยศัลยกรรม (Surgery)',
  'หอผู้ป่วยกุมารเวชกรรม (Pediatrics)',
  'กลุ่มงานสนับสนุนและธุรการ',
  'อื่นๆ'
];

const POSITIONS = [
  'พยาบาลวิชาชีพ',
  'แพทย์ / แพทย์ผู้เชี่ยวชาญ',
  'ผู้ช่วยพยาบาล (PN)',
  'พนักงานช่วยเหลือคนไข้ (NA)',
  'นักเทคนิคการแพทย์',
  'นักรังสีการแพทย์ / เจ้าพนักงานรังสี',
  'เภสัชกร / เจ้าพนักงานเภสัชกรรม',
  'ทันตแพทย์ / เจ้าพนักงานทันตสาธารณสุข',
  'นักวิชาการสาธารณสุข',
  'พนักงานขับรถพยาบาล / กู้ชีพ',
  'เจ้าหน้าที่ธุรการ / เวชระเบียน',
  'พนักงานรักษาความปลอดภัย / ทำความสะอาด',
  'อื่นๆ'
];

export const HcwModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveWorker,
  editingWorker,
  currentUserProfile
}) => {
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [hn, setHn] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [age, setAge] = useState<number>(30);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [position, setPosition] = useState(POSITIONS[0]);
  const [employmentType, setEmploymentType] = useState<HealthcareWorker['employmentType']>('permanent');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [workLocation, setWorkLocation] = useState('');

  // Risk & Clinical Profile
  const [riskLevel, setRiskLevel] = useState<HealthcareWorker['riskLevel']>('medium');
  const [exposureHistory, setExposureHistory] = useState(false);
  const [exposureDetails, setExposureDetails] = useState('');
  const [pastTbHistory, setPastTbHistory] = useState(false);

  // Symptoms
  const [symptoms, setSymptoms] = useState({
    chronicCough: false,
    coughDurationWeeks: 0,
    coughBlood: false,
    fever: false,
    nightSweats: false,
    weightLoss: false,
    chestPain: false,
    fatigue: false
  });

  // Comorbidities
  const [diabetes, setDiabetes] = useState(false);
  const [smoking, setSmoking] = useState(false);
  const [immunosuppressed, setImmunosuppressed] = useState(false);

  // Latent TB (TST / IGRA)
  const [latentTbTestType, setLatentTbTestType] = useState<HealthcareWorker['latentTbTestType']>('none');
  const [latentTbTestResult, setLatentTbTestResult] = useState<HealthcareWorker['latentTbTestResult']>('negative');
  const [latentTbTestDate, setLatentTbTestDate] = useState('');

  // TPT
  const [tptStatus, setTptStatus] = useState<HealthcareWorker['tptStatus']>('not_indicated');
  const [tptRegimen, setTptRegimen] = useState<HealthcareWorker['tptRegimen']>('3HP');

  // Baseline CXR on Registration (for new staff)
  const [hasBaselineCxr, setHasBaselineCxr] = useState(true);
  const [baselineCxrDate, setBaselineCxrDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [baselineCxrResult, setBaselineCxrResult] = useState<HcwCxrRecord['result']>('normal');
  const [baselineCxrDetail, setBaselineCxrDetail] = useState('No active pulmonary infiltration. Both lungs clear.');
  const [baselineCxrReason, setBaselineCxrReason] = useState<HcwCxrRecord['reason']>('annual');
  const [baselineCxrHospital, setBaselineCxrHospital] = useState('รพ.มหาวิทยาลัยอุบลราชธานี');

  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingWorker) {
      setFullName(editingWorker.fullName);
      setStaffId(editingWorker.staffId || '');
      setHn(editingWorker.hn || '');
      setGender(editingWorker.gender);
      setAge(editingWorker.age);
      setPhone(editingWorker.phone);
      setEmail(editingWorker.email || '');
      setDepartment(editingWorker.department);
      setPosition(editingWorker.position);
      setEmploymentType(editingWorker.employmentType);
      setStartDate(editingWorker.startDate || '');
      setWorkLocation(editingWorker.workLocation || '');
      setRiskLevel(editingWorker.riskLevel);
      setExposureHistory(editingWorker.exposureHistory);
      setExposureDetails(editingWorker.exposureDetails || '');
      setPastTbHistory(editingWorker.pastTbHistory);
      setSymptoms({
        chronicCough: editingWorker.symptoms?.chronicCough || false,
        coughDurationWeeks: editingWorker.symptoms?.coughDurationWeeks || 0,
        coughBlood: editingWorker.symptoms?.coughBlood || false,
        fever: editingWorker.symptoms?.fever || false,
        nightSweats: editingWorker.symptoms?.nightSweats || false,
        weightLoss: editingWorker.symptoms?.weightLoss || false,
        chestPain: editingWorker.symptoms?.chestPain || false,
        fatigue: editingWorker.symptoms?.fatigue || false
      });
      setDiabetes(editingWorker.comorbidities?.diabetes || false);
      setSmoking(editingWorker.comorbidities?.smoking || false);
      setImmunosuppressed(editingWorker.comorbidities?.immunosuppressed || false);
      setLatentTbTestType(editingWorker.latentTbTestType || 'none');
      setLatentTbTestResult(editingWorker.latentTbTestResult || 'negative');
      setLatentTbTestDate(editingWorker.latentTbTestDate || '');
      setTptStatus(editingWorker.tptStatus || 'not_indicated');
      setTptRegimen(editingWorker.tptRegimen || '3HP');
      setNotes(editingWorker.notes || '');
      setHasBaselineCxr(false);
    } else {
      // Reset for new
      setFullName('');
      setStaffId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
      setHn('');
      setGender('female');
      setAge(32);
      setPhone('');
      setEmail('');
      setDepartment(DEPARTMENTS[0]);
      setPosition(POSITIONS[0]);
      setEmploymentType('permanent');
      setStartDate(new Date().toISOString().split('T')[0]);
      setWorkLocation('');
      setRiskLevel('medium');
      setExposureHistory(false);
      setExposureDetails('');
      setPastTbHistory(false);
      setSymptoms({
        chronicCough: false,
        coughDurationWeeks: 0,
        coughBlood: false,
        fever: false,
        nightSweats: false,
        weightLoss: false,
        chestPain: false,
        fatigue: false
      });
      setDiabetes(false);
      setSmoking(false);
      setImmunosuppressed(false);
      setLatentTbTestType('none');
      setLatentTbTestResult('negative');
      setLatentTbTestDate('');
      setTptStatus('not_indicated');
      setTptRegimen('3HP');
      setNotes('');
      setHasBaselineCxr(true);
      setBaselineCxrDate(new Date().toISOString().split('T')[0]);
      setBaselineCxrResult('normal');
      setBaselineCxrDetail('No active pulmonary infiltration. Both lungs clear.');
      setBaselineCxrReason('annual');
    }
  }, [editingWorker, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('กรุณากรอกชื่อ-สกุลบุคลากร');
      return;
    }

    const workerId = editingWorker ? editingWorker.id : `HCW-${Date.now().toString().slice(-6)}`;
    
    let cxrRecords: HcwCxrRecord[] = editingWorker?.cxrRecords ? [...editingWorker.cxrRecords] : [];
    
    // If new worker and baseline CXR checked, add initial CXR record
    if (!editingWorker && hasBaselineCxr) {
      const nextDue = new Date(baselineCxrDate || new Date());
      nextDue.setFullYear(nextDue.getFullYear() + 1);

      cxrRecords.push({
        id: `CXR-${Date.now()}`,
        date: baselineCxrDate,
        roundNumber: 1,
        reason: baselineCxrReason,
        result: baselineCxrResult,
        resultDetail: baselineCxrDetail.trim() || (baselineCxrResult === 'normal' ? 'ปกติ' : 'ผิดปกติ'),
        hospital: baselineCxrHospital.trim() || 'รพ.มหาวิทยาลัยอุบลราชธานี',
        radiologistOrDoctor: currentUserProfile?.displayName || 'รังสีแพทย์',
        actionTaken: baselineCxrResult === 'normal' ? 'นัดตรวจประจำปีถัดไป' : 'ส่งตรวจเสมหะและปรึกษาแพทย์ TB',
        nextScheduledDate: nextDue.toISOString().split('T')[0],
        recordedBy: currentUserProfile?.displayName || 'เจ้าหน้าที่',
        createdAt: new Date().toISOString()
      });
    }

    const newWorker: HealthcareWorker = {
      id: workerId,
      staffId: staffId.trim() || undefined,
      hn: hn.trim() || undefined,
      fullName: fullName.trim(),
      gender,
      age: Number(age) || 30,
      phone: phone.trim(),
      email: email.trim() || undefined,
      department: department.trim(),
      position: position.trim(),
      employmentType,
      startDate: startDate || undefined,
      workLocation: workLocation.trim() || undefined,
      status: editingWorker ? editingWorker.status : 'active',
      resignationDate: editingWorker?.resignationDate,
      resignationReason: editingWorker?.resignationReason,
      resignationNotes: editingWorker?.resignationNotes,
      riskLevel,
      exposureHistory,
      exposureDetails: exposureHistory ? exposureDetails.trim() : undefined,
      pastTbHistory,
      symptoms,
      comorbidities: {
        diabetes,
        smoking,
        hiv: 'not_tested',
        immunosuppressed
      },
      latentTbTestType,
      latentTbTestResult: latentTbTestType !== 'none' ? latentTbTestResult : undefined,
      latentTbTestDate: latentTbTestType !== 'none' ? latentTbTestDate : undefined,
      tptStatus,
      tptRegimen: tptStatus === 'on_tpt' || tptStatus === 'completed' ? tptRegimen : undefined,
      cxrRecords,
      notes: notes.trim() || undefined,
      lastUpdatedBy: currentUserProfile?.displayName || 'เจ้าหน้าที่',
      updatedAt: new Date().toISOString(),
      createdAt: editingWorker?.createdAt || new Date().toISOString()
    };

    onSaveWorker(newWorker);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
              <Stethoscope className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {editingWorker ? 'แก้ไขข้อมูลบุคลากรทางการแพทย์' : 'ลงทะเบียนบุคลากรทางการแพทย์ (HCW TB Screening)'}
              </h2>
              <p className="text-xs text-teal-100 font-light">
                ระบบคัดกรองและเฝ้าระวังวัณโรคในบุคลากรโรงพยาบาล
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {/* Section 1: ข้อมูลทั่วไป & ตำแหน่งงาน */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <User className="w-4 h-4 text-teal-700" />
              <span>ข้อมูลทั่วไปและการปฏิบัติงาน</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น พว.สมหญิง วงศ์แพทย์"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสบุคลากร / เจ้าหน้าที่
                </label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="เช่น EMP-1042"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  HN (เวชระเบียน รพ.)
                </label>
                <input
                  type="text"
                  value={hn}
                  onChange={(e) => setHn(e.target.value)}
                  placeholder="HN ผู้ป่วย/จนท."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เพศ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value="female">หญิง</option>
                  <option value="male">ชาย</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อายุ (ปี) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={18}
                  max={90}
                  required
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  แผนก / ฝ่าย / งาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="dept-options"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <datalist id="dept-options">
                  {DEPARTMENTS.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตำแหน่ง / วิชาชีพ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="position-options"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <datalist id="position-options">
                  {POSITIONS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประเภทการจ้างงาน
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value="permanent">ข้าราชการ / พนักงานประจำ</option>
                  <option value="contract">พนักงานตามสัญญาจ้าง</option>
                  <option value="temporary">ลูกจ้างชั่วคราว / รายวัน</option>
                  <option value="resident">แพทย์ประจำบ้าน / อินเทิร์น</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่เริ่มปฏิบัติงานใน รพ.
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อาคาร / สถานที่ทำงาน
                </label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="เช่น อาคารเฉลิมพระเกียรติ ชั้น 3"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: การประเมินความเสี่ยงและอาการ (เหมือนกลุ่มเสี่ยง) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>การประเมินความเสี่ยงและประวัติทางคลินิก (Risk & Clinical Profile)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ระดับความเสี่ยงในสถานที่ทำงาน
                </label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value="high">เสี่ยงสูง (High Risk - เช่น ER, ICU, วอร์ด TB, ส่องกล้อง)</option>
                  <option value="medium">เสี่ยงปานกลาง (Medium Risk - OPD, วอร์ดทั่วไป, Lab)</option>
                  <option value="low">เสี่ยงต่ำ (Low Risk - สนับสนุน, ธุรการ, บริหาร)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ประวัติสัมผัสผู้ป่วยวัณโรคในงาน
                </label>
                <div className="flex items-center gap-3 mt-1.5">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exposureHistory}
                      onChange={(e) => setExposureHistory(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>มีประวัติสัมผัสผู้ป่วยวัณโรคในงาน (Workplace TB Exposure)</span>
                  </label>
                </div>
                {exposureHistory && (
                  <input
                    type="text"
                    value={exposureDetails}
                    onChange={(e) => setExposureDetails(e.target.value)}
                    placeholder="ระบุวอร์ด หรือวันที่สัมผัส เช่น หอผู้ป่วยอายุรกรรม 2..."
                    className="w-full mt-2 px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                )}
              </div>
            </div>

            {/* อาการสงสัยวัณโรค */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                คัดกรองอาการสงสัยวัณโรค (TB Symptoms Screening):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms.chronicCough}
                    onChange={(e) => setSymptoms({ ...symptoms, chronicCough: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>ไอเรื้อรัง &ge; 2 สัปดาห์</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms.coughBlood}
                    onChange={(e) => setSymptoms({ ...symptoms, coughBlood: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>ไอเป็นเลือด</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms.fever}
                    onChange={(e) => setSymptoms({ ...symptoms, fever: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>มีไข้ต่ำๆ</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms.nightSweats}
                    onChange={(e) => setSymptoms({ ...symptoms, nightSweats: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>เหงื่อออกตอนกลางคืน</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms.weightLoss}
                    onChange={(e) => setSymptoms({ ...symptoms, weightLoss: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>น้ำหนักลดไม่ทราบสาเหตุ</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={symptoms.chestPain}
                    onChange={(e) => setSymptoms({ ...symptoms, chestPain: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>เจ็บหน้าอก / เหนื่อยง่าย</span>
                </label>
              </div>
            </div>

            {/* Latent TB & TPT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  การตรวจการติดเชื้อแฝง (TST / IGRA)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={latentTbTestType}
                    onChange={(e) => setLatentTbTestType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  >
                    <option value="none">ไม่ได้ตรวจ</option>
                    <option value="igra">IGRA (QuantiFERON)</option>
                    <option value="tst">TST (Mantoux)</option>
                  </select>

                  {latentTbTestType !== 'none' && (
                    <select
                      value={latentTbTestResult}
                      onChange={(e) => setLatentTbTestResult(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                    >
                      <option value="negative">Negative (ปกติ)</option>
                      <option value="positive">Positive (ติดเชื้อแฝง)</option>
                      <option value="indeterminate">Indeterminate</option>
                      <option value="pending">รอผล</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  การให้ยาป้องกันวัณโรค (TPT)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={tptStatus}
                    onChange={(e) => setTptStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  >
                    <option value="not_indicated">ไม่มีข้อบ่งชี้</option>
                    <option value="on_tpt">กำลังรับยา TPT</option>
                    <option value="completed">รับยา TPT ครบแล้ว</option>
                    <option value="refused">ปฏิเสธยาป้องกัน</option>
                  </select>

                  {(tptStatus === 'on_tpt' || tptStatus === 'completed') && (
                    <select
                      value={tptRegimen}
                      onChange={(e) => setTptRegimen(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                    >
                      <option value="3HP">สูตร 3HP (12 dose)</option>
                      <option value="1HP">สูตร 1HP (30 วัน)</option>
                      <option value="6H">สูตร 6H (6 เดือน)</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Baseline CXR on Registration (เฉพาะกรณีลงทะเบียนใหม่) */}
          {!editingWorker && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-800" />
                  <span className="text-xs font-bold text-teal-900">
                    บันทึกผลเอกซเรย์ปอด (CXR) เริ่มต้นทันที
                  </span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs text-teal-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBaselineCxr}
                    onChange={(e) => setHasBaselineCxr(e.target.checked)}
                    className="rounded border-teal-300 text-teal-700 focus:ring-teal-500"
                  />
                  <span>บันทึกผล CXR รอบแรกทันที</span>
                </label>
              </div>

              {hasBaselineCxr && (
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">วันที่ตรวจ CXR</label>
                      <input
                        type="date"
                        value={baselineCxrDate}
                        onChange={(e) => setBaselineCxrDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">วัตถุประสงค์</label>
                      <select
                        value={baselineCxrReason}
                        onChange={(e) => setBaselineCxrReason(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="annual">ตรวจคัดกรองประจำปี</option>
                        <option value="pre_employment">ตรวจสุขภาพแรกเข้าทำงาน</option>
                        <option value="contact_investigation">สัมผัสผู้ป่วย TB ในงาน</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">ผลการตรวจ CXR</label>
                      <select
                        value={baselineCxrResult}
                        onChange={(e) => setBaselineCxrResult(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="normal">ปกติ (Normal)</option>
                        <option value="abnormal_suspect_tb">ผิดปกติ-สงสัยวัณโรค</option>
                        <option value="abnormal_calcification_old">รอยโรคเก่าคงที่</option>
                        <option value="abnormal_other">ผิดปกติอื่นๆ</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">รายละเอียดผลอ่านฟิล์ม</label>
                    <input
                      type="text"
                      value={baselineCxrDetail}
                      onChange={(e) => setBaselineCxrDetail(e.target.value)}
                      placeholder="เช่น No active pulmonary infiltration..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุเพิ่มเติม
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุข้อมูลเพิ่มเติม..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{editingWorker ? 'บันทึกการแก้ไข' : 'บันทึกลงทะเบียนบุคลากร'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
