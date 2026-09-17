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
  FileKey
} from 'lucide-react';
import { ContactPerson, ContactFollowUp } from '../types';

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
    if (existingFollowUp) return { ...existingFollowUp };

    let step: ContactFollowUp['stepType'] = defaultStep || (isOver5 ? 'cxr_1_0m' : 'igra_test');
    
    return {
      id: `FU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
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
      ntipKeyCode: contact.ntipKeyCode || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const fuToSave: ContactFollowUp = {
        id: formData.id || `FU-${Date.now()}`,
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
        ntipKeyCode: formData.ntipKeyCode || '',
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
            className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition"
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
                  { id: 'cxr_1_0m', label: 'CXR ครั้งที่ 1 (แรกรับ/0 ด.)', desc: 'ตรวจทันทีเมื่อพบผู้ป่วย' },
                  { id: 'cxr_2_6m', label: 'CXR ครั้งที่ 2 (ที่ 6 เดือน)', desc: 'ติดตามรอบ 6 เดือน' },
                  { id: 'cxr_3_12m', label: 'CXR ครั้งที่ 3 (ที่ 12 เดือน)', desc: 'ติดตามรอบ 1 ปี' },
                  { id: 'cxr_4_18m', label: 'CXR ครั้งที่ 4 (ที่ 18 เดือน)', desc: 'ติดตามครบกำหนด' },
                ].map(step => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, stepType: step.id as any })}
                    className={`p-3 rounded-xl border text-left transition ${
                      formData.stepType === step.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>{step.label}</div>
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
                    onClick={() => setFormData({ ...formData, stepType: step.id as any })}
                    className={`p-3 rounded-xl border text-left transition ${
                      formData.stepType === step.id
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>{step.label}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{step.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dates & Status */}
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
                      className="text-[10px] bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 hover:bg-slate-100"
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
            </div>
          </div>

          {/* NTIP Information Entry in Follow-Up */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-purple-950 flex items-center gap-2">
              <FileKey className="w-4 h-4 text-purple-700" />
              ช่องการคีย์ N-tip พร้อมหมายเหตุ (NTIP Key Code & Notes)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-purple-950 mb-1">
                  รหัสที่คีย์ใน n-tip (NTIP Code)
                </label>
                <input
                  type="text"
                  placeholder="เช่น NTIP-2026-C01429-01"
                  value={formData.ntipKeyCode || ''}
                  onChange={(e) => setFormData({ ...formData, ntipKeyCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-950 mb-1">
                  หมายเหตุการคีย์ N-tip
                </label>
                <input
                  type="text"
                  placeholder="เช่น คีย์ผล CXR รอบที่ 1 แล้ว, รอยืนยันรหัส"
                  value={formData.ntipNotes || ''}
                  onChange={(e) => setFormData({ ...formData, ntipNotes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>
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
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
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
