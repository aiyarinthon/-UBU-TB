import React from 'react';
import { 
  Home, 
  Users, 
  ShieldAlert, 
  Info, 
  X, 
  Clock, 
  CheckCircle2, 
  HeartHandshake, 
  HelpCircle,
  Calendar,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectType?: (type: 'household' | 'non_household') => void;
}

export const ContactCriteriaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl my-6 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                เกณฑ์การจำแนกผู้สัมผัสโรควัณโรค (Contact Tracing Criteria)
              </h2>
              <p className="text-xs text-teal-200">
                อ้างอิง: แนวทางการสอบสวนและควบคุมวัณโรค (ฉบับปรับปรุง พ.ศ. 2566) กรมควบคุมโรค กระทรวงสาธารณสุข
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Infectious Period Definition */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950 leading-relaxed">
            <Calendar className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 text-sm block mb-1">
                ⏱️ นิยามช่วงเวลาแพร่เชื้อของผู้ป่วย (Infectious Period) ตามแนวทางปี 2566:
              </span>
              <ul className="list-disc list-inside space-y-1 text-amber-900">
                <li><strong>ผู้ป่วยมีอาการ:</strong> ย้อนหลัง <strong>3 เดือน</strong> ก่อนเริ่มมีอาการไอหรืออาการผิดปกติ จนถึงหลังเริ่มรับประทานยาต้านวัณโรคที่มีประสิทธิผลอย่างน้อย <strong>2 สัปดาห์</strong></li>
                <li><strong>ผู้ป่วยไม่มีอาการ (ตรวจพบจากการคัดกรอง):</strong> ย้อนหลัง <strong>3 เดือน</strong> ก่อนวันที่มีผลตรวจวินิจฉัย/เอกซเรย์ จนถึงหลังเริ่มยา 2 สัปดาห์</li>
              </ul>
            </div>
          </div>

          {/* Criteria Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Household Contacts */}
            <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-950">
                      1. กลุ่มผู้สัมผัสร่วมบ้าน
                    </h3>
                    <div className="text-[11px] text-emerald-700 font-bold">Household Contacts</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>บุคคลที่<strong>อาศัยอยู่ใต้ชายคาเดียวกัน</strong>กับผู้ป่วยในช่วงเวลาแพร่เชื้อ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span><strong>นอนในห้องเดียวกัน</strong> (Household Intimate Contact) ซึ่งมีความเสี่ยงติดเชื้อสูงสุด</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>รับประทานอาหารร่วมกัน หรือใช้พื้นที่ปิดร่วมกันเป็นประจำ (ระยะเวลาสะสม <strong>&ge; 8 ชั่วโมง/วัน</strong> หรือค้างคืนด้วยกันตั้งแต่ 1 คืนขึ้นไป)</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 bg-white/90 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-semibold">
                  ⚠️ <strong>ระดับความเสี่ยง:</strong> สูงมาก (ต้องติดตามคัดกรอง 100% ตามเป้าหมาย NTIP)
                </div>
              </div>

              {onSelectType && (
                <button
                  onClick={() => {
                    onSelectType('household');
                    onClose();
                  }}
                  className="mt-4 w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  เลือกกลุ่มร่วมบ้าน (Household)
                </button>
              )}
            </div>

            {/* 2. Non-household Contacts */}
            <div className="bg-blue-50/70 border-2 border-blue-300 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-700 text-white flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-blue-950">
                      2. กลุ่มผู้สัมผัสนอกบ้าน / สัมผัสใกล้ชิด
                    </h3>
                    <div className="text-[11px] text-blue-700 font-bold">Non-household / Close Contacts</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>บุคคลที่ไม่ได้อาศัยในบ้านเดียวกัน แต่ทำกิจกรรมร่วมกับผู้ป่วยในสถานที่ปิด/ระบายอากาศไม่ดี เช่น ห้องทำงาน, ห้องเรียน, ยานพาหนะ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>เกณฑ์ระยะเวลาสัมผัสสะสม (Cumulative Time):</strong>
                      <ul className="list-disc list-inside pl-1 text-[11px] text-slate-600 space-y-0.5 mt-0.5">
                        <li><strong>&ge; 40 ชั่วโมง:</strong> หากผู้ป่วย Smear Positive หรือ CXR มี Cavity</li>
                        <li><strong>&ge; 120 ชั่วโมง:</strong> หากผู้ป่วย Smear Negative</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>กลุ่มที่มีภูมิคุ้มกันบกพร่อง (HIV, ได้รับยากดภูมิ) แม้สัมผัสเวลาสั้นกว่า</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 bg-white/90 rounded-xl border border-blue-200 text-[11px] text-blue-900 font-semibold">
                  ⚠️ <strong>ระดับความเสี่ยง:</strong> ปานกลางถึงสูง (คัดกรองเฉพาะผู้สัมผัสใกล้ชิดและกลุ่มเปราะบาง)
                </div>
              </div>

              {onSelectType && (
                <button
                  onClick={() => {
                    onSelectType('non_household');
                    onClose();
                  }}
                  className="mt-4 w-full py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  เลือกกลุ่มนอกบ้าน (Non-household)
                </button>
              )}
            </div>
          </div>

          {/* Follow-up Protocol Guidance Summary (2566 Guideline) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-teal-700" />
              แนวทางการตรวจคัดกรองและการติดตามผู้สัมผัส (ตามแนวทางกระทรวงสาธารณสุข 2566):
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="font-bold text-teal-900 text-xs mb-1.5 flex items-center justify-between">
                  <span>👤 กลุ่มอายุมากกว่า 5 ปี (&gt; 5 ปี)</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">CXR 4 ครั้ง</span>
                </div>
                <div className="text-slate-600 leading-relaxed text-[11px] space-y-1">
                  <div>• ซักประวัติอาการสงสัยวัณโรคทุกครั้ง</div>
                  <div>• เอกซเรย์ทรวงอก (CXR) รวม <strong>4 ครั้ง</strong> ทุก 6 เดือน:</div>
                  <div className="pl-3 font-mono font-medium text-slate-700 text-[10px] space-y-0.5">
                    <div>1. ครั้งที่ 1: แรกรับ (เดือนที่ 0)</div>
                    <div>2. ครั้งที่ 2: เดือนที่ 6</div>
                    <div>3. ครั้งที่ 3: เดือนที่ 12</div>
                    <div>4. ครั้งที่ 4: เดือนที่ 18</div>
                  </div>
                  <div>• หากมีอาการสงสัยหรือ CXR ผิดปกติ ให้ส่งตรวจเสมหะ (AFB/GeneXpert) ทันที</div>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="font-bold text-purple-900 text-xs mb-1.5 flex items-center justify-between">
                  <span>👶 เด็กอายุ &le; 5 ปี และกลุ่มภูมิคุ้มกันต่ำ</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">IGRA / TPT</span>
                </div>
                <div className="text-slate-600 leading-relaxed text-[11px] space-y-1">
                  <div>• ซักประวัติอาการและทำ CXR แรกรับทันที</div>
                  <div>• ตรวจวินิจฉัยการติดเชื้อวัณโรคระยะแฝง: <strong>IGRA</strong> (หรือ TST)</div>
                  <div>• ประเมินให้การรักษาการติดเชื้อวัณโรคระยะแฝง (TPT: 3HP, 1HP หรือ 6H) หลังตัดประเด็น Active TB</div>
                  <div>• ติดตามอาการและตรวจติดตามต่อเนื่องทุก 1-3 เดือน</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200/80 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 font-medium">
            แนวทางการสอบสวนและควบคุมวัณโรค ปี พ.ศ. 2566
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-2xs"
          >
            รับทราบและปิด
          </button>
        </div>
      </div>
    </div>
  );
};

