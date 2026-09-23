import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  UploadCloud, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  Info,
  Check,
  Building,
  UserPlus
} from 'lucide-react';
import { Patient, ContactPerson, UserProfile } from '../types';
import { 
  getSpreadsheetDetails, 
  importPatientsFromSheetTab, 
  importContactsFromSheetTab,
  PatientImportPreviewItem,
  ContactImportPreviewItem,
  SheetMetadata,
  extractSpreadsheetId
} from '../lib/sheetImportService';
import { googleSignIn } from '../lib/auth';
import { formatThaiDate } from '../lib/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetName: string | null;
  onTokenUpdate?: (token: string) => void;
  existingPatients: Patient[];
  existingContacts: ContactPerson[];
  onImportPatients: (importedPatients: Patient[]) => Promise<void>;
  onImportContacts: (importedContacts: ContactPerson[]) => Promise<void>;
  defaultMode?: 'patient' | 'contact';
}

export const ImportGoogleSheetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  accessToken,
  spreadsheetId,
  spreadsheetUrl,
  spreadsheetName,
  onTokenUpdate,
  existingPatients,
  existingContacts,
  onImportPatients,
  onImportContacts,
  defaultMode = 'patient',
}) => {
  const [importType, setImportType] = useState<'patient' | 'contact'>(defaultMode);
  const [customSheetInput, setCustomSheetInput] = useState<string>('');
  const [activeSpreadsheetId, setActiveSpreadsheetId] = useState<string>(spreadsheetId || '');
  
  // Sheet Metadata
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('');
  
  // Preview Data
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [patientPreviews, setPatientPreviews] = useState<PatientImportPreviewItem[]>([]);
  const [contactPreviews, setContactPreviews] = useState<ContactImportPreviewItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [headersFound, setHeadersFound] = useState<string[]>([]);
  
  // Processing
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Search within preview
  const [previewSearch, setPreviewSearch] = useState('');

  // Synchronize default mode when opened
  useEffect(() => {
    if (isOpen) {
      setImportType(defaultMode);
      setErrorMsg(null);
      setSuccessMsg(null);
      if (spreadsheetId) {
        setActiveSpreadsheetId(spreadsheetId);
        loadMetadata(spreadsheetId);
      }
    }
  }, [isOpen, defaultMode, spreadsheetId]);

  const getEffectiveToken = async (): Promise<string> => {
    if (accessToken) return accessToken;
    const authRes = await googleSignIn();
    if (authRes?.accessToken) {
      if (onTokenUpdate) onTokenUpdate(authRes.accessToken);
      return authRes.accessToken;
    }
    throw new Error('ไม่พบสิทธิ์ Google OAuth กรุณาลงชื่อเข้าใช้ Google เพื่ออ่านข้อมูล');
  };

  const loadMetadata = async (targetId: string) => {
    const clean = extractSpreadsheetId(targetId);
    if (!clean) return;
    setIsFetchingMetadata(true);
    setErrorMsg(null);
    try {
      const token = await getEffectiveToken();
      const meta = await getSpreadsheetDetails(token, clean);
      setMetadata(meta);
      
      // Auto-select tab matching current import type
      if (meta.sheets.length > 0) {
        let bestTab = meta.sheets[0].title;
        if (importType === 'patient') {
          const found = meta.sheets.find(s => s.title.includes('ผู้ป่วย') || s.title.toLowerCase().includes('patient'));
          if (found) bestTab = found.title;
        } else {
          const found = meta.sheets.find(s => s.title.includes('ผู้สัมผัส') || s.title.includes('สัมผัส') || s.title.toLowerCase().includes('contact'));
          if (found) bestTab = found.title;
        }
        setSelectedTab(bestTab);
      }
    } catch (err: any) {
      console.error('Failed to load sheet metadata:', err);
      setErrorMsg(err.message || 'ไม่สามารถโหลดข้อมูลแท็บจาก Google Sheet นี้ได้');
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  // Load preview data when tab changes or load button pressed
  const handleLoadPreview = async (tabToLoad?: string) => {
    const tab = tabToLoad || selectedTab;
    if (!activeSpreadsheetId || !tab) return;
    setIsLoadingPreview(true);
    setErrorMsg(null);
    try {
      const token = await getEffectiveToken();
      if (importType === 'patient') {
        const res = await importPatientsFromSheetTab(token, activeSpreadsheetId, tab, existingPatients);
        setPatientPreviews(res.previewItems);
        setHeadersFound(res.headersFound);
        // By default select all
        setSelectedIndices(new Set(res.previewItems.map((_, i) => i)));
        if (res.previewItems.length === 0) {
          setErrorMsg(`ไม่พบแถวข้อมูลผู้ป่วยในแท็บ "${tab}" (หรือตารางว่างเปล่า)`);
        }
      } else {
        const res = await importContactsFromSheetTab(token, activeSpreadsheetId, tab, existingContacts, existingPatients);
        setContactPreviews(res.previewItems);
        setHeadersFound(res.headersFound);
        setSelectedIndices(new Set(res.previewItems.map((_, i) => i)));
        if (res.previewItems.length === 0) {
          setErrorMsg(`ไม่พบแถวข้อมูลผู้สัมผัสในแท็บ "${tab}" (หรือตารางว่างเปล่า)`);
        }
      }
    } catch (err: any) {
      console.error('Preview error:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอ่านแถวข้อมูล');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle Tab switch
  const handleTabChange = (newTab: string) => {
    setSelectedTab(newTab);
    handleLoadPreview(newTab);
  };

  // Switch type (Patient / Contact)
  const handleTypeChange = (newType: 'patient' | 'contact') => {
    setImportType(newType);
    setPatientPreviews([]);
    setContactPreviews([]);
    setSelectedIndices(new Set());
    setErrorMsg(null);

    // Auto-switch selected tab if available
    if (metadata && metadata.sheets.length > 0) {
      let bestTab = metadata.sheets[0].title;
      if (newType === 'patient') {
        const found = metadata.sheets.find(s => s.title.includes('ผู้ป่วย') || s.title.toLowerCase().includes('patient'));
        if (found) bestTab = found.title;
      } else {
        const found = metadata.sheets.find(s => s.title.includes('ผู้สัมผัส') || s.title.includes('สัมผัส') || s.title.toLowerCase().includes('contact'));
        if (found) bestTab = found.title;
      }
      setSelectedTab(bestTab);
    }
  };

  // Toggle selection
  const toggleSelectAll = () => {
    const listLength = importType === 'patient' ? patientPreviews.length : contactPreviews.length;
    if (selectedIndices.size === listLength) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(Array.from({ length: listLength }, (_, i) => i)));
    }
  };

  const toggleSelectOne = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  // Perform Final Import
  const handleConfirmImport = async () => {
    if (selectedIndices.size === 0) {
      setErrorMsg('กรุณาเลือกรายการที่ต้องการนำเข้าอย่างน้อย 1 รายการ');
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);
    try {
      if (importType === 'patient') {
        const toImport = patientPreviews
          .filter((_, idx) => selectedIndices.has(idx))
          .map(p => p.patient);
        await onImportPatients(toImport);
        setSuccessMsg(`นำเข้าข้อมูลผู้ป่วยสำเร็จทั้งหมด ${toImport.length} รายการ`);
      } else {
        const toImport = contactPreviews
          .filter((_, idx) => selectedIndices.has(idx))
          .map(c => c.contact);
        await onImportContacts(toImport);
        setSuccessMsg(`นำเข้าข้อมูลกลุ่มเสี่ยง/ผู้สัมผัสสำเร็จทั้งหมด ${toImport.length} รายการ`);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl flex items-center justify-center text-emerald-300 shadow-inner flex-shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  นำเข้าข้อมูลผู้ป่วยและกลุ่มเสี่ยงจาก Google Sheet
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline">
                  Google Sheets Import
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                เลือกไฟล์ Google Sheet และแท็บที่ต้องการ ระบบจะตรวจสอบหัวตาราง คัดกรองข้อมูล และนำเข้าสู่ระบบอัตโนมัติ
              </p>
            </div>
          </div>

          {/* Mode Switch: Patients or Contacts */}
          <div className="flex gap-2 mt-5 pt-3 border-t border-white/10">
            <button
              onClick={() => handleTypeChange('patient')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                importType === 'patient'
                  ? 'bg-white text-teal-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>1. นำเข้าข้อมูลผู้ป่วย (Patients)</span>
            </button>
            <button
              onClick={() => handleTypeChange('contact')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                importType === 'contact'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>2. นำเข้าข้อมูลกลุ่มเสี่ยง/ผู้สัมผัส (Contacts)</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5">
          
          {/* Step 1: Sheet & Tab Selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>แหล่งข้อมูล Google Sheet:</span>
              </span>

              {metadata && (
                <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold truncate max-w-xs">
                  {metadata.title}
                </span>
              )}
            </div>

            {/* Sheet Link / Change Input */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="วาง Google Sheet URL หรือ Spreadsheet ID อื่นๆ (หรือใช้ชีทปัจจุบัน)..."
                value={customSheetInput}
                onChange={(e) => setCustomSheetInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const target = customSheetInput.trim() || activeSpreadsheetId;
                  if (target) {
                    setActiveSpreadsheetId(target);
                    loadMetadata(target);
                  }
                }}
                disabled={isFetchingMetadata}
                className="w-full sm:w-auto px-4 py-2 bg-teal-800 hover:bg-teal-900 active:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                {isFetchingMetadata ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{isFetchingMetadata ? 'กำลังค้นหา...' : 'โหลดแท็บชีท'}</span>
              </button>
            </div>

            {/* Tab Selection Chips */}
            {metadata && metadata.sheets.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  เลือกแท็บ (Worksheet Tab) ที่ต้องการนำเข้า:
                </span>
                <div className="flex flex-wrap gap-2">
                  {metadata.sheets.map((tab) => {
                    const isSelected = selectedTab === tab.title;
                    return (
                      <button
                        key={tab.sheetId}
                        onClick={() => handleTabChange(tab.title)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <FileSpreadsheet className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`} />
                        <span>{tab.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Preview & Table Selection */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">
                  ตัวอย่างข้อมูลก่อนนำเข้า (
                  {importType === 'patient' ? patientPreviews.length : contactPreviews.length} รายการพบในชีท)
                </h4>
                {(patientPreviews.length > 0 || contactPreviews.length > 0) && (
                  <span className="text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 font-bold">
                    เลือก {selectedIndices.size} รายการ
                  </span>
                )}
              </div>

              {/* Action bar for table: Select All / Search */}
              {(patientPreviews.length > 0 || contactPreviews.length > 0) && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ค้นหาในตัวอย่าง..."
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-36 sm:w-48"
                    />
                  </div>
                  <button
                    onClick={toggleSelectAll}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    {selectedIndices.size === (importType === 'patient' ? patientPreviews.length : contactPreviews.length)
                      ? 'ยกเลิกเลือกทั้งหมด'
                      : 'เลือกทั้งหมด'}
                  </button>
                </div>
              )}
            </div>

            {/* Loading state */}
            {isLoadingPreview && (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600" />
                <p className="text-xs">กำลังอ่านข้อมูลจาก Google Sheet และจับคู่คอลัมน์...</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoadingPreview && patientPreviews.length === 0 && contactPreviews.length === 0 && (
              <div className="border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-2">
                <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  กรุณาเลือกแท็บชีทที่มีข้อมูล หรือกดปุ่ม <strong>"โหลดแท็บชีท"</strong> ด้านบนเพื่อดูตัวอย่าง
                </p>
                <button
                  onClick={() => handleLoadPreview()}
                  disabled={!selectedTab}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ดึงข้อมูลตัวอย่างจากแท็บ "{selectedTab || '...'}"</span>
                </button>
              </div>
            )}

            {/* PATIENTS PREVIEW TABLE */}
            {!isLoadingPreview && importType === 'patient' && patientPreviews.length > 0 && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIndices.size === patientPreviews.length && patientPreviews.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3">แถว</th>
                        <th className="py-2.5 px-3">HN</th>
                        <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                        <th className="py-2.5 px-3">อายุ/เพศ</th>
                        <th className="py-2.5 px-3">เบอร์ติดต่อ</th>
                        <th className="py-2.5 px-3">สูตรยา</th>
                        <th className="py-2.5 px-3">วันวินิจฉัย</th>
                        <th className="py-2.5 px-3">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientPreviews
                        .map((item, originalIdx) => ({ item, originalIdx }))
                        .filter(({ item }) => {
                          if (!previewSearch.trim()) return true;
                          const q = previewSearch.toLowerCase();
                          return (
                            item.patient.hn.toLowerCase().includes(q) ||
                            item.patient.fullName.toLowerCase().includes(q) ||
                            (item.patient.phone || '').includes(q)
                          );
                        })
                        .map(({ item, originalIdx }) => {
                          const isSelected = selectedIndices.has(originalIdx);
                          return (
                            <tr
                              key={item.patient.id || originalIdx}
                              onClick={() => toggleSelectOne(originalIdx)}
                              className={`cursor-pointer transition ${
                                isSelected ? 'bg-teal-50/50 hover:bg-teal-50' : 'hover:bg-slate-50 opacity-60'
                              }`}
                            >
                              <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(originalIdx)}
                                  className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 font-mono text-[10px] text-slate-400">
                                #{item.rowNumber}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                {item.patient.hn || '-'}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                <div>{item.patient.fullName}</div>
                                {item.patient.nationalId && (
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    CID: {item.patient.nationalId}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-700">
                                {item.patient.age} ปี ({item.patient.gender === 'female' ? 'หญิง' : item.patient.gender === 'other' ? 'อื่นๆ' : 'ชาย'})
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                                {item.patient.phone || '-'}
                              </td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-semibold text-[10px]">
                                  {item.patient.treatmentRegimen || '2HRZE/4HR'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {item.patient.diagnosisDate ? formatThaiDate(item.patient.diagnosisDate) : '-'}
                              </td>
                              <td className="py-2 px-3">
                                {item.isExisting ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                                    อัปเดตข้อมูลเดิม
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                    ผู้ป่วยใหม่
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CONTACTS PREVIEW TABLE */}
            {!isLoadingPreview && importType === 'contact' && contactPreviews.length > 0 && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIndices.size === contactPreviews.length && contactPreviews.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3">แถว</th>
                        <th className="py-2.5 px-3">HN/ชื่อผู้สัมผัส</th>
                        <th className="py-2.5 px-3">ผู้ป่วยดัชนี (Index)</th>
                        <th className="py-2.5 px-3">ประเภทกลุ่มเสี่ยง</th>
                        <th className="py-2.5 px-3">อายุ/เพศ</th>
                        <th className="py-2.5 px-3">เกณฑ์ติดตาม</th>
                        <th className="py-2.5 px-3">สถานะ NTIP</th>
                        <th className="py-2.5 px-3">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contactPreviews
                        .map((item, originalIdx) => ({ item, originalIdx }))
                        .filter(({ item }) => {
                          if (!previewSearch.trim()) return true;
                          const q = previewSearch.toLowerCase();
                          return (
                            item.contact.fullName.toLowerCase().includes(q) ||
                            (item.contact.hn || '').toLowerCase().includes(q) ||
                            (item.contact.indexPatientHN || '').toLowerCase().includes(q) ||
                            (item.contact.indexPatientName || '').toLowerCase().includes(q)
                          );
                        })
                        .map(({ item, originalIdx }) => {
                          const isSelected = selectedIndices.has(originalIdx);
                          return (
                            <tr
                              key={item.contact.id || originalIdx}
                              onClick={() => toggleSelectOne(originalIdx)}
                              className={`cursor-pointer transition ${
                                isSelected ? 'bg-teal-50/50 hover:bg-teal-50' : 'hover:bg-slate-50 opacity-60'
                              }`}
                            >
                              <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectOne(originalIdx)}
                                  className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                              </td>
                              <td className="py-2 px-3 font-mono text-[10px] text-slate-400">
                                #{item.rowNumber}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-900">
                                <div>{item.contact.fullName}</div>
                                {item.contact.hn && (
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    HN: {item.contact.hn}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-700">
                                <div>{item.contact.indexPatientName || '-'}</div>
                                {item.contact.indexPatientHN && (
                                  <div className="text-[10px] text-teal-700 font-mono font-bold">
                                    HN: {item.contact.indexPatientHN}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.contact.contactType === 'household'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.contact.contactType === 'household' ? 'ร่วมบ้าน' : 'นอกบ้าน'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-700">
                                {item.contact.age} ปี ({item.contact.gender === 'female' ? 'หญิง' : item.contact.gender === 'other' ? 'อื่นๆ' : 'ชาย'})
                              </td>
                              <td className="py-2 px-3 text-[11px] text-slate-700">
                                {item.contact.protocolType === 'cxr_4_times' ? 'CXR 4 ครั้ง' : 'IGRA / TPT'}
                              </td>
                              <td className="py-2 px-3">
                                {item.contact.ntipStatus === 'entered' ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                    คีย์แล้ว
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                                    ยังไม่คีย์
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {item.isExisting ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                                    อัปเดตข้อมูลเดิม
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                    ผู้สัมผัสใหม่
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>คำแนะนำการนำเข้า:</strong> หากมีข้อมูล HN หรือรหัสที่ตรงกับในระบบอยู่แล้ว ระบบจะอัปเดตข้อมูลให้ทันทีโดยไม่สร้างรายการซ้ำซ้อน และจะจัดเก็บลงในฐานข้อมูลระบบพร้อมซิงค์กลับไปยัง Google Sheet ตามมาตรฐาน
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            เลือกนำเข้า <strong>{selectedIndices.size}</strong> รายการ จากแท็บ <strong>"{selectedTab || '-'}"</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting || selectedIndices.size === 0}
              className="px-5 py-2 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isImporting ? 'กำลังนำเข้าข้อมูล...' : `ยืนยันนำเข้า (${selectedIndices.size} รายการ)`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
