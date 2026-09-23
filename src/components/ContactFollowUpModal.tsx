import React, { useState } from 'react';
import { 
  Calendar, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Stethoscope, 
  Activity, 
  FileText, 
  Building2,
  Pill,
  Clock,
  FileKey,
  Check
} from 'lucide-react';
import { ContactPerson, ContactFollowUp } from '../types';
import { formatThaiDate, getYearBE } from '../lib/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (followUp: ContactFollowUp) => Promise<void>;
  contact: ContactPerson;
  existingFollowUp?: ContactFollowUp | null;
  defaultStep?: ContactFollowUp['stepType'];
  currentUserName: string;
}

export const ContactFollowUpModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  contact,
  existingFollowUp,
  defaultStep,
  currentUserName,
}) => {
  const isOver5 = contact.age > 5;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ContactFollowUp>>(() => {
    if (existingFollowUp) {
      return { 
        ...existingFollowUp,
        ntipCodeRound1: existingFollowUp.ntipCodeRound1 || contact.ntipCodeRound1 || '',
        ntipCodeRound2: existingFollowUp.ntipCodeRound2 || contact.ntipCodeRound2 || '',
        ntipCodeRound3: existingFollowUp.ntipCodeRound3 || contact.ntipCodeRound3 || '',
        ntipCodeRound4: existingFollowUp.ntipCodeRound4 || contact.ntipCodeRound4 || '',
      };
    }

    let step: ContactFollowUp['stepType'] = defaultStep || (isOver5 ? 'cxr_1_0m' : 'igra_test');
    
    // Initial round codes from contact
    const r1 = contact.ntipCodeRound1 || (step === 'cxr_1_0m' ? contact.ntipKeyCode : '') || '';
    const r2 = contact.ntipCodeRound2 || (step === 'cxr_2_6m' ? contact.ntipKeyCode : '') || '';
    const r3 = contact.ntipCodeRound3 || (step === 'cxr_3_12m' ? contact.ntipKeyCode : '') || '';
    const r4 = contact.ntipCodeRound4 || (step === 'cxr_4_18m' ? contact.ntipKeyCode : '') || '';
    const currentCode = step === 'cxr_1_0m' ? r1 : step === 'cxr_2_6m' ? r2 : step === 'cxr_3_12m' ? r3 : step === 'cxr_4_18m' ? r4 : contact.ntipKeyCode;

    return {
      id: `FU-${getYearBE()}-${Math.floor(1000 + Math.random() * 9000)}`,
      contactId: contact.id,
      indexPatientHN: contact.indexPatientHN,
      contactHN: contact.hn,
      contactName: contact.fullName,
      contactAge: contact.age,
      stepType: step,
      scheduledDate: new Date().toISOString().split('T')[0],
      actualDate: new Date().toISOString().split('T')[0],
      status: 'completed',
      testResult: 'normal',
      resultDetail: 'ผลภาพถ่ายรังสีปอดปกติ ไม่พบรอยโรควัณโรค (CXR Normal)',
      tptRegimen: 'none',
      hospitalOrFacility: contact.cxrHospital || 'รพ.มหาวิทยาลัยอุบลราชธานี',
      ntipKeyCode: currentCode || '',
      ntipCodeRound1: r1,
      ntipCodeRound2: r2,
      ntipCodeRound3: r3,
      ntipCodeRound4: r4,
      ntipNotes: contact.ntipNotes || '',
      nextAppointmentDate: contact.nextCxrDate || '',
      recordedBy: currentUserName,
      notes: '',
    };
  });

  if (!isOpen) return null;

  const handleAutoNextAppointment = () => {
    const baseDateStr = formData.actualDate || formData.scheduledDate || new Date().toISOString().split('T')[0];
    const d = new Date(baseDateStr);
    if (!isNaN(d.getTime())) {
      d.setMonth(d.getMonth() + 6);
      setFormData(prev => ({ ...prev, nextAppointmentDate: d.toISOString().split('T')[0] }));
    }
  };

  // Sync active round code when step changes
  const handleStepChange = (newStep: ContactFollowUp['stepType']) => {
    setFormData(prev => {
      let activeCode = prev.ntipKeyCode || '';
      if (newStep === 'cxr_1_0m') activeCode = prev.ntipCodeRound1 || activeCode;
      else if (newStep === 'cxr_2_6m') activeCode = prev.ntipCodeRound2 || activeCode;
      else if (newStep === 'cxr_3_12m') activeCode = prev.ntipCodeRound3 || activeCode;
      else if (newStep === 'cxr_4_18m') activeCode = prev.ntipCodeRound4 || activeCode;

      return {
        ...prev,
        stepType: newStep,
        ntipKeyCode: activeCode,
      };
    });
  };

  const handleRoundCodeChange = (round: 1 | 2 | 3 | 4, value: string) => {
    setFormData(prev => {
      const updated = { ...prev };
      if (round === 1) {
        updated.ntipCodeRound1 = value;
        if (prev.stepType === 'cxr_1_0m') updated.ntipKeyCode = value;
      } else if (round === 2) {
        updated.ntipCodeRound2 = value;
        if (prev.stepType === 'cxr_2_6m') updated.ntipKeyCode = value;
      } else if (round === 3) {
        updated.ntipCodeRound3 = value;
        if (prev.stepType === 'cxr_3_12m') updated.ntipKeyCode = value;
      } else if (round === 4) {
        updated.ntipCodeRound4 = value;
        if (prev.stepType === 'cxr_4_18m') updated.ntipKeyCode = value;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Determine primary ntipKeyCode for this round if empty
      let currentRoundCode = formData.ntipKeyCode || '';
      if (formData.stepType === 'cxr_1_0m' && formData.ntipCodeRound1) currentRoundCode = formData.ntipCodeRound1;
      else if (formData.stepType === 'cxr_2_6m' && formData.ntipCodeRound2) currentRoundCode = formData.ntipCodeRound2;
      else if (formData.stepType === 'cxr_3_12m' && formData.ntipCodeRound3) currentRoundCode = formData.ntipCodeRound3;
      else if (formData.stepType === 'cxr_4_18m' && formData.ntipCodeRound4) currentRoundCode = formData.ntipCodeRound4;
      else if (!currentRoundCode) {
        currentRoundCode = formData.ntipCodeRound1 || formData.ntipCodeRound2 || formData.ntipCodeRound3 || formData.ntipCodeRound4 || '';
      }

      const fuToSave: ContactFollowUp = {
        id: formData.id || `FU-${getYearBE()}-${Date.now()}`,
        contactId: contact.id,
        indexPatientHN: contact.indexPatientHN,
        contactHN: contact.hn,
        contactName: contact.fullName,
        contactAge: contact.age,
        stepType: formData.stepType || (isOver5 ? 'cxr_1_0m' : 'igra_test'),
        scheduledDate: formData.scheduledDate || new Date().toISOString().split('T')[0],
        actualDate: formData.status === 'completed' ? (formData.actualDate || new Date().toISOString().split('T')[0]) : '',
        status: formData.status || 'scheduled',
        testResult: formData.testResult || 'pending',
        resultDetail: formData.resultDetail || '',
        tptRegimen: formData.tptRegimen || 'none',
        hospitalOrFacility: formData.hospitalOrFacility || '',
        ntipKeyCode: currentRoundCode,
        ntipCodeRound1: formData.ntipCodeRound1 || '',
        ntipCodeRound2: formData.ntipCodeRound2 || '',
        ntipCodeRound3: formData.ntipCodeRound3 || '',
        ntipCodeRound4: formData.ntipCodeRound4 || '',
        ntipNotes: formData.ntipNotes || '',
        nextAppointmentDate: formData.nextAppointmentDate || '',
        recordedBy: currentUserName,
        notes: formData.notes || '',
      };

      await onSave(fuToSave);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถบันทึกข้อมูลการติดตามผลตรวจได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count entered rounds
  const filledRoundsCount = [
    formData.ntipCodeRound1,
    formData.ntipCodeRound2,
    formData.ntipCodeRound3,
    formData.ntipCodeRound4
  ].filter(c => !!c && c.trim() !== '').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-8 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                บันทึกผลการติดตามตรวจผู้สัมผัสโรค (Follow-up & Screening)
              </h2>
              <p className="text-xs text-teal-100">
                ผู้สัมผัส: {contact.fullName} (HN: {contact.hn}) • อายุ {contact.age} ปี • ผู้ป่วยดัชนี: {contact.indexPatientName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step Selection */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800">
              รอบ/ขั้นตอนการตรวจติดตามคัดกรอง *
            </label>

            {isOver5 ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'cxr_1_0m', roundNum: 1, label: 'CXR ครั้งที่ 1 (แรกรับ/0 ด.)', desc: 'ตรวจทันทีเมื่อพบผู้ป่วย' },
                  { id: 'cxr_2_6m', roundNum: 2, label: 'CXR ครั้งที่ 2 (ที่ 6 เดือน)', desc: 'ติดตามรอบ 6 เดือน' },
                  { id: 'cxr_3_12m', roundNum: 3, label: 'CXR ครั้งที่ 3 (ที่ 12 เดือน)', desc: 'ติดตามรอบ 1 ปี' },
                  { id: 'cxr_4_18m', roundNum: 4, label: 'CXR ครั้งที่ 4 (ที่ 18 เดือน)', desc: 'ติดตามครบกำหนด' },
                ].map(step => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepChange(step.id as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formData.stepType === step.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{step.label}</span>
                      {formData.stepType === step.id && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">{step.desc}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'igra_test', label: 'ส่งตรวจ IGRA / TST', desc: 'ตรวจการติดเชื้อระยะแฝง' },
                  { id: 'tpt_assessment', label: 'ประเมินรับยาป้องกัน (TPT)', desc: 'พิจารณา 3HP / 1HP / 6H' },
                  { id: 'cxr_1_0m', label: 'CXR แรกรับ (เด็กเล็ก)', desc: 'ตรวจภาพถ่ายรังสีปอด' },
                  { id: 'symptom_check', label: 'ติดตามอาการทางคลินิก', desc: 'เฝ้าระวังไข้/ไอ/นน.ลด' },
                ].map(step => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepChange(step.id as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formData.stepType === step.id
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{step.label}</span>
                      {formData.stepType === step.id && (
                        <span className="w-2 h-2 rounded-full bg-amber-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">{step.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dates & Status with Buddhist Era (พ.ศ.) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                วันที่นัดหมาย (Scheduled Date) *
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
              <div className="text-[10px] text-teal-700 font-medium mt-0.5">
                📅 {formatThaiDate(formData.scheduledDate, { showBuddhistPrefix: true })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                สถานะการมาตรวจ *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold"
              >
                <option value="completed">✅ มาตรวจเรียบร้อย (Completed)</option>
                <option value="scheduled">⏳ รอนัดตรวจ (Scheduled)</option>
                <option value="delayed">⚠️ เลื่อนนัด (Delayed)</option>
                <option value="missed">❌ ขาดนัด (Missed)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                วันที่ตรวจจริง (Actual Date)
              </label>
              <input
                type="date"
                value={formData.actualDate}
                onChange={(e) => setFormData({ ...formData, actualDate: e.target.value })}
                disabled={formData.status !== 'completed'}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl disabled:bg-slate-100"
              />
              {formData.actualDate && (
                <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                  📅 {formatThaiDate(formData.actualDate, { showBuddhistPrefix: true })}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          {formData.status === 'completed' && (
            <div className="space-y-3.5 bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl">
              <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-2 border-b border-emerald-200/60 pb-2">
                <Activity className="w-4 h-4 text-emerald-700" />
                การบันทึกติดตามเอกเรย์ปอด พร้อมผลการตรวจ (CXR Results)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ผลตรวจเอกซเรย์ปอด / คัดกรอง *
                  </label>
                  <select
                    value={formData.testResult}
                    onChange={(e) => {
                      const res = e.target.value as any;
                      setFormData(prev => ({
                        ...prev,
                        testResult: res,
                        resultDetail: res === 'normal' 
                          ? 'ผลภาพถ่ายรังสีทรวงอกปกติ ไม่พบรอยโรควัณโรค (CXR Normal)'
                          : res === 'abnormal_suspect_tb'
                          ? 'พบ Infiltration กลีบปอด สงสัยวัณโรค (Suspect TB) ส่งแพทย์วินิจฉัย'
                          : prev.resultDetail
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="normal">ปกติ (Normal / ไม่พบรอยโรควัณโรค)</option>
                    <option value="abnormal_suspect_tb">ผิดปกติ สงสัยวัณโรค (Suspect TB)</option>
                    <option value="igra_positive">ผล IGRA เป็นบวก (Positive LTBI)</option>
                    <option value="igra_negative">ผล IGRA เป็นลบ (Negative)</option>
                    <option value="indeterminate">ผลไม่ชัดเจน (Indeterminate)</option>
                    <option value="pending">รอผลตรวจทางห้องปฏิบัติการ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    การจ่ายยาป้องกันวัณโรค (TPT Regimen)
                  </label>
                  <select
                    value={formData.tptRegimen}
                    onChange={(e) => setFormData({ ...formData, tptRegimen: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="none">ไม่ได้รับยาป้องกัน (None)</option>
                    <option value="3HP">สูตร 3HP (Isoniazid + Rifapentine สัปดาห์ละครั้ง 3 เดือน)</option>
                    <option value="1HP">สูตร 1HP (Isoniazid + Rifapentine ทุกวัน 1 เดือน)</option>
                    <option value="6H">สูตร 6H (Isoniazid ทุกวัน 6 เดือน)</option>
                    <option value="refused">ผู้ป่วยปฏิเสธการรับยาป้องกัน</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  รายละเอียดผลตรวจ / ผลอ่านฟิล์มเอกซเรย์ (CXR Findings)
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น CXR Normal, ไม่พบ Infiltration หรือโพรงแผลในปอด"
                  value={formData.resultDetail}
                  onChange={(e) => setFormData({ ...formData, resultDetail: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-400">ข้อความด่วน:</span>
                  {[
                    'CXR Normal, No active lesion',
                    'ปอดปกติ ไม่พบ infiltration',
                    'Infiltration กลีบปอดบน สงสัย Active TB',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, resultDetail: preset }))}
                      className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 hover:bg-slate-100 cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Facility & Next appointment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-700" />
                สถานพยาบาลที่ตรวจ (Facility)
              </label>
              <input
                type="text"
                list="facility-options"
                placeholder="เช่น รพ.มหาวิทยาลัยอุบลราชธานี"
                value={formData.hospitalOrFacility}
                onChange={(e) => setFormData({ ...formData, hospitalOrFacility: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
              <datalist id="facility-options">
                <option value="รพ.มหาวิทยาลัยอุบลราชธานี" />
                <option value="รพ.สรรพสิทธิประสงค์" />
                <option value="รพ.วารินชำราบ" />
                <option value="รพ.ค่ายสรรพสิทธิประสงค์" />
              </datalist>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-700" />
                  วันนัดตรวจติดตามครั้งถัดไป
                </label>
                <button
                  type="button"
                  onClick={handleAutoNextAppointment}
                  className="text-[10px] text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                >
                  +6 เดือน (นัดถัดไป)
                </button>
              </div>
              <input
                type="date"
                value={formData.nextAppointmentDate || ''}
                onChange={(e) => setFormData({ ...formData, nextAppointmentDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
              {formData.nextAppointmentDate && (
                <div className="text-[10px] text-teal-700 font-medium mt-0.5">
                  📅 {formatThaiDate(formData.nextAppointmentDate, { showBuddhistPrefix: true })}
                </div>
              )}
            </div>
          </div>

          {/* NTIP Information Entry: 4 CXR Rounds Entry */}
          <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/80 pb-2.5">
              <h3 className="text-xs font-bold text-purple-950 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-700 text-white flex items-center justify-center">
                  <FileKey className="w-3.5 h-3.5" />
                </div>
                การคีย์รหัส N-tip ให้ครบทั้ง 4 ครั้งในการติดตามเอกเรย์ (NTIP Key Codes)
              </h3>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  filledRoundsCount === 4
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : filledRoundsCount > 0
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  คีย์แล้ว {filledRoundsCount}/4 ครั้ง {filledRoundsCount === 4 && '✓ ครบถ้วน'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-purple-900 leading-relaxed">
              กรอกรหัสขึ้นทะเบียน / รหัสบริการที่ได้รับจากโปรแกรม NTIP ของกองวัณโรคสำหรับแต่ละรอบการติดตามเอกเรย์ปอด (CXR 4 ครั้ง):
            </p>

            {/* 4 Rounds Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Round 1 */}
              <div className={`p-3 rounded-xl border transition ${
                formData.stepType === 'cxr_1_0m'
                  ? 'bg-purple-100/70 border-purple-400 ring-2 ring-purple-500/20 shadow-2xs'
                  : 'bg-white border-purple-200/70'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-700 text-white text-[9px] flex items-center justify-center font-bold">1</span>
                    รหัส N-tip ครั้งที่ 1 (แรกรับ / 0 เดือน)
                  </label>
                  {formData.stepType === 'cxr_1_0m' && (
                    <span className="text-[9px] font-bold text-purple-800 bg-purple-200 px-1.5 py-0.5 rounded">รอบปัจจุบัน</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="เช่น 6815078000023"
                  value={formData.ntipCodeRound1 || ''}
                  onChange={(e) => handleRoundCodeChange(1, e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono tracking-wide"
                />
              </div>

              {/* Round 2 */}
              <div className={`p-3 rounded-xl border transition ${
                formData.stepType === 'cxr_2_6m'
                  ? 'bg-purple-100/70 border-purple-400 ring-2 ring-purple-500/20 shadow-2xs'
                  : 'bg-white border-purple-200/70'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-700 text-white text-[9px] flex items-center justify-center font-bold">2</span>
                    รหัส N-tip ครั้งที่ 2 (ที่ 6 เดือน)
                  </label>
                  {formData.stepType === 'cxr_2_6m' && (
                    <span className="text-[9px] font-bold text-purple-800 bg-purple-200 px-1.5 py-0.5 rounded">รอบปัจจุบัน</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="เช่น 6915078000004"
                  value={formData.ntipCodeRound2 || ''}
                  onChange={(e) => handleRoundCodeChange(2, e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono tracking-wide"
                />
              </div>

              {/* Round 3 */}
              <div className={`p-3 rounded-xl border transition ${
                formData.stepType === 'cxr_3_12m'
                  ? 'bg-purple-100/70 border-purple-400 ring-2 ring-purple-500/20 shadow-2xs'
                  : 'bg-white border-purple-200/70'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-700 text-white text-[9px] flex items-center justify-center font-bold">3</span>
                    รหัส N-tip ครั้งที่ 3 (ที่ 12 เดือน)
                  </label>
                  {formData.stepType === 'cxr_3_12m' && (
                    <span className="text-[9px] font-bold text-purple-800 bg-purple-200 px-1.5 py-0.5 rounded">รอบปัจจุบัน</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="เช่น 6915078000088"
                  value={formData.ntipCodeRound3 || ''}
                  onChange={(e) => handleRoundCodeChange(3, e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono tracking-wide"
                />
              </div>

              {/* Round 4 */}
              <div className={`p-3 rounded-xl border transition ${
                formData.stepType === 'cxr_4_18m'
                  ? 'bg-purple-100/70 border-purple-400 ring-2 ring-purple-500/20 shadow-2xs'
                  : 'bg-white border-purple-200/70'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-700 text-white text-[9px] flex items-center justify-center font-bold">4</span>
                    รหัส N-tip ครั้งที่ 4 (ที่ 18 เดือน)
                  </label>
                  {formData.stepType === 'cxr_4_18m' && (
                    <span className="text-[9px] font-bold text-purple-800 bg-purple-200 px-1.5 py-0.5 rounded">รอบปัจจุบัน</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="เช่น 7015078000012"
                  value={formData.ntipCodeRound4 || ''}
                  onChange={(e) => handleRoundCodeChange(4, e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono tracking-wide"
                />
              </div>
            </div>

            {/* NTIP Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-purple-950 mb-1">
                หมายเหตุการคีย์ N-tip (NTIP Notes)
              </label>
              <input
                type="text"
                placeholder="เช่น บันทึกผล CXR รอบที่ 1 และรอบที่ 2 แล้ว, รอยืนยันรหัสรอบ 12 เดือน"
                value={formData.ntipNotes || ''}
                onChange={(e) => setFormData({ ...formData, ntipNotes: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              หมายเหตุเพิ่มเติม
            </label>
            <input
              type="text"
              placeholder="เช่น นัดติดตามรอบถัดไปอีก 6 เดือน, อาการทั่วไปปกติ"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกผลการติดตาม'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

