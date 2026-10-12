import React, { useState } from 'react';
import { X, UserMinus, Calendar, FileText, CheckCircle, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { HealthcareWorker } from '../types';

interface Props {
  worker: HealthcareWorker;
  isOpen: boolean;
  onClose: () => void;
  onConfirmResign: (
    workerId: string, 
    status: HealthcareWorker['status'], 
    resignationDate: string, 
    resignationReason: string, 
    resignationNotes?: string
  ) => void;
  onReactivate?: (workerId: string) => void;
}

export const HcwResignModal: React.FC<Props> = ({
  worker,
  isOpen,
  onClose,
  onConfirmResign,
  onReactivate
}) => {
  const isCurrentlyResigned = worker.status === 'resigned' || worker.status === 'retired' || worker.status === 'transferred';
  
  const [status, setStatus] = useState<HealthcareWorker['status']>(
    isCurrentlyResigned ? worker.status : 'resigned'
  );
  const [resignationDate, setResignationDate] = useState<string>(
    worker.resignationDate || new Date().toISOString().split('T')[0]
  );
  const [resignationReason, setResignationReason] = useState<string>(
    worker.resignationReason || 'ลาออกส่วนตัว'
  );
  const [resignationNotes, setResignationNotes] = useState<string>(
    worker.resignationNotes || ''
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resignationDate) {
      alert('กรุณาระบุวันที่ลาออก / พ้นสภาพ');
      return;
    }
    onConfirmResign(worker.id, status, resignationDate, resignationReason, resignationNotes);
    onClose();
  };

  const handleReactivateClick = () => {
    if (confirm(`ยืนยันการคืนสถานะให้ "${worker.fullName}" กลับมาเป็น "กำลังปฏิบัติงาน (Active)" ใช่หรือไม่?`)) {
      if (onReactivate) {
        onReactivate(worker.id);
      } else {
        onConfirmResign(worker.id, 'active', '', '', '');
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-rose-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
              <UserMinus className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">บันทึกการลาออก / พ้นสภาพบุคลากร</h2>
              <p className="text-xs text-slate-300 font-light">
                เก็บข้อมูลไว้ในฐานข้อมูลประวัติศาสตร์ • {worker.fullName}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Worker summary chip */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 text-sm">{worker.fullName}</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                worker.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {worker.status === 'active' ? 'กำลังปฏิบัติงาน (Active)' : 'ลาออก/พ้นสภาพแล้ว'}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2">
              <span>ตำแหน่ง: <strong>{worker.position}</strong></span>
              <span>•</span>
              <span>แผนก: <strong>{worker.department}</strong></span>
              {worker.staffId && <span>• รหัส: <strong>{worker.staffId}</strong></span>}
            </div>
          </div>

          {/* Database Preservation Notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">การบันทึกเป็นฐานข้อมูลประวัติบุคลากร:</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                การกดบันทึกจะไม่ลบประวัติการตรวจสุขภาพหรือเอกซเรย์ปอด แต่จะจัดเก็บเข้าสู่ <strong>"ฐานข้อมูลบุคลากรที่พ้นสภาพ (Historical Database)"</strong> เพื่อใช้อ้างอิงทางระบาดวิทยาและเวชระเบียนย้อนหลังได้ตลอดเวลา
              </p>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              สถานะการพ้นสภาพ <span className="text-rose-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as HealthcareWorker['status'])}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white"
            >
              <option value="resigned">ลาออก (Resigned)</option>
              <option value="transferred">ย้ายโรงพยาบาล / ย้ายหน่วยงาน (Transferred)</option>
              <option value="retired">เกษียณอายุราชการ / ปลดเกษียณ (Retired)</option>
            </select>
          </div>

          {/* Resignation Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              วันที่ลาออก / วันที่มีผลพ้นสภาพ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                required
                value={resignationDate}
                onChange={(e) => setResignationDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เหตุผลการพ้นสภาพ / การลาออก <span className="text-rose-500">*</span>
            </label>
            <select
              value={resignationReason}
              onChange={(e) => setResignationReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white"
            >
              <option value="ลาออกส่วนตัว">ลาออกส่วนตัว / ประกอบอาชีพอื่น</option>
              <option value="ย้ายโรงพยาบาล / ย้ายภูมิลำเนา">ย้ายโรงพยาบาล / ย้ายภูมิลำเนา</option>
              <option value="ศึกษาต่อ">ศึกษาต่อเฉพาะทาง / เพิ่มพูนทักษะ</option>
              <option value="เกษียณอายุราชการ">เกษียณอายุราชการ / ครบวาระ</option>
              <option value="สิ้นสุดสัญญาจ้าง">สิ้นสุดสัญญาจ้าง / โครงการ</option>
              <option value="ปัญหาสุขภาพ">ปัญหาสุขภาพ / พักฟื้น</option>
              <option value="อื่นๆ">อื่นๆ</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุเพิ่มเติม (ถ้ามี)
            </label>
            <textarea
              rows={2}
              value={resignationNotes}
              onChange={(e) => setResignationNotes(e.target.value)}
              placeholder="เช่น ย้ายไป รพ.ศูนย์สรรพสิทธิประสงค์, ศึกษาต่อปริญญาโท..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {isCurrentlyResigned ? (
              <button
                type="button"
                onClick={handleReactivateClick}
                className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>คืนสถานะกำลังปฏิบัติงาน</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>บันทึกสถานะลาออก</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
