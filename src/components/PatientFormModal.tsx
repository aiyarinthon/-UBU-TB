import React, { useState } from 'react';
import { 
  UserPlus, 
  X, 
  AlertCircle, 
  Calendar, 
  Activity, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  HeartHandshake, 
  Stethoscope, 
  Building2,
  FileKey,
  Users,
  Home,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { Patient, UserProfile } from '../types';
import { ContactCriteriaModal } from './ContactCriteriaModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => Promise<void>;
  initialData?: Patient | null;
  currentUserProfile?: UserProfile | null;
  currentUserName?: string;
}

export const PatientFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentUserProfile,
  currentUserName,
}) => {
  const isEditing = !!initialData;
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const actorName = currentUserProfile?.displayName || currentUserName || currentUserProfile?.email || 'เจ้าหน้าที่ (ระบบ)';

  const [formData, setFormData] = useState<Partial<Patient>>(() => {
    if (initialData) return { ...initialData };
    const randomId = `TB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    return {
      id: randomId,
      hn: '',
      fullName: '',
      phone: '',
      email: '',
      nationalId: '',
      ntipRegistrationDate: today,
      diagnosisDate: today,
      age: 45,
      gender: 'male',
      address: '',
      treatmentRights: 'บัตรทอง (UC)',
      emergencyContact: {
        name: '',
        relationship: 'ญาติ/คนในครอบครัว',
        phone: '',
      },
      treatmentCategory: 'Cat 1 (New)',
      tbClassification: 'Pulmonary (Bacteriologically Confirmed)',
      weightKg: 55,
      treatmentRegimen: '2HRZE/4HR',
      doctorName: '',
      hospitalName: 'โรงพยาบาลมหาวิทยาลัยอุบลราชธานี',
      householdContactsCount: 0,
      nonHouseholdContactsCount: 0,
      investigationStatus: 'pending',
      status: 'active',
      notes: '',
    };
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.hn) {
      setErrorMsg('กรุณากรอก HN และชื่อ-นามสกุลของผู้ป่วยให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const patientToSave: Patient = {
        id: formData.id || `TB-${Date.now()}`,
        hn: formData.hn!,
        fullName: formData.fullName!,
        phone: formData.phone || '',
        email: formData.email || '',
        nationalId: formData.nationalId || '',
        ntipRegistrationDate: formData.ntipRegistrationDate || new Date().toISOString().split('T')[0],
        diagnosisDate: formData.diagnosisDate || new Date().toISOString().split('T')[0],
        age: Number(formData.age) || 0,
        gender: formData.gender || 'male',
        address: formData.address || '',
        treatmentRights: formData.treatmentRights || 'บัตรทอง (UC)',
        emergencyContact: {
          name: formData.emergencyContact?.name || '',
          relationship: formData.emergencyContact?.relationship || 'ผู้ติดต่อฉุกเฉิน',
          phone: formData.emergencyContact?.phone || '',
        },
        treatmentCategory: formData.treatmentCategory || 'Cat 1 (New)',
        tbClassification: formData.tbClassification || 'Pulmonary (Bacteriologically Confirmed)',
        weightKg: Number(formData.weightKg) || 50,
        treatmentRegimen: formData.treatmentRegimen || '2HRZE/4HR',
        doctorName: formData.doctorName || '',
        hospitalName: formData.hospitalName || '',
        householdContactsCount: Number(formData.householdContactsCount) || 0,
        nonHouseholdContactsCount: Number(formData.nonHouseholdContactsCount) || 0,
        investigationStatus: formData.investigationStatus || 'pending',
        status: formData.status || 'active',
        notes: formData.notes || '',
        lastUpdatedBy: actorName,
        updatedAt: new Date().toISOString(),
        createdAt: initialData?.createdAt || new Date().toISOString(),
      };

      await onSave(patientToSave);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถบันทึกข้อมูลผู้ป่วยลง Google Sheet ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl my-8 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-teal-800 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h2 className="text-base font-bold">
                  {isEditing ? 'แก้ไขข้อมูลผู้ป่วยวัณโรคปอด' : 'ลงทะเบียนผู้ป่วยวัณโรคปอดรายใหม่'}
                </h2>
                <p className="text-xs text-teal-100">
                  ระบบจัดเก็บข้อมูลผู้ป่วย วันขึ้นทะเบียน NTIP และจำนวนผู้สัมผัสเสี่ยง
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Primary Identifiers & Contact Info */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-700" />
                1. ข้อมูลทั่วไปและข้อมูลการติดต่อผู้ป่วยรายใหม่
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    HN (Hospital Number) *
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 67-009841"
                    value={formData.hn}
                    onChange={(e) => setFormData({ ...formData, hn: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ชื่อ-นามสกุล *
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นายบุญมี รักษาดี"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-semibold text-slate-800"
                  />
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
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
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
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
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
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    สิทธิการรักษา
                  </label>
                  <select
                    value={formData.treatmentRights}
                    onChange={(e) => setFormData({ ...formData, treatmentRights: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="บัตรทอง (UC)">บัตรทอง (UC / หลักประกันสุขภาพ)</option>
                    <option value="ประกันสังคม">ประกันสังคม (SSS)</option>
                    <option value="ข้าราชการ/รัฐวิสาหกิจ">ข้าราชการ / รัฐวิสาหกิจ (CSMBS)</option>
                    <option value="จ่ายเงินเอง">จ่ายเงินเอง (Self-pay)</option>
                    <option value="ต่างด้าว/ประกันสุขภาพต่างด้าว">ต่างด้าว / ประกันสุขภาพต่างด้าว</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  ที่อยู่ปัจจุบัน
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="บ้านเลขที่ หมู่ที่ ตำบล อำเภอ จังหวัด"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* 2. NTIP Registration & Diagnosis */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <FileKey className="w-4 h-4 text-purple-700" />
                2. ข้อมูลการขึ้นทะเบียนใน n-tip และการวินิจฉัย
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200">
                  <label className="block text-[11px] font-bold text-purple-950 mb-1">
                    วันขึ้นทะเบียนใน n-tip *
                  </label>
                  <input
                    type="date"
                    value={formData.ntipRegistrationDate}
                    onChange={(e) => setFormData({ ...formData, ntipRegistrationDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-bold text-purple-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    วันที่เริ่มวินิจฉัย/เริ่มทานยา *
                  </label>
                  <input
                    type="date"
                    value={formData.diagnosisDate}
                    onChange={(e) => setFormData({ ...formData, diagnosisDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    กลุ่มการรักษา (Category)
                  </label>
                  <select
                    value={formData.treatmentCategory}
                    onChange={(e) => setFormData({ ...formData, treatmentCategory: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="Cat 1 (New)">ผู้ป่วยรายใหม่ (New Case / Cat 1)</option>
                    <option value="Cat 2 (Retreatment)">ผู้ป่วยรับการรักษาซ้ำ (Retreatment / Cat 2)</option>
                    <option value="MDR-TB">วัณโรคดื้อยาหลายขนาน (MDR-TB)</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    สถานะการรักษา
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="active">กำลังรับการรักษา (Active)</option>
                    <option value="completed">รักษาหาย/ครบกำหนด (Completed/Cured)</option>
                    <option value="transferred">ส่งต่อ (Transferred Out)</option>
                    <option value="defaulted">ขาดการรักษา (Defaulted/Lost)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Contact Risk Screening Section (Household vs Non-household) with Pop-up trigger */}
            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-2 border-emerald-300 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                <div>
                  <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-700" />
                    3. ข้อมูลจำนวนผู้สัมผัสเสี่ยง (Contact Risk Screening)
                  </h3>
                  <p className="text-xs text-emerald-800">
                    แยกเป็นกลุ่มร่วมบ้าน และกลุ่มนอกบ้าน ตามเกณฑ์ของกรมควบคุมโรค
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCriteriaModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl shadow-2xs transition"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-700" />
                  เกณฑ์การจำแนกผู้สัมผัส
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">กลุ่มร่วมบ้าน (Household)</div>
                      <div className="text-[10px] text-emerald-700">อาศัยใต้ชายคาเดียวกัน / &ge; 8 ชม./วัน</div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <label className="text-xs text-slate-600 font-medium">จำนวนผู้สัมผัสร่วมบ้าน:</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.householdContactsCount}
                      onChange={(e) => setFormData({ ...formData, householdContactsCount: Number(e.target.value) })}
                      className="w-20 px-3 py-1.5 text-sm font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-xl text-center"
                    />
                    <span className="text-xs font-bold text-slate-700">คน</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">กลุ่มนอกบ้าน (Non-household)</div>
                      <div className="text-[10px] text-blue-700">ที่ทำงาน / โรงเรียน / &ge; 40-120 ชม.</div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <label className="text-xs text-slate-600 font-medium">จำนวนผู้สัมผัสนอกบ้าน:</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.nonHouseholdContactsCount}
                      onChange={(e) => setFormData({ ...formData, nonHouseholdContactsCount: Number(e.target.value) })}
                      className="w-20 px-3 py-1.5 text-sm font-bold text-blue-900 bg-blue-50 border border-blue-300 rounded-xl text-center"
                    />
                    <span className="text-xs font-bold text-slate-700">คน</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Emergency & Medical Facility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-teal-700" />
                  ผู้ติดต่อฉุกเฉิน
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล ผู้ติดต่อ"
                    value={formData.emergencyContact?.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact!, name: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                  <input
                    type="tel"
                    placeholder="เบอร์โทรศัพท์ผู้ติดต่อ"
                    value={formData.emergencyContact?.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact!, phone: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  แพทย์และสถานพยาบาล
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="แพทย์ผู้ดูแล เช่น พญ.สมรักษ์"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="โรงพยาบาล เช่น รพ.ศูนย์..."
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
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
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังบันทึกลง Google Sheet...' : 'บันทึกข้อมูลผู้ป่วย'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ContactCriteriaModal
        isOpen={showCriteriaModal}
        onClose={() => setShowCriteriaModal(false)}
      />
    </>
  );
};
