import React, { useState } from 'react';
import { 
  Users, 
  Home, 
  Building, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  FileKey, 
  Calendar, 
  Stethoscope, 
  AlertTriangle, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  ShieldCheck,
  Edit2,
  Table as TableIcon,
  LayoutGrid,
  UserCheck,
  FileSpreadsheet,
  Printer,
  Download,
  Send
} from 'lucide-react';
import { ContactPerson, ContactFollowUp, Patient, UserProfile } from '../types';
import { ContactCriteriaModal } from './ContactCriteriaModal';
import { SendCxrEmailModal } from './SendCxrEmailModal';
import { ExportTablePdfModal } from './ExportTablePdfModal';
import { exportContactsToExcel } from '../lib/exportUtils';

interface Props {
  contacts: ContactPerson[];
  followUps: ContactFollowUp[];
  patients: Patient[];
  currentUserProfile?: UserProfile | null;
  onOpenNewContact: (patient?: Patient, defaultType?: 'household' | 'non_household') => void;
  onEditContact: (contact: ContactPerson) => void;
  onOpenFollowUpModal: (contact: ContactPerson, defaultStep?: ContactFollowUp['stepType']) => void;
  spreadsheetUrl?: string | null;
}

export const ContactsView: React.FC<Props> = ({
  contacts,
  followUps,
  patients,
  currentUserProfile,
  onOpenNewContact,
  onEditContact,
  onOpenFollowUpModal,
  spreadsheetUrl,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'household' | 'non_household'>('all');
  const [ageFilter, setAgeFilter] = useState<'all' | 'over5' | 'under5'>('all');
  const [ntipFilter, setNtipFilter] = useState<'all' | 'entered' | 'not_entered'>('all');
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [selectedContactForHistory, setSelectedContactForHistory] = useState<ContactPerson | null>(null);
  const [emailModalContact, setEmailModalContact] = useState<ContactPerson | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Helper for formatting date
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Statistics
  const householdCount = contacts.filter(c => c.contactType === 'household').length;
  const nonHouseholdCount = contacts.filter(c => c.contactType === 'non_household').length;
  const over5Count = contacts.filter(c => c.age > 5).length;
  const under5Count = contacts.filter(c => c.age <= 5).length;
  const ntipEnteredCount = contacts.filter(c => c.ntipStatus === 'entered').length;

  // Filtered contacts
  const filteredContacts = contacts.filter(c => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchHN = c.hn.toLowerCase().includes(q);
      const matchIndexHN = c.indexPatientHN.toLowerCase().includes(q);
      const matchIndexName = c.indexPatientName.toLowerCase().includes(q);
      const matchNtip = (c.ntipKeyCode || '').toLowerCase().includes(q);
      const matchUpdatedBy = (c.lastUpdatedBy || '').toLowerCase().includes(q);
      if (!matchName && !matchHN && !matchIndexHN && !matchIndexName && !matchNtip && !matchUpdatedBy) return false;
    }

    // Type
    if (typeFilter !== 'all' && c.contactType !== typeFilter) return false;

    // Age
    if (ageFilter === 'over5' && c.age <= 5) return false;
    if (ageFilter === 'under5' && c.age > 5) return false;

    // NTIP
    if (ntipFilter !== 'all' && c.ntipStatus !== ntipFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ผู้สัมผัสโรคทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{contacts.length} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">คัดกรองตามเกณฑ์ NTIP</div>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">กลุ่มร่วมบ้าน (Household)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">{householdCount} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">กลุ่มเสี่ยงสูงที่สุด</div>
        </div>

        <div className="bg-white border border-blue-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">กลุ่มนอกบ้าน (Non-household)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">{nonHouseholdCount} <span className="text-xs font-normal text-slate-500">คน</span></div>
          <div className="text-[11px] text-blue-700 font-medium mt-1">ที่ทำงาน/โรงเรียน/ชุมชน</div>
        </div>

        <div className="bg-white border border-purple-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800">คีย์ใน n-tip แล้ว</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <FileKey className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 mt-2">{ntipEnteredCount} <span className="text-xs font-normal text-slate-500">/ {contacts.length}</span></div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">
            {contacts.length > 0 ? `${Math.round((ntipEnteredCount / contacts.length) * 100)}% บันทึกแล้ว` : '100%'}
          </div>
        </div>
      </div>

      {/* Protocol Explanation Card */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Department of Disease Control (DDC) Protocols
            </span>
            <span className="text-xs text-teal-200">เกณฑ์การติดตามผู้สัมผัส</span>
          </div>
          <h3 className="text-base font-bold">
            แนวทางการคัดกรอง: อายุ &gt; 5 ปี ตรวจ CXR 4 ครั้ง ห่างกัน 6 เดือน • อายุ &le; 5 ปี ตรวจ IGRA/TPT
          </h3>
          <p className="text-xs text-teal-200/90 leading-relaxed max-w-3xl">
            ผู้สัมผัสวัณโรคทุกคนต้องได้รับการติดตามตรวจคัดกรองอย่างเป็นระบบ พร้อมทั้งบันทึกข้อมูลเข้าโปรแกรม NTIP และระบุรหัสประจำตัวผู้สัมผัสใน n-tip
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCriteriaModal(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-teal-200" />
            ดูเกณฑ์การแยกผู้สัมผัส
          </button>

          <button
            onClick={() => onOpenNewContact()}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            เพิ่มผู้สัมผัสใหม่
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อ, HN ผู้สัมผัส, HN ผู้ป่วยดัชนี, ผู้แก้ไขล่าสุด, หรือรหัส n-tip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${typeFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setTypeFilter('household')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${typeFilter === 'household' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600'}`}
              >
                ร่วมบ้าน ({householdCount})
              </button>
              <button
                onClick={() => setTypeFilter('non_household')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${typeFilter === 'non_household' ? 'bg-blue-700 text-white shadow-2xs' : 'text-slate-600'}`}
              >
                นอกบ้าน ({nonHouseholdCount})
              </button>
            </div>

            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="all">ทุกเกณฑ์อายุ</option>
              <option value="over5">อายุ &gt; 5 ปี (CXR 4 ครั้ง)</option>
              <option value="under5">อายุ &le; 5 ปี (IGRA / TPT)</option>
            </select>

            <select
              value={ntipFilter}
              onChange={(e) => setNtipFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="all">สถานะ n-tip ทั้งหมด</option>
              <option value="entered">คีย์ใน n-tip แล้ว</option>
              <option value="not_entered">ยังไม่ได้คีย์ n-tip</option>
            </select>

            {/* View Switcher & Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportContactsToExcel(filteredContacts, followUps)}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="ดาวน์โหลดรายชื่อกลุ่มสัมผัส/กลุ่มเสี่ยงเป็นไฟล์ Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">ดาวน์โหลด Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>

              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="พิมพ์หรือดาวน์โหลดรายงาน PDF สรุปกลุ่มสัมผัส"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">พิมพ์ / PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="มุมมองตาราง (Table View) พร้อมคอลัมน์ผู้แก้ไขล่าสุด"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>ตาราง</span>
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'cards' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="มุมมองการ์ด (Card View)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>การ์ด</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts List Content */}
      {filteredContacts.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">ไม่พบรายชื่อผู้สัมผัสตามเงื่อนไข</h3>
          <p className="text-xs text-slate-400 mt-1">สามารถเพิ่มรายชื่อผู้สัมผัสโรคได้จากแบบฟอร์มการสอบสวนโรคหรือปุ่มเพิ่มด้านบน</p>
          <button
            onClick={() => onOpenNewContact()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            เพิ่มผู้สัมผัสโรค
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ------------------ TABLE VIEW (With 'แก้ไขล่าสุดโดย' column) ------------------ */
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">กลุ่ม / HN ผู้สัมผัส</th>
                  <th className="py-3 px-4">ชื่อ-นามสกุล / ข้อมูล</th>
                  <th className="py-3 px-4">ผู้ป่วยดัชนี (Index Patient)</th>
                  <th className="py-3 px-4">เกณฑ์การตรวจติดตาม (Protocol)</th>
                  <th className="py-3 px-4">สถานะ n-tip</th>
                  <th className="py-3 px-4 bg-teal-50/60 text-teal-900 border-x border-teal-100/80">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                      <span>แก้ไขล่าสุดโดย</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredContacts.map(contact => {
                  const isHousehold = contact.contactType === 'household';
                  const isOver5 = contact.age > 5;
                  const contactFollowUps = followUps.filter(f => f.contactId === contact.id);

                  return (
                    <tr key={contact.id} className="hover:bg-teal-50/20 transition group">
                      {/* Contact Type & HN */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          isHousehold ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isHousehold ? 'ร่วมบ้าน' : 'นอกบ้าน'}
                        </span>
                        <div className="font-mono font-bold text-slate-700 mt-1">
                          {contact.hn || '-'}
                        </div>
                      </td>

                      {/* Name & Basic info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                          {contact.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {contact.age} ปี ({contact.gender === 'female' ? 'หญิง' : contact.gender === 'male' ? 'ชาย' : 'อื่นๆ'}) • {contact.relationship}
                        </div>
                        {contact.phone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            โทร: {contact.phone}
                          </div>
                        )}
                      </td>

                      {/* Index Patient */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[180px]" title={contact.indexPatientName}>
                          {contact.indexPatientName}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-800 font-bold">
                          HN: {contact.indexPatientHN || '-'}
                        </div>
                      </td>

                      {/* Protocol / Follow-up status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-slate-800 block">
                          {isOver5 ? 'อายุ > 5 ปี (CXR 4 ครั้ง)' : 'อายุ ≤ 5 ปี (IGRA / TPT)'}
                        </span>
                        
                        {/* CXR Status & Result badge */}
                        {contact.cxrResult ? (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${
                              contact.cxrResult === 'normal'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : contact.cxrResult === 'abnormal_suspect_tb'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                                : contact.cxrResult === 'abnormal_other'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              CXR: {contact.cxrResult === 'normal' ? 'ปกติ' :
                                    contact.cxrResult === 'abnormal_suspect_tb' ? 'สงสัยวัณโรค' :
                                    contact.cxrResult === 'abnormal_other' ? 'ผิดปกติอื่นๆ' : 'รอผล'}
                            </span>
                            {contact.cxrDate && (
                              <span className="text-[10px] text-slate-400">({contact.cxrDate})</span>
                            )}
                          </div>
                        ) : null}

                        {contact.nextCxrDate && (
                          <div className="text-[10px] text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-teal-600" />
                            <span>นัดครั้งถัดไป: {contact.nextCxrDate}</span>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500 mt-0.5">
                          บันทึกตรวจแล้ว: <strong className="text-teal-700">{contactFollowUps.length}</strong> ครั้ง
                        </div>
                      </td>

                      {/* n-tip Status */}
                      <td className="py-3 px-4 max-w-[180px]">
                        {contact.ntipStatus === 'entered' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200">
                              <CheckCircle2 className="w-3 h-3 text-purple-700" />
                              {contact.ntipKeyCode ? `รหัส ${contact.ntipKeyCode}` : 'คีย์แล้ว'}
                            </span>
                            {contact.ntipNotes && (
                              <div className="text-[10px] text-purple-900 bg-purple-50/80 p-1 rounded-md border border-purple-100 mt-1 line-clamp-2" title={contact.ntipNotes}>
                                <strong>หมายเหตุ:</strong> {contact.ntipNotes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg inline-block">
                              ยังไม่ได้คีย์
                            </span>
                            {contact.ntipNotes && (
                              <div className="text-[10px] text-slate-500 mt-1 truncate" title={contact.ntipNotes}>
                                {contact.ntipNotes}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* แก้ไขล่าสุดโดย (Audit column) */}
                      <td className="py-3 px-4 whitespace-nowrap bg-teal-50/30 border-x border-teal-100/60">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                            {contact.lastUpdatedBy ? contact.lastUpdatedBy.charAt(0) : '—'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 truncate max-w-[140px]" title={contact.lastUpdatedBy || 'เจ้าหน้าที่'}>
                              {contact.lastUpdatedBy || 'เจ้าหน้าที่ (ระบบ)'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {formatDateTime(contact.updatedAt || contact.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEmailModalContact(contact)}
                            className="p-1.5 text-teal-700 hover:text-white hover:bg-teal-700 bg-teal-50 border border-teal-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="ส่งผลตรวจเอกซเรย์ (CXR) ทางอีเมล"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">ส่งอีเมล</span>
                          </button>
                          <button
                            onClick={() => onOpenFollowUpModal(contact)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg transition cursor-pointer"
                            title="บันทึกผลตรวจ / CXR"
                          >
                            + ผลตรวจ
                          </button>
                          <button
                            onClick={() => onEditContact(contact)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedContactForHistory(contact)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="ดูประวัติการตรวจ"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ------------------ CARD VIEW ------------------ */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContacts.map(contact => {
            const isHousehold = contact.contactType === 'household';
            const isOver5 = contact.age > 5;
            const contactFollowUps = followUps.filter(f => f.contactId === contact.id);

            return (
              <div
                key={contact.id}
                className={`bg-white border rounded-3xl p-5 shadow-2xs hover:shadow-md transition space-y-4 ${
                  isHousehold ? 'border-emerald-200/80' : 'border-blue-200/80'
                }`}
              >
                {/* Header & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isHousehold ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isHousehold ? <Home className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{contact.fullName}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isHousehold ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isHousehold ? 'ร่วมบ้าน' : 'นอกบ้าน'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        HN: <span className="font-bold text-slate-700">{contact.hn || '-'}</span> • {contact.gender === 'female' ? 'หญิง' : contact.gender === 'male' ? 'ชาย' : 'อื่นๆ'} • อายุ <strong>{contact.age} ปี</strong> ({contact.relationship})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEmailModalContact(contact)}
                      className="p-2 text-teal-700 hover:text-white hover:bg-teal-700 bg-teal-50 border border-teal-200 rounded-xl transition cursor-pointer"
                      title="ส่งผลตรวจเอกซเรย์ (CXR) ทางอีเมล"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditContact(contact)}
                      className="p-2 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      title="แก้ไขข้อมูล"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Patient Association & Contacts */}
                <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1.5 border border-slate-100">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>ผู้ป่วยดัชนี (Index):</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {contact.indexPatientName} (HN: {contact.indexPatientHN || '-'})
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>สิทธิการรักษา:</span>
                    <span className="font-semibold text-slate-800">{contact.treatmentRights}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> เบอร์:</span>
                    <a href={`tel:${contact.phone}`} className="font-medium text-teal-800 hover:underline">
                      {contact.phone || '-'}
                    </a>
                  </div>
                </div>

                {/* Follow-up Protocol & 4-Interval Tracker / IGRA */}
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                      {isOver5 ? 'เกณฑ์อายุ > 5 ปี (CXR 4 ครั้ง / ทุก 6 เดือน)' : 'เกณฑ์อายุ ≤ 5 ปี (ตรวจ IGRA / ให้ยา TPT)'}
                    </span>
                    <button
                      onClick={() => onOpenFollowUpModal(contact)}
                      className="text-[10px] bg-teal-700 hover:bg-teal-800 text-white font-bold px-2 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                    >
                      + บันทึกผลตรวจ
                    </button>
                  </div>

                  {/* Intervals Grid */}
                  {isOver5 ? (
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { step: 'cxr_1_0m', label: 'CXR 1', sub: '0 เดือน' },
                        { step: 'cxr_2_6m', label: 'CXR 2', sub: '6 เดือน' },
                        { step: 'cxr_3_12m', label: 'CXR 3', sub: '12 เดือน' },
                        { step: 'cxr_4_18m', label: 'CXR 4', sub: '18 เดือน' },
                      ].map((item, idx) => {
                        const fu = contactFollowUps.find(f => f.stepType === item.step);
                        const isDone = fu && fu.status === 'completed';

                        return (
                          <div
                            key={idx}
                            onClick={() => onOpenFollowUpModal(contact, item.step as any)}
                            className={`p-1.5 rounded-xl border text-center cursor-pointer transition ${
                              isDone
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-500'
                            }`}
                          >
                            <div className="text-[10px] font-bold">{item.label}</div>
                            <div className="text-[9px] text-slate-400">{item.sub}</div>
                            <div className="mt-1">
                              {isDone ? (
                                <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded font-bold">
                                  ตรวจแล้ว
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400">รอนัด</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {[
                        { step: 'igra_test', label: 'ตรวจ IGRA/TST', sub: 'หาการติดเชื้อ' },
                        { step: 'tpt_assessment', label: 'ยาป้องกัน TPT', sub: '3HP/1HP/6H' },
                        { step: 'cxr_1_0m', label: 'CXR แรกรับ', sub: 'ฟิล์มปอดเด็ก' },
                      ].map((item, idx) => {
                        const fu = contactFollowUps.find(f => f.stepType === item.step);
                        const isDone = fu && fu.status === 'completed';

                        return (
                          <div
                            key={idx}
                            onClick={() => onOpenFollowUpModal(contact, item.step as any)}
                            className={`p-1.5 rounded-xl border text-center cursor-pointer transition ${
                              isDone
                                ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-500'
                            }`}
                          >
                            <div className="text-[10px] font-bold truncate">{item.label}</div>
                            <div className="text-[9px] text-slate-400">{item.sub}</div>
                            <div className="mt-1">
                              {isDone ? (
                                <span className="text-[9px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-bold">
                                  เรียบร้อย
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400">รอนัด</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CXR Tracking Summary Box if any CXR data exists */}
                {(contact.cxrResult || contact.nextCxrDate || contact.cxrHospital) && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                        ผล CXR ล่าสุด:
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        contact.cxrResult === 'normal'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : contact.cxrResult === 'abnormal_suspect_tb'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {contact.cxrResult === 'normal' ? 'ปกติ (Normal)' :
                         contact.cxrResult === 'abnormal_suspect_tb' ? 'ผิดปกติ สงสัยวัณโรค' :
                         contact.cxrResult === 'abnormal_other' ? 'ผิดปกติอื่นๆ' : 'รอตรวจ'}
                      </span>
                    </div>
                    {contact.cxrResultDetail && (
                      <p className="text-[11px] text-emerald-900 italic">
                        "{contact.cxrResultDetail}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-emerald-800/80 pt-0.5">
                      <span>สถานพยาบาล: {contact.cxrHospital || 'รพ.มหาวิทยาลัยอุบลราชธานี'}</span>
                      {contact.nextCxrDate && (
                        <span className="font-bold text-teal-800">นัดถัดไป: {contact.nextCxrDate}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Audit Metadata Badge */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 truncate max-w-[170px]" title={contact.lastUpdatedBy || 'เจ้าหน้าที่'}>
                    <UserCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                    <span className="truncate">แก้ไขโดย: <strong>{contact.lastUpdatedBy || 'เจ้าหน้าที่'}</strong></span>
                  </span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {formatDateTime(contact.updatedAt || contact.createdAt)}
                  </span>
                </div>

                {/* NTIP Code Footer Badge with Notes */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileKey className="w-3.5 h-3.5 text-purple-700" />
                      <span className="text-slate-500 text-[11px]">การคีย์ใน n-tip:</span>
                      {contact.ntipStatus === 'entered' ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200">
                          <CheckCircle2 className="w-3 h-3 text-purple-700" />
                          รหัส {contact.ntipKeyCode || 'คีย์แล้ว'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                          ยังไม่ได้คีย์
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedContactForHistory(contact)}
                      className="text-teal-700 hover:text-teal-900 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      ประวัติตรวจ ({contactFollowUps.length})
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {contact.ntipNotes && (
                    <div className="p-2 bg-purple-50/70 border border-purple-100 rounded-xl text-[11px] text-purple-950 flex items-start gap-1.5">
                      <strong className="flex-shrink-0 text-purple-800">หมายเหตุ n-tip:</strong>
                      <span>{contact.ntipNotes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Follow-up History Modal */}
      {selectedContactForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  ประวัติการติดตามและผลตรวจ: {selectedContactForHistory.fullName}
                </h3>
                <p className="text-xs text-slate-400">
                  HN: {selectedContactForHistory.hn} • อายุ {selectedContactForHistory.age} ปี • {selectedContactForHistory.contactType === 'household' ? 'กลุ่มร่วมบ้าน' : 'กลุ่มนอกบ้าน'}
                </p>
              </div>
              <button
                onClick={() => setSelectedContactForHistory(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {followUps.filter(f => f.contactId === selectedContactForHistory.id).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ยังไม่มีบันทึกผลการติดตามตรวจ
                </div>
              ) : (
                <div className="space-y-3">
                  {followUps
                    .filter(f => f.contactId === selectedContactForHistory.id)
                    .map((fu, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {fu.stepType === 'cxr_1_0m' ? 'CXR ครั้งที่ 1 (0 เดือน/แรกรับ)' :
                             fu.stepType === 'cxr_2_6m' ? 'CXR ครั้งที่ 2 (6 เดือน)' :
                             fu.stepType === 'cxr_3_12m' ? 'CXR ครั้งที่ 3 (12 เดือน)' :
                             fu.stepType === 'cxr_4_18m' ? 'CXR ครั้งที่ 4 (18 เดือน)' :
                             fu.stepType === 'igra_test' ? 'ตรวจ IGRA / TST' :
                             fu.stepType === 'tpt_assessment' ? 'ประเมินรับยาป้องกัน TPT' : 'ติดตามอาการ'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            fu.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {fu.status === 'completed' ? 'ตรวจแล้ว' : 'รอนัด'}
                          </span>
                        </div>

                        <div className="text-slate-600">
                          วันที่นัด: <strong>{fu.scheduledDate}</strong> {fu.actualDate && `• ตรวจจริง: ${fu.actualDate}`}
                        </div>

                        {fu.testResult && (
                          <div className="text-slate-800 font-medium">
                            ผลตรวจ: <span className="text-emerald-700 font-bold">{fu.testResult}</span> ({fu.resultDetail || 'ไม่มีระบุ'})
                          </div>
                        )}

                        {fu.tptRegimen && fu.tptRegimen !== 'none' && (
                          <div className="text-purple-800 font-bold">
                            สูตรยาป้องกัน (TPT): {fu.tptRegimen}
                          </div>
                        )}

                        {fu.hospitalOrFacility && (
                          <div className="text-slate-500 text-[11px]">
                            สถานที่ตรวจ: {fu.hospitalOrFacility} (ผู้บันทึก: {fu.recordedBy})
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => {
                  const target = selectedContactForHistory;
                  setSelectedContactForHistory(null);
                  onOpenFollowUpModal(target);
                }}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition"
              >
                + เพิ่มบันทึกการตรวจรอบใหม่
              </button>

              <button
                onClick={() => setSelectedContactForHistory(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Criteria Modal */}
      <ContactCriteriaModal
        isOpen={showCriteriaModal}
        onClose={() => setShowCriteriaModal(false)}
        onSelectType={(type) => setTypeFilter(type)}
      />

      {/* Send CXR Email Modal */}
      <SendCxrEmailModal
        isOpen={Boolean(emailModalContact)}
        onClose={() => setEmailModalContact(null)}
        contact={emailModalContact}
        followUps={followUps}
        currentUserName={currentUserProfile?.name || 'เจ้าหน้าที่เวชกรรมสังคม'}
      />

      {/* PDF Export Modal */}
      <ExportTablePdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        reportType="contacts"
        contacts={filteredContacts}
        followUps={followUps}
        currentUser={currentUserProfile?.name || 'เจ้าหน้าที่เวชกรรมสังคม'}
      />
    </div>
  );
};
