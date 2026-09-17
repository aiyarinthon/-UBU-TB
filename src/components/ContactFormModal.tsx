import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  AlertCircle, 
  User, 
  Phone, 
  Mail, 
  Home, 
  Users, 
  HeartHandshake, 
  CheckCircle, 
  FileKey, 
  Activity, 
  ShieldAlert,
  HelpCircle,
  Stethoscope,
  Calendar,
  FileText,
  Building2,
  Clock,
  Sparkles,
  ClipboardList,
  Check
} from 'lucide-react';
import { ContactPerson, Patient, UserProfile } from '../types';
import { ContactCriteriaModal } from './ContactCriteriaModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: ContactPerson) => Promise<void>;
  patients: Patient[];
  initialData?: ContactPerson | null;
  defaultPatient?: Patient | null;
  defaultContactType?: 'household' | 'non_household';
  currentUserProfile?: UserProfile | null;
  currentUserName?: string;
}

export const ContactFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  patients,
  initialData,
  defaultPatient,
  defaultContactType,
  currentUserProfile,
  currentUserName,
}) => {
  const isEditing = !!initialData;
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const actorName = currentUserProfile?.displayName || currentUserName || currentUserProfile?.email || 'เจ้าหน้าที่ (ระบบ)';

  // Initialize form state
  const [formData, setFormData] = useState<Partial<ContactPerson>>(() => {
    if (initialData) return { ...initialData };

    const selectedPatient = defaultPatient || patients[0];
    const contactType = defaultContactType || 'household';

    return {
      id: `CT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      indexPatientId: selectedPatient?.id || '',
      indexPatientHN: selectedPatient?.hn || '',
      indexPatientName: selectedPatient?.fullName || '',
      contactType: contactType,
      relationship: contactType === 'household' ? 'คู่สมรส' : 'เพื่อนร่วมงาน',
      hn: '',
      fullName: '',
      gender: 'female',
      age: 28,
      treatmentRights: 'บัตรทอง (UC)',
      phone: '',
      email: '',
      protocolType: 'cxr_4_times',
      ntipStatus: 'not_entered',
      ntipKeyCode: '',
      ntipKeyDate: '',
      ntipNotes: '',
      cxrStatus: 'pending',
      cxrRound: 'cxr_1_0m',
      cxrDate: '',
      cxrResult: 'pending',
      cxrResultDetail: '',
      cxrHospital: 'รพ.มหาวิทยาลัยอุบลราชธานี',
      nextCxrDate: '',
      igraResult: 'pending',
      igraDate: '',
      tptRegimen: 'none',
      tptStatus: 'not_started',
      screeningStatus: 'pending_screening',
      notes: '',
    };
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        ntipNotes: initialData.ntipNotes || '',
        cxrStatus: initialData.cxrStatus || (initialData.screeningStatus === 'screened_normal' ? 'done' : 'pending'),
        cxrRound: initialData.cxrRound || 'cxr_1_0m',
        cxrResult: initialData.cxrResult || (initialData.screeningStatus === 'screened_normal' ? 'normal' : 'pending'),
        cxrHospital: initialData.cxrHospital || 'รพ.มหาวิทยาลัยอุบลราชธานี',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Derive age protocol
  const age = Number(formData.age) || 0;
  const isOver5 = age > 5;
  const calculatedProtocol: 'cxr_4_times' | 'igra_tpt' = isOver5 ? 'cxr_4_times' : 'igra_tpt';

  const handlePatientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    const p = patients.find(item => item.id === pId);
    if (p) {
      setFormData(prev => ({
        ...prev,
        indexPatientId: p.id,
        indexPatientHN: p.hn,
        indexPatientName: p.fullName,
      }));
    }
  };

  const handleAutoNextCxrDate = () => {
    const baseDateStr = formData.cxrDate || new Date().toISOString().split('T')[0];
    const d = new Date(baseDateStr);
    if (!isNaN(d.getTime())) {
      d.setMonth(d.getMonth() + 6);
      const nextStr = d.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, nextCxrDate: nextStr }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.hn) {
      setErrorMsg('กรุณาระบุ HN และชื่อ-นามสกุลของผู้สัมผัสให้ครบถ้วน');
      return;
    }

    if (!formData.indexPatientId) {
      setErrorMsg('กรุณาเลือกผู้ป่วยดัชนี (Index Case) ที่สัมผัสโรค');
      return;
    }

    if (formData.ntipStatus === 'entered' && !formData.ntipKeyCode) {
      setErrorMsg('กรณีเลือกสถานะคีย์ n-tip แล้ว กรุณาระบุรหัสที่คีย์ใน n-tip');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const derivedScreeningStatus = 
        formData.cxrResult === 'abnormal_suspect_tb'
          ? 'abnormal_investigating'
          : formData.cxrResult === 'normal'
          ? 'screened_normal'
          : formData.tptStatus === 'on_tpt'
          ? 'on_tpt'
          : formData.screeningStatus || 'pending_screening';

      const contactToSave: ContactPerson = {
        id: formData.id || `CT-${Date.now()}`,
        indexPatientId: formData.indexPatientId!,
        indexPatientHN: formData.indexPatientHN || '',
        indexPatientName: formData.indexPatientName || '',
        contactType: formData.contactType || 'household',
        relationship: formData.relationship || 'คนในครอบครัว',
        hn: formData.hn!,
        fullName: formData.fullName!,
        gender: formData.gender || 'female',
        age: age,
        treatmentRights: formData.treatmentRights || 'บัตรทอง (UC)',
        phone: formData.phone || '',
        email: formData.email || '',
        protocolType: calculatedProtocol,
        ntipStatus: formData.ntipStatus || 'not_entered',
        ntipKeyCode: formData.ntipKeyCode || '',
        ntipKeyDate: formData.ntipStatus === 'entered' ? (formData.ntipKeyDate || new Date().toISOString().split('T')[0]) : '',
        ntipNotes: formData.ntipNotes || '',
        cxrStatus: formData.cxrStatus || 'not_done',
        cxrRound: formData.cxrRound || 'cxr_1_0m',
        cxrDate: formData.cxrDate || '',
        cxrResult: formData.cxrResult || 'pending',
        cxrResultDetail: formData.cxrResultDetail || '',
        cxrHospital: formData.cxrHospital || '',
        nextCxrDate: formData.nextCxrDate || '',
        igraResult: formData.igraResult,
        igraDate: formData.igraDate,
        tptRegimen: formData.tptRegimen,
        tptStatus: formData.tptStatus,
        screeningStatus: derivedScreeningStatus,
        notes: formData.notes || '',
        lastUpdatedBy: actorName,
        updatedAt: new Date().toISOString(),
        createdAt: initialData?.createdAt || new Date().toISOString(),
      };

      await onSave(contactToSave);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถบันทึกข้อมูลผู้สัมผัสลง Google Sheet ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl my-8 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <h2 className="text-base font-bold">
                  {isEditing ? 'แก้ไขข้อมูลผู้สัมผัสโรควัณโรค' : 'ลงทะเบียนผู้สัมผัสโรควัณโรค (Contact Tracing)'}
                </h2>
                <p className="text-xs text-teal-100">
                  ติดตามการคัดกรองตามเกณฑ์กรมควบคุมโรคและบันทึกรหัส n-tip ลง Google Sheet
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Index Patient Association */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-teal-700" />
                1. เชื่อมโยงกับผู้ป่วยวัณโรคดัชนี (Index Case)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ผู้ป่วยดัชนี (Index Patient) *
                  </label>
                  <select
                    value={formData.indexPatientId}
                    onChange={handlePatientSelect}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- เลือกผู้ป่วย --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} (HN: {p.hn || '-'}) [{p.id}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ความสัมพันธ์กับผู้ป่วย *
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น คู่สมรส, บุตร, บิดา/มารดา, เพื่อนร่วมงาน"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Contact Group Selection (Household vs Non-household) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-800">
                    กลุ่มผู้สัมผัสโรค (Contact Classification) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCriteriaModal(true)}
                    className="text-[11px] text-teal-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    เกณฑ์การจำแนกกลุ่ม (DDC)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, contactType: 'household' })}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 ${
                      formData.contactType === 'household'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      formData.contactType === 'household' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">1. กลุ่มร่วมบ้าน (Household)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">อาศัยใต้ชายคาเดียวกัน / &ge; 8 ชม./วัน</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, contactType: 'non_household' })}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 ${
                      formData.contactType === 'non_household'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      formData.contactType === 'non_household' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">2. กลุ่มนอกบ้าน (Non-household)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">ที่ทำงาน / โรงเรียน / &ge; 40-120 ชม.</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Contact Person Details */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                2. ข้อมูลส่วนบุคคลของผู้สัมผัสโรค
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    HN ผู้สัมผัส *
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 67-123456"
                    value={formData.hn}
                    onChange={(e) => setFormData({ ...formData, hn: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ชื่อ-นามสกุล *
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น น.ส.วิภาดา สมบูรณ์"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    เพศ *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="female">หญิง</option>
                    <option value="male">ชาย</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    อายุ (ปี) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    สิทธิการรักษา *
                  </label>
                  <select
                    value={formData.treatmentRights}
                    onChange={(e) => setFormData({ ...formData, treatmentRights: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="บัตรทอง (UC)">บัตรทอง (UC / สิทธิหลักประกันสุขภาพ)</option>
                    <option value="ประกันสังคม">ประกันสังคม (SSS)</option>
                    <option value="ข้าราชการ/รัฐวิสาหกิจ">ข้าราชการ / รัฐวิสาหกิจ (CSMBS)</option>
                    <option value="จ่ายเงินเอง">จ่ายเงินเอง (Self-pay)</option>
                    <option value="ต่างด้าว/ประกันสุขภาพต่างด้าว">ต่างด้าว / ประกันสุขภาพต่างด้าว</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    เบอร์ติดต่อ *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="08x-xxx-xxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    e-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="contact@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. การบันทึกตรวจและติดตามเอกเรย์ปอด พร้อมผลการตรวจ (CXR Follow-up) */}
            <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      3. การบันทึกติดตามเอกเรย์ปอด พร้อมผลการตรวจ (Chest X-Ray)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isOver5 
                        ? 'เกณฑ์อายุ > 5 ปี: ติดตาม CXR 4 ครั้ง ห่างกันทุก 6 เดือน (เดือนที่ 0, 6, 12, 18)' 
                        : 'เกณฑ์อายุ ≤ 5 ปี: ตรวจคัดกรอง IGRA/TST, CXR แรกรับ และพิจารณาให้ยาป้องกัน TPT'}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                  isOver5 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {isOver5 ? 'CXR Protocol 4 ครั้ง' : 'IGRA / TPT Protocol'}
                </span>
              </div>

              {/* Status and Round Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    สถานะการตรวจเอกซเรย์ปอด (CXR Status) *
                  </label>
                  <select
                    value={formData.cxrStatus || 'pending'}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setFormData(prev => ({
                        ...prev,
                        cxrStatus: newStatus,
                        cxrDate: newStatus === 'done' && !prev.cxrDate ? new Date().toISOString().split('T')[0] : prev.cxrDate,
                        cxrResult: newStatus === 'done' && prev.cxrResult === 'pending' ? 'normal' : prev.cxrResult
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="done">✅ ตรวจแล้ว (Completed)</option>
                    <option value="pending">⏳ รอตรวจ / มีนัดหมาย (Pending / Scheduled)</option>
                    <option value="not_done">⚪ ยังไม่ได้ตรวจ (Not Done)</option>
                    <option value="refused">❌ ปฏิเสธการตรวจ (Refused)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ครั้งที่ตรวจติดตาม (CXR Round / Follow-up Step) *
                  </label>
                  <select
                    value={formData.cxrRound || 'cxr_1_0m'}
                    onChange={(e) => setFormData({ ...formData, cxrRound: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="cxr_1_0m">ครั้งที่ 1: แรกรับ / เดือนที่ 0 (Baseline - Month 0)</option>
                    <option value="cxr_2_6m">ครั้งที่ 2: เดือนที่ 6 (Follow-up - Month 6)</option>
                    <option value="cxr_3_12m">ครั้งที่ 3: เดือนที่ 12 (Follow-up - Month 12)</option>
                    <option value="cxr_4_18m">ครั้งที่ 4: เดือนที่ 18 (Follow-up - Month 18)</option>
                    <option value="symptom_check">ตรวจซ้ำเนื่องจากมีอาการสงสัย (Symptom-driven)</option>
                  </select>
                </div>
              </div>

              {/* Date, Hospital, Next CXR Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-700" />
                    วันที่ตรวจเอกซเรย์ปอด (CXR Date)
                  </label>
                  <input
                    type="date"
                    value={formData.cxrDate || ''}
                    onChange={(e) => setFormData({ ...formData, cxrDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-700" />
                    สถานพยาบาลที่ตรวจ (Facility)
                  </label>
                  <input
                    type="text"
                    list="hospital-options"
                    placeholder="เช่น รพ.มหาวิทยาลัยอุบลราชธานี"
                    value={formData.cxrHospital || ''}
                    onChange={(e) => setFormData({ ...formData, cxrHospital: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="hospital-options">
                    <option value="รพ.มหาวิทยาลัยอุบลราชธานี" />
                    <option value="รพ.สรรพสิทธิประสงค์" />
                    <option value="รพ.วารินชำราบ" />
                    <option value="รพ.ค่ายสรรพสิทธิประสงค์" />
                    <option value="รถเอกซเรย์ระบบดิจิทัลเคลื่อนที่ (Mobile CXR)" />
                  </datalist>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      วันนัดตรวจ CXR ครั้งถัดไป
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoNextCxrDate}
                      className="text-[10px] text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                      title="คำนวณวันนัดถัดไป 6 เดือนข้างหน้าโดยอัตโนมัติ"
                    >
                      +6 เดือน
                    </button>
                  </div>
                  <input
                    type="date"
                    value={formData.nextCxrDate || ''}
                    onChange={(e) => setFormData({ ...formData, nextCxrDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* CXR Result & Findings */}
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200/70 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-1.5">
                    ผลการตรวจเอกซเรย์ปอด (Chest X-Ray Result) *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'normal', label: 'ปกติ (Normal)', color: 'border-emerald-300 bg-emerald-50 text-emerald-950 font-bold hover:bg-emerald-100', dot: 'bg-emerald-600' },
                      { value: 'abnormal_suspect_tb', label: 'ผิดปกติ สงสัยวัณโรค', color: 'border-rose-300 bg-rose-50 text-rose-950 font-bold hover:bg-rose-100', dot: 'bg-rose-600' },
                      { value: 'abnormal_other', label: 'ผิดปกติอื่นๆ (Non-TB)', color: 'border-amber-300 bg-amber-50 text-amber-950 font-bold hover:bg-amber-100', dot: 'bg-amber-600' },
                      { value: 'pending', label: 'รอผลอ่านฟิล์ม', color: 'border-blue-300 bg-blue-50 text-blue-950 font-bold hover:bg-blue-100', dot: 'bg-blue-600' },
                    ].map(resOption => {
                      const isSelected = formData.cxrResult === resOption.value;
                      return (
                        <button
                          key={resOption.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              cxrResult: resOption.value as any,
                              cxrResultDetail: 
                                resOption.value === 'normal' && !prev.cxrResultDetail
                                  ? 'ผลภาพถ่ายรังสีทรวงอกปกติ ไม่พบรอยโรควัณโรค (CXR Normal, No active lesion)'
                                  : resOption.value === 'abnormal_suspect_tb' && !prev.cxrResultDetail
                                  ? 'พบ Infiltration บริเวณกลีบปอด สงสัยวัณโรคปอด (Suspect Active TB) ส่งพบแพทย์ทันที'
                                  : prev.cxrResultDetail
                            }));
                          }}
                          className={`px-3 py-2 rounded-xl text-xs border text-left flex items-center gap-2 transition cursor-pointer ${
                            isSelected 
                              ? `${resOption.color} ring-2 ring-emerald-500/30 shadow-2xs` 
                              : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${resOption.dot}`} />
                          <span className="truncate">{resOption.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CXR Result Detail */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      รายละเอียดผลการตรวจ / ผลอ่านฟิล์มเอกซเรย์ (CXR Findings & Impression)
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="เช่น ปอดปกติ ไม่พบ infiltration, หรือ พบ infiltration กลีบปอดขวาบน สงสัย active TB..."
                    value={formData.cxrResultDetail || ''}
                    onChange={(e) => setFormData({ ...formData, cxrResultDetail: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  {/* Quick Findings Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">ข้อความด่วน:</span>
                    {[
                      'CXR Normal, No active lesion',
                      'ปอดปกติ ไม่พบ infiltration หรือ lymphadenopathy',
                      'พบ infiltration กลีบปอดบน สงสัย Active TB',
                      'Old healed fibrotic lesion (รอยโรคเก่า)',
                    ].map((text, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cxrResultDetail: text }))}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 transition cursor-pointer"
                      >
                        + {text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Children Section (Age <= 5) */}
                {!isOver5 && (
                  <div className="pt-2 border-t border-slate-200/80 mt-2 space-y-2.5">
                    <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-amber-700" />
                      การตรวจ IGRA และการให้ยาป้องกัน TPT (สำหรับเด็กอายุ ≤ 5 ปี)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                          ผลการตรวจ IGRA / TST
                        </label>
                        <select
                          value={formData.igraResult || 'pending'}
                          onChange={(e) => setFormData({ ...formData, igraResult: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                        >
                          <option value="pending">รอผลตรวจ / รอนัดตรวจ</option>
                          <option value="positive">ผลบวก (Positive)</option>
                          <option value="negative">ผลลบ (Negative)</option>
                          <option value="not_done">ยังไม่ได้ตรวจ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                          การให้ยาป้องกันวัณโรค (TPT)
                        </label>
                        <select
                          value={formData.tptStatus || 'not_started'}
                          onChange={(e) => setFormData({ ...formData, tptStatus: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                        >
                          <option value="not_started">ยังไม่ได้รับยา</option>
                          <option value="on_tpt">กำลังรับยาป้องกัน TPT (3HP / 1HP / 6H)</option>
                          <option value="completed">รับยาครบตามแผนแล้ว</option>
                          <option value="refused">ปฏิเสธการรับยา</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. NTIP Information & Key Code พร้อมหมายเหตุการคีย์ */}
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-purple-100 pb-2.5">
                <h3 className="text-xs font-bold text-purple-950 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
                    <FileKey className="w-3.5 h-3.5" />
                  </div>
                  4. ข้อมูลการบันทึกเข้าโปรแกรม NTIP และช่องการคีย์ N-tip พร้อมหมายเหตุ
                </h3>
                <span className="text-[10px] text-purple-800 bg-purple-100 font-semibold px-2 py-0.5 rounded-md border border-purple-200">
                  ระบบ NTIP กองวัณโรค
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    สถานะการคีย์ใน n-tip *
                  </label>
                  <select
                    value={formData.ntipStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      setFormData(prev => ({
                        ...prev,
                        ntipStatus: newStatus,
                        ntipKeyDate: newStatus === 'entered' && !prev.ntipKeyDate ? new Date().toISOString().split('T')[0] : prev.ntipKeyDate
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-semibold"
                  >
                    <option value="not_entered">ยังไม่ได้คีย์</option>
                    <option value="entered">✅ คีย์ใน n-tip แล้ว</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    รหัสที่คีย์ใน n-tip (NTIP Code) {formData.ntipStatus === 'entered' && '*'}
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น NTIP-2026-C01429-01"
                    value={formData.ntipKeyCode || ''}
                    onChange={(e) => setFormData({ ...formData, ntipKeyCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    วันที่คีย์ n-tip
                  </label>
                  <input
                    type="date"
                    value={formData.ntipKeyDate || ''}
                    onChange={(e) => setFormData({ ...formData, ntipKeyDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* ช่องการคีย์ N-tip พร้อมหมายเหตุ */}
              <div>
                <label className="block text-[11px] font-semibold text-purple-950 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-700" />
                    หมายเหตุการคีย์ N-tip (NTIP Notes / Remark)
                  </span>
                  <span className="text-[10px] font-normal text-purple-600">
                    บันทึกสถานะการส่งข้อมูล หรือข้อสังเกตในระบบ NTIP
                  </span>
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น บันทึกข้อมูลและเชื่อมโยงผู้ป่วยดัชนีแล้ว, รอยืนยันรหัสจากโปรแกรม NTIP, บันทึกผล CXR รอบที่ 1 แล้ว"
                  value={formData.ntipNotes || ''}
                  onChange={(e) => setFormData({ ...formData, ntipNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400"
                />
                {/* Quick suggestions for NTIP notes */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-purple-600 font-medium">ข้อความแนะนำ:</span>
                  {[
                    'บันทึกข้อมูลเข้าระบบ NTIP และเชื่อมโยงผู้ป่วยดัชนีเรียบร้อย',
                    'รอผลเอกซเรย์ปอดเพื่ออัปเดตในระบบ NTIP',
                    'ประสานคลินิกวัณโรค/รพ.สต. เพื่อติดตามคีย์ข้อมูล n-tip',
                    'บันทึกข้อมูลผู้สัมผัสเด็กรับยาป้องกัน TPT แล้ว',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        ntipNotes: prev.ntipNotes ? `${prev.ntipNotes}; ${preset}` : preset
                      }))}
                      className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200 transition cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Additional notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                5. หมายเหตุเพิ่มเติม / อาการและข้อสังเกตทั่วไป
              </label>
              <textarea
                rows={2}
                placeholder="เช่น มีอาการไอเรื้อรัง, มีไข้ต่ำๆ ตอนเย็น, หรือข้อสังเกตสุขภาพอื่นๆ ของผู้สัมผัส..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังบันทึกลง Google Sheet...' : 'บันทึกข้อมูลผู้สัมผัส'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ContactCriteriaModal
        isOpen={showCriteriaModal}
        onClose={() => setShowCriteriaModal(false)}
        onSelectType={(t) => setFormData(prev => ({ ...prev, contactType: t }))}
      />
    </>
  );
};
