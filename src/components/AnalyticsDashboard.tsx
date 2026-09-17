import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Activity, 
  Pill, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  Heart, 
  FileSpreadsheet,
  Calendar,
  Users,
  HeartHandshake,
  UserCheck,
  Shield,
  ArrowRight
} from 'lucide-react';
import { Patient, DailyLog, ContactPerson, ContactFollowUp } from '../types';

interface Props {
  patients: Patient[];
  logs: DailyLog[];
  contacts?: ContactPerson[];
  followUps?: ContactFollowUp[];
  onNavigateTab?: (tab: 'patients' | 'contacts') => void;
}

export const AnalyticsDashboard: React.FC<Props> = ({ 
  patients, 
  logs, 
  contacts = [], 
  followUps = [],
  onNavigateTab 
}) => {
  const activePatients = patients.filter(p => p.status === 'active');
  const completedPatients = patients.filter(p => p.status === 'completed');

  // Contact tracing statistics
  const householdContacts = contacts.filter(c => c.contactType === 'household');
  const nonHouseholdContacts = contacts.filter(c => c.contactType === 'non_household');
  const under5Contacts = contacts.filter(c => c.age <= 5 || c.highRiskFactors?.under5YearsOld);
  const ntipRegistered = contacts.filter(c => c.ntipStatus === 'entered');
  const cxrDone = contacts.filter(c => c.cxrStatus === 'normal' || c.cxrStatus === 'abnormal_active_tb' || c.cxrStatus === 'abnormal_other');
  const onTpt = contacts.filter(c => c.tptStatus === 'on_treatment' || c.tptStatus === 'completed');

  // Adherence by last 7 days
  const last7Days: { date: string; displayDate: string; taken: number; missed: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const displayDate = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' });

    const dayLogs = logs.filter(l => l.date === dateStr);
    const taken = dayLogs.filter(l => l.takenMedication).length;
    const missed = dayLogs.filter(l => !l.takenMedication).length;

    last7Days.push({
      date: dateStr,
      displayDate,
      taken,
      missed,
    });
  }

  // Symptom frequencies
  const symptomCounts: { name: string; count: number }[] = [
    { name: 'ไอ/ไอเรื้อรัง', count: logs.filter(l => l.symptoms.cough).length },
    { name: 'ไข้/ตัวร้อน', count: logs.filter(l => l.symptoms.fever).length },
    { name: 'อ่อนเพลีย', count: logs.filter(l => l.symptoms.fatigue).length },
    { name: 'คลื่นไส้อาเจียน', count: logs.filter(l => l.symptoms.nauseaVomiting).length },
    { name: 'ผื่นคัน', count: logs.filter(l => l.symptoms.rashItch).length },
    { name: 'ปวดข้อ/กล้ามเนื้อ', count: logs.filter(l => l.symptoms.jointPain).length },
    { name: 'ตาเหลืองตัวเหลือง (ตับ)', count: logs.filter(l => l.symptoms.yellowSkinEyes).length },
    { name: 'ไอเป็นเลือด', count: logs.filter(l => l.symptoms.coughBlood).length },
    { name: 'ตามัว/สีเพี้ยน', count: logs.filter(l => l.symptoms.visionChanges).length },
  ].filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  // Regimen distribution
  const regimenMap: Record<string, number> = {};
  patients.forEach(p => {
    const reg = p.treatmentRegimen || '2HRZE/4HR';
    regimenMap[reg] = (regimenMap[reg] || 0) + 1;
  });

  const regimenData = Object.entries(regimenMap).map(([name, value]) => ({ name, value }));
  const COLORS = ['#059669', '#0d9488', '#0284c7', '#f59e0b', '#e11d48'];

  // Overall adherence percentage
  const totalLogs = logs.length;
  const totalTaken = logs.filter(l => l.takenMedication).length;
  const overallRate = totalLogs > 0 ? Math.round((totalTaken / totalLogs) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top High-level indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">อัตราความร่วมมือการทานยาเฉลี่ย</div>
            <div className="text-2xl font-black text-slate-800">{overallRate}%</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">เกณฑ์มาตรฐานสากล WHO ≥ 90%</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 text-teal-800 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">บันทึกอาการทั้งหมด</div>
            <div className="text-2xl font-black text-slate-800">{logs.length} <span className="text-xs font-normal text-slate-500">ครั้ง</span></div>
            <div className="text-[11px] text-teal-700 mt-0.5">จัดเก็บใน Google Sheet ปลอดภัย</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">ผู้ป่วยที่รักษาหาย/ครบกำหนด</div>
            <div className="text-2xl font-black text-slate-800">{completedPatients.length} <span className="text-xs font-normal text-slate-500">คน</span></div>
            <div className="text-[11px] text-blue-700 mt-0.5">ความสำเร็จการรักษาวัณโรค</div>
          </div>
        </div>
      </div>

      {/* Contact Tracing & High-Risk Group Overview */}
      <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/30">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>การติดตามกลุ่มเสี่ยงและผู้สัมผัสโรค (Contact Tracing Overview)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-200 border border-teal-400/30 font-normal">
                  ตามเกณฑ์ DDC & n-tip
                </span>
              </h3>
              <p className="text-xs text-teal-200/80">
                สรุปผลการค้นหา คัดกรองอาการ เอกซเรย์ปอด (CXR) และการให้ยาป้องกันวัณโรค (TPT)
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('contacts')}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>ไปที่แถบการติดตามกลุ่มเสี่ยง</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-teal-200 font-medium">ผู้สัมผัสทั้งหมด</div>
            <div className="text-2xl font-black text-white mt-1">
              {contacts.length} <span className="text-xs font-normal text-teal-300">คน</span>
            </div>
            <div className="text-[11px] text-teal-300/80 mt-1">
              ร่วมบ้าน {householdContacts.length} / นอกบ้าน {nonHouseholdContacts.length}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-amber-200 font-medium">เด็กอายุ ≤ 5 ปี</div>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {under5Contacts.length} <span className="text-xs font-normal text-amber-200/80">คน</span>
            </div>
            <div className="text-[11px] text-amber-200/80 mt-1">
              กลุ่มเสี่ยงสูงสุด (ต้องตรวจ TPT)
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-teal-200 font-medium">ตรวจ CXR แล้ว</div>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {cxrDone.length} <span className="text-xs font-normal text-teal-300">คน</span>
            </div>
            <div className="text-[11px] text-teal-300/80 mt-1">
              {contacts.length > 0 ? `${Math.round((cxrDone.length / contacts.length) * 100)}% ของผู้สัมผัส` : '0%'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-teal-200 font-medium">ได้รับยาป้องกัน (TPT)</div>
            <div className="text-2xl font-black text-cyan-300 mt-1">
              {onTpt.length} <span className="text-xs font-normal text-cyan-200/80">คน</span>
            </div>
            <div className="text-[11px] text-cyan-200/80 mt-1">
              สูตร 3HP / 1HP ป้องกันป่วย
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-xs text-teal-200 font-medium">ขึ้นทะเบียน n-tip</div>
            <div className="text-2xl font-black text-teal-200 mt-1">
              {ntipRegistered.length} <span className="text-xs font-normal text-teal-300">คน</span>
            </div>
            <div className="text-[11px] text-teal-300/80 mt-1">
              {contacts.length > 0 ? `${Math.round((ntipRegistered.length / contacts.length) * 100)}% ครบถ้วน` : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Adherence Trend */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            แนวโน้มการทานยา 7 วันล่าสุด (DOTS Adherence)
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            จำนวนผู้ป่วยที่ทานยาครบตรงเวลาเปรียบเทียบกับผู้ที่ขาดทานยา
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${val} คน`,
                    name === 'taken' ? 'ทานยาแล้ว' : 'ขาดทานยา'
                  ]}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="taken" name="taken" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="missed" name="missed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Symptoms & Adverse Events Monitoring */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            ความถี่อาการและผลข้างเคียงที่ตรวจพบ (Symptom Monitoring)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            ช่วยเฝ้าระวังผลข้างเคียงจากสูตรยาวัณโรค เช่น พิษต่อตับ (Hepatotoxicity) หรือเส้นประสาท
          </p>

          {symptomCounts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
              <p className="text-xs">ยังไม่พบรายงานอาการข้างเคียงรุนแรง</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {symptomCounts.slice(0, 6).map((item, idx) => {
                const isRed = item.name.includes('ตับ') || item.name.includes('เลือด') || item.name.includes('ตามัว');
                const maxCount = symptomCounts[0]?.count || 1;
                const pct = Math.round((item.count / maxCount) * 100);

                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`font-medium ${isRed ? 'text-rose-700 font-bold' : 'text-slate-700'}`}>
                        {item.name}
                      </span>
                      <span className="text-slate-500 font-semibold">{item.count} ครั้ง</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${isRed ? 'bg-rose-500' : 'bg-teal-500'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
