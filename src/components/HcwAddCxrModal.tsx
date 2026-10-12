import React, { useState } from 'react';
import { X, Calendar, Activity, Building, User, FileText, CheckCircle, Clock, AlertTriangle, Shield } from 'lucide-react';
import { HealthcareWorker, HcwCxrRecord, UserProfile } from '../types';

interface Props {
  worker: HealthcareWorker;
  isOpen: boolean;
  onClose: () => void;
  onSaveCxr: (workerId: string, record: Omit<HcwCxrRecord, 'id' | 'createdAt'>) => void;
  currentUserProfile?: UserProfile | null;
}

export const HcwAddCxrModal: React.FC<Props> = ({
  worker,
  isOpen,
  onClose,
  onSaveCxr,
  currentUserProfile
}) => {
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<HcwCxrRecord['reason']>('annual');
  const [result, setResult] = useState<HcwCxrRecord['result']>('normal');
  const [resultDetail, setResultDetail] = useState<string>('No active pulmonary infiltration. Both lungs clear.');
  const [hospital, setHospital] = useState<string>('รพ.มหาวิทยาลัยอุบลราชธานี');
  const [radiologistOrDoctor, setRadiologistOrDoctor] = useState<string>(currentUserProfile?.displayName || '');
  const [actionTaken, setActionTaken] = useState<string>('ตรวจคัดกรองปกติ นัดตรวจประจำปีรอบถัดไป');
  const [nextScheduledDate, setNextScheduledDate] = useState<string>(() => {
    // Default 1 year from now
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [filmImageUrl, setFilmImageUrl] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert('กรุณาระบุวันที่ตรวจเอกซเรย์ปอด');
      return;
    }

    const nextRound = (worker.cxrRecords?.length || 0) + 1;

    onSaveCxr(worker.id, {
      date,
      roundNumber: nextRound,
      reason,
      result,
      resultDetail: resultDetail.trim() || (result === 'normal' ? 'ปกติ (Normal)' : 'ผิดปกติ'),
      hospital: hospital.trim() || 'รพ.มหาวิทยาลัยอุบลราชธานี',
      radiologistOrDoctor: radiologistOrDoctor.trim(),
      actionTaken: actionTaken.trim(),
      nextScheduledDate: nextScheduledDate || undefined,
      filmImageUrl: filmImageUrl.trim() || undefined,
      recordedBy: currentUserProfile?.displayName || 'เจ้าหน้าที่'
    });

    onClose();
  };

  const handleResultChange = (newResult: HcwCxrRecord['result']) => {
    setResult(newResult);
    if (newResult === 'normal') {
      setResultDetail('No active pulmonary infiltration. Heart and lungs within normal limits.');
      setActionTaken('ตรวจสุขภาพคัดกรองประจำปีตามรอบ นัดตรวจซ้ำใน 1 ปี');
    } else if (newResult === 'abnormal_suspect_tb') {
      setResultDetail('พบรอยโรคผิดปกติสงสัยวัณโรค (Infiltration / Cavity / Consolidation) ส่งตรวจเสมหะและปรึกษาแพทย์ TB');
      setActionTaken('ส่งตรวจเสมหะ AFB x 3 วัน, ส่ง GeneXpert MTB/RIF, ส่งพบแพทย์คลินิกวัณโรคทันที');
    } else if (newResult === 'abnormal_calcification_old') {
      setResultDetail('พบรอยโรคหินปูนเดิม/พังผืดเก่าคงที่ (Old fibrocalcific lesion), no active lesion');
      setActionTaken('เปรียบเทียบกับฟิล์มเดิม แนะนำสังเกตอาการ และนัดตรวจซ้ำ 6-12 เดือน');
    } else if (newResult === 'abnormal_other') {
      setResultDetail('พบความผิดปกติอื่นๆ (เช่น Cardiomegaly, Scoliosis, Pleural thickening)');
      setActionTaken('ส่งต่อแพทย์เฉพาะทางประเมินเพิ่มเติม');
    } else {
      setResultDetail('อยู่ระหว่างรอผลการอ่านฟิล์มจากรังสีแพทย์');
      setActionTaken('รอผลอ่านฟิล์มเป็นทางการ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
              <Activity className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">บันทึกผลการตรวจเอกซเรย์ปอด (CXR)</h2>
              <p className="text-xs text-teal-100 font-light">
                ครั้งที่ {(worker.cxrRecords?.length || 0) + 1} • {worker.fullName} ({worker.position} - {worker.department})
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Worker summary chip */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-900">{worker.fullName}</span>
              {worker.staffId && <span className="text-teal-700 font-mono">({worker.staffId})</span>}
              <span className="text-slate-500">•</span>
              <span className="text-slate-600">{worker.department}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
              เคยตรวจแล้ว {worker.cxrRecords?.length || 0} ครั้ง
            </span>
          </div>

          {/* Date & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ตรวจเอกซเรย์ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วัตถุประสงค์การตรวจ <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as HcwCxrRecord['reason'])}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              >
                <option value="annual">ตรวจคัดกรองประจำปี (Annual Screening)</option>
                <option value="pre_employment">ตรวจสุขภาพแรกเข้าทำงาน (Pre-employment)</option>
                <option value="contact_investigation">สัมผัสผู้ป่วยวัณโรคในงาน (Workplace Contact)</option>
                <option value="symptomatic">มีอาการสงสัยวัณโรค (Symptomatic)</option>
                <option value="followup">ตรวจติดตามผลรอยโรคเดิม (Follow-up)</option>
                <option value="other">อื่นๆ</option>
              </select>
            </div>
          </div>

          {/* CXR Result */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ผลการตรวจเอกซเรย์ปอด <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleResultChange('normal')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer flex items-center gap-2 ${
                  result === 'normal'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${result === 'normal' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>ปกติ (Normal)</span>
              </button>

              <button
                type="button"
                onClick={() => handleResultChange('abnormal_suspect_tb')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer flex items-center gap-2 ${
                  result === 'abnormal_suspect_tb'
                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 ${result === 'abnormal_suspect_tb' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>สงสัยวัณโรค (Suspect TB)</span>
              </button>

              <button
                type="button"
                onClick={() => handleResultChange('abnormal_calcification_old')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer flex items-center gap-2 ${
                  result === 'abnormal_calcification_old'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Clock className={`w-4 h-4 ${result === 'abnormal_calcification_old' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>รอยโรคเก่า/หินปูนคงที่</span>
              </button>

              <button
                type="button"
                onClick={() => handleResultChange('abnormal_other')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer flex items-center gap-2 ${
                  result === 'abnormal_other'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Activity className={`w-4 h-4 ${result === 'abnormal_other' ? 'text-purple-600' : 'text-slate-400'}`} />
                <span>ผิดปกติอื่นๆ</span>
              </button>

              <button
                type="button"
                onClick={() => handleResultChange('pending')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition cursor-pointer flex items-center gap-2 ${
                  result === 'pending'
                    ? 'bg-slate-100 border-slate-500 text-slate-900 ring-1 ring-slate-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Clock className={`w-4 h-4 ${result === 'pending' ? 'text-slate-600' : 'text-slate-400'}`} />
                <span>รอผลตรวจ (Pending)</span>
              </button>
            </div>
          </div>

          {/* Result Detail */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รายละเอียดผลการอ่านฟิล์ม (Impression / Findings) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={resultDetail}
              onChange={(e) => setResultDetail(e.target.value)}
              placeholder="ระบุผลการอ่านฟิล์ม เช่น No active infiltration, Infiltration at RUL..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Action Taken */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              แผนการดูแล / การส่งต่อ (Action Taken)
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="เช่น นัดตรวจซ้ำ 1 ปี, ส่งพบแพทย์คลินิก TB, ส่งตรวจเสมหะ..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Hospital & Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานพยาบาลที่ตรวจ
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                แพทย์/รังสีแพทย์ผู้อ่านผล
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={radiologistOrDoctor}
                  onChange={(e) => setRadiologistOrDoctor(e.target.value)}
                  placeholder="ชื่อแพทย์ผู้อ่านผล"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Next Scheduled Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันนัดตรวจ CXR ครั้งถัดไป (Next Due Date)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={nextScheduledDate}
                  onChange={(e) => setNextScheduledDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ลิงก์รูปภาพฟิล์ม / PACS (ถ้ามี)
              </label>
              <input
                type="text"
                value={filmImageUrl}
                onChange={(e) => setFilmImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
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
              <span>บันทึกผลการตรวจเอกซเรย์</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
