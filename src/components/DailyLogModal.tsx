import React, { useState } from 'react';
import { 
  Pill, 
  X, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  UserCheck, 
  Heart, 
  CheckCircle, 
  Info,
  Thermometer,
  Eye,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyLog, Patient } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: DailyLog) => Promise<void>;
  patient: Patient;
  currentUserName?: string;
}

export const DailyLogModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  patient,
  currentUserName = 'เจ้าหน้าที่'
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [date, setDate] = useState(todayStr);
  const [takenMedication, setTakenMedication] = useState<boolean>(true);
  const [medicationTime, setMedicationTime] = useState(nowTime);
  const [supervisorType, setSupervisorType] = useState<'self' | 'family' | 'health_worker' | 'vhv'>('vhv');
  const [supervisorName, setSupervisorName] = useState('');
  
  // Symptom checklist
  const [symptoms, setSymptoms] = useState({
    cough: false,
    coughBlood: false,
    fever: false,
    nightSweats: false,
    weightLoss: false,
    chestPain: false,
    fatigue: false,
    nauseaVomiting: false,
    rashItch: false,
    yellowSkinEyes: false,
    jointPain: false,
    visionChanges: false,
    numbnessHandsFeet: false,
  });

  const [sideEffectsNotes, setSideEffectsNotes] = useState('');
  const [patientMood, setPatientMood] = useState<'good' | 'neutral' | 'poor'>('good');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto calculate severity flag based on red flags
  const calculateSeverity = (): 'normal' | 'mild' | 'moderate' | 'severe' => {
    if (symptoms.coughBlood || symptoms.yellowSkinEyes || symptoms.visionChanges) {
      return 'severe'; // Urgent adverse reactions (Isoniazid/Rifampicin/Ethambutol toxicity)
    }
    if (symptoms.fever || symptoms.chestPain || symptoms.nauseaVomiting || symptoms.rashItch) {
      return 'moderate';
    }
    if (symptoms.cough || symptoms.fatigue || symptoms.jointPain || symptoms.numbnessHandsFeet) {
      return 'mild';
    }
    return 'normal';
  };

  const currentSeverity = calculateSeverity();

  const handleToggleSymptom = (key: keyof typeof symptoms) => {
    setSymptoms(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const logId = `LOG-${patient.id}-${date}-${Date.now().toString().slice(-4)}`;
      const logData: DailyLog = {
        id: logId,
        patientId: patient.id,
        date,
        takenMedication,
        medicationTime: takenMedication ? medicationTime : undefined,
        supervisorType,
        supervisorName: supervisorName || (supervisorType === 'vhv' ? 'อสม. ประจำหมู่บ้าน' : ''),
        symptoms,
        severityLevel: currentSeverity,
        sideEffectsNotes,
        patientMood,
        recordedBy: currentUserName,
        recordedAt: new Date().toISOString(),
      };

      await onSave(logData);

      if (takenMedication && currentSeverity === 'normal') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถบันทึกข้อมูลลง Google Sheet ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl my-8 overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Pill className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                บันทึกการทานยาและติดตามอาการประจำวัน (DOTS Log)
              </h2>
              <p className="text-xs text-teal-100">
                ผู้ป่วย: <span className="font-semibold text-white">{patient.fullName}</span> ({patient.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* ส่วนการทานยา */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> 1. สถานะการทานยาตามแพทย์สั่ง (Adherence)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันที่บันทึก
                </label>
                <input
                  type="date"
                  value={date}
                  max={todayStr}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  การทานยาวันนี้
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTakenMedication(true)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                      takenMedication
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    ทานยาแล้ว
                  </button>
                  <button
                    type="button"
                    onClick={() => setTakenMedication(false)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                      !takenMedication
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    ยังไม่ได้ทาน / ลืมทาน
                  </button>
                </div>
              </div>

              {takenMedication && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    เวลาที่ทานยา
                  </label>
                  <input
                    type="time"
                    value={medicationTime}
                    onChange={(e) => setMedicationTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ผู้กำกับการทานยา (DOTS Supervisor)
                </label>
                <select
                  value={supervisorType}
                  onChange={(e) => setSupervisorType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="vhv">อสม. (DOTS Watcher)</option>
                  <option value="health_worker">เจ้าหน้าที่สาธารณสุข / รพ.สต.</option>
                  <option value="family">ญาติ / คนในครอบครัว</option>
                  <option value="self">ทานยาด้วยตนเอง (Self-administered)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ชื่อผู้กำกับการทานยา / ผู้สังเกตอาการ
                </label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="เช่น อสม. สมศรี หรือ ชื่อญาติที่ดูการกลืนยา"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* ส่วนเช็คอาการวัณโรคและผลข้างเคียงยา */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-2">
                <Thermometer className="w-4 h-4" /> 2. การประเมินอาการและผลข้างเคียงของยาวัณโรค
              </h3>
              {currentSeverity === 'severe' && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> ควรพบแพทย์ด่วน
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-500 mb-3">
              คลิกเลือกอาการที่พบในวันนี้ (เพื่อบันทึกลง Google Sheet และประเมินสัญญาณเตือน)
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { key: 'cough', label: 'ไอปกติ / ไอเรื้อรัง', icon: '😷', red: false },
                { key: 'coughBlood', label: 'ไอมีเลือดปน (เสี่ยง)', icon: '🩸', red: true },
                { key: 'fever', label: 'มีไข้ / ตัวร้อน', icon: '🌡️', red: false },
                { key: 'nightSweats', label: 'เหงื่อออกตอนกลางคืน', icon: '💧', red: false },
                { key: 'weightLoss', label: 'เบื่ออาหาร / น้ำหนักลด', icon: '📉', red: false },
                { key: 'chestPain', label: 'เจ็บแน่นหน้าอก', icon: '🫁', red: false },
                { key: 'fatigue', label: 'อ่อนเพลีย เหนื่อยง่าย', icon: '🥱', red: false },
                { key: 'nauseaVomiting', label: 'คลื่นไส้ / อาเจียน', icon: '🤢', red: false },
                { key: 'rashItch', label: 'ผื่นคันตามผิวหนัง', icon: '🧴', red: false },
                { key: 'yellowSkinEyes', label: 'ตาเหลือง ตัวเหลือง (ตับ)', icon: '⚠️', red: true },
                { key: 'jointPain', label: 'ปวดข้อ / ปวดกล้ามเนื้อ', icon: '🦵', red: false },
                { key: 'visionChanges', label: 'ตามัว / มองเห็นสีเพี้ยน', icon: '👁️', red: true },
                { key: 'numbnessHandsFeet', label: 'ชาปลายมือ ปลายเท้า', icon: '🦶', red: false },
              ].map((item) => {
                const isSelected = symptoms[item.key as keyof typeof symptoms];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleSymptom(item.key as keyof typeof symptoms)}
                    className={`p-2.5 rounded-xl text-left border text-xs flex items-center gap-2 transition ${
                      isSelected
                        ? item.red
                          ? 'bg-rose-100 border-rose-400 text-rose-900 font-semibold shadow-xs'
                          : 'bg-teal-100 border-teal-400 text-teal-900 font-semibold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Warning Box for severe flags */}
            {(symptoms.coughBlood || symptoms.yellowSkinEyes || symptoms.visionChanges) && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold">ข้อควรระวังทางการแพทย์: </span>
                  พบอาการเสี่ยงรุนแรง (เช่น ตาเหลือง/ตัวเหลือง หรือตามัว หรือไอเป็นเลือด) แนะนำให้รีบพาผู้ป่วยเข้าพบแพทย์ที่โรงพยาบาลเพื่อตรวจการทำงานของตับหรือปรับขนาดยา
                </div>
              </div>
            )}
          </div>

          {/* สภาวะอารมณ์และบันทึกเพิ่มเติม */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                กำลังใจ / สภาวะอารมณ์ผู้ป่วย
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'good', label: '😊 สดชื่น/กำลังใจดี' },
                  { value: 'neutral', label: '😐 ปกติ' },
                  { value: 'poor', label: '😔 ท้อแท้/เครียด' },
                ].map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPatientMood(m.value as any)}
                    className={`py-2 px-1 text-center rounded-xl text-xs border transition ${
                      patientMood === m.value
                        ? 'bg-teal-600 text-white font-medium border-teal-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                บันทึกเพิ่มเติม / รายละเอียดอาการข้างเคียง
              </label>
              <textarea
                rows={2}
                value={sideEffectsNotes}
                onChange={(e) => setSideEffectsNotes(e.target.value)}
                placeholder="เช่น ทานยาครบ 4 เม็ดหลังอาหาร, มีอาการคลื่นไส้เล็กน้อยช่วงเช้า..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'กำลังบันทึกข้อมูลลง Google Sheet...' : 'บันทึกการติดตามวันนี้'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
