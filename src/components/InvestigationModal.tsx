import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  AlertCircle, 
  Calendar, 
  User, 
  Home, 
  Users, 
  Activity, 
  HelpCircle, 
  CheckCircle, 
  Stethoscope, 
  Microscope,
  Wind,
  ShieldCheck,
  Building,
  Printer,
  Clock,
  Info
} from 'lucide-react';
import { Patient, InvestigationForm, UserProfile } from '../types';
import { ContactCriteriaModal } from './ContactCriteriaModal';
import { InvestigationPrintModal } from './InvestigationPrintModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inv: InvestigationForm) => Promise<void>;
  patient: Patient;
  existingInvestigation?: InvestigationForm | null;
  currentUserProfile?: UserProfile | null;
  onOpenAddContacts?: (patient: Patient, defaultType?: 'household' | 'non_household') => void;
}

export const InvestigationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  patient,
  existingInvestigation,
  currentUserProfile,
  onOpenAddContacts,
}) => {
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State initialized based on guidelines 2563/2566
  const [formData, setFormData] = useState<Partial<InvestigationForm>>(() => {
    const defaultInvestigatorName = existingInvestigation?.investigatorName || currentUserProfile?.displayName || '';
    const defaultInvestigatorPosition = existingInvestigation?.investigatorPosition || currentUserProfile?.position || 'นักวิชาการสาธารณสุข / รพ.มหาวิทยาลัยอุบลราชธานี';

    if (existingInvestigation) {
      return { 
        ...existingInvestigation,
        investigatorName: defaultInvestigatorName,
        investigatorPosition: defaultInvestigatorPosition,
      };
    }
    
    // Default infectious window (3 months before diagnosis to 2 weeks after)
    const diagDate = patient.diagnosisDate || new Date().toISOString().split('T')[0];
    const startDateObj = new Date(diagDate);
    startDateObj.setMonth(startDateObj.getMonth() - 3);
    const endDateObj = new Date(diagDate);
    endDateObj.setDate(endDateObj.getDate() + 14);

    return {
      id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: patient.id,
      patientHN: patient.hn,
      patientName: patient.fullName,
      investigationDate: new Date().toISOString().split('T')[0],
      investigatorName: defaultInvestigatorName,
      investigatorPosition: defaultInvestigatorPosition,
      occupation: '',
      symptomOnsetDate: diagDate,
      firstDoctorVisitDate: diagDate,
      infectiousPeriodStart: startDateObj.toISOString().split('T')[0],
      infectiousPeriodEnd: endDateObj.toISOString().split('T')[0],
      tbClassification: patient.tbClassification || 'Pulmonary (Bacteriologically Confirmed)',
      afbSmearResult: 'Positive 2+',
      afbSmearDate: diagDate,
      geneXpertResult: 'MTB detected (Rifampicin sensitive)',
      geneXpertDate: diagDate,
      cultureResult: 'รอผลเพาะเชื้อ (Pending)',
      initialCxrResult: 'Infiltration at Right Upper Lobe (Cavitary lesion)',
      initialCxrDate: diagDate,
      symptoms: {
        chronicCough: true,
        coughDurationWeeks: 3,
        coughBlood: false,
        fever: true,
        nightSweats: true,
        weightLoss: true,
        chestPain: false,
        fatigue: true,
      },
      comorbidities: {
        hiv: 'negative',
        diabetes: false,
        ckd: false,
        smoking: false,
        alcohol: false,
        substanceAbuse: false,
        previousTbHistory: 'no',
        otherNotes: '',
      },
      livingConditions: {
        homeType: 'บ้านเดี่ยว',
        ventilation: 'ปานกลาง',
        totalRooms: 2,
        totalResidents: 3,
      },
      householdContactsCount: patient.householdContactsCount || 2,
      under5ContactsCount: 0,
      nonHouseholdContactsCount: patient.nonHouseholdContactsCount || 1,
      riskAssessmentNotes: 'ผู้ป่วยมีผลเสมหะพบเชื้อ (Smear Positive) ถือเป็นแหล่งแพร่กระจายเชื้อ ควรกำชับให้สวมหน้ากากอนามัย และเร่งคัดกรองผู้สัมผัสร่วมบ้านโดยด่วน',
      controlMeasures: '1. แยกห้องนอนและจัดสภาพแวดล้อมให้เปิดหน้าต่างระบายอากาศ\n2. ส่งตรวจคัดกรองผู้สัมผัสร่วมบ้านตามเกณฑ์ (CXR 4 ครั้งสำหรับผู้ใหญ่, IGRA/TPT สำหรับเด็กเล็ก)\n3. ให้สุขศึกษาเรื่องการป้องกันการแพร่กระจายเชื้อทางละอองฝอย',
      supervisorReviewerName: patient.doctorName || 'แพทย์ผู้รับผิดชอบงานควบคุมวัณโรค',
    };
  });

  // When currentUserProfile loads or changes and investigatorName is blank, auto populate
  useEffect(() => {
    if (currentUserProfile && (!formData.investigatorName || formData.investigatorName.trim() === '')) {
      setFormData(prev => ({
        ...prev,
        investigatorName: currentUserProfile.displayName,
        investigatorPosition: prev.investigatorPosition || currentUserProfile.position,
      }));
    }
  }, [currentUserProfile]);

  // Calculate infectious period when onset date or diagnosis date changes
  const handleOnsetDateChange = (onsetDate: string) => {
    const startObj = new Date(onsetDate);
    startObj.setMonth(startObj.getMonth() - 3);
    
    const diag = patient.diagnosisDate || onsetDate;
    const endObj = new Date(diag);
    endObj.setDate(endObj.getDate() + 14);

    setFormData(prev => ({
      ...prev,
      symptomOnsetDate: onsetDate,
      infectiousPeriodStart: startObj.toISOString().split('T')[0],
      infectiousPeriodEnd: endObj.toISOString().split('T')[0],
    }));
  };

  // Auto show criteria popup on initial investigation if not seen
  useEffect(() => {
    if (isOpen && !existingInvestigation) {
      const timer = setTimeout(() => {
        setShowCriteriaModal(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, existingInvestigation]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.investigatorName) {
      setErrorMsg('กรุณาระบุชื่อผู้ทำการสอบสวนโรค');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const invToSave: InvestigationForm = {
        id: formData.id || `INV-${Date.now()}`,
        patientId: patient.id,
        patientHN: patient.hn,
        patientName: patient.fullName,
        investigationDate: formData.investigationDate || new Date().toISOString().split('T')[0],
        investigatorName: formData.investigatorName || '',
        investigatorPosition: formData.investigatorPosition || '',
        occupation: formData.occupation || '',
        symptomOnsetDate: formData.symptomOnsetDate || '',
        firstDoctorVisitDate: formData.firstDoctorVisitDate || '',
        infectiousPeriodStart: formData.infectiousPeriodStart || '',
        infectiousPeriodEnd: formData.infectiousPeriodEnd || '',
        tbClassification: formData.tbClassification || patient.tbClassification,
        afbSmearResult: formData.afbSmearResult || 'Negative',
        afbSmearDate: formData.afbSmearDate || '',
        geneXpertResult: formData.geneXpertResult || 'Not done',
        geneXpertDate: formData.geneXpertDate || '',
        cultureResult: formData.cultureResult || '',
        initialCxrResult: formData.initialCxrResult || '',
        initialCxrDate: formData.initialCxrDate || '',
        symptoms: {
          chronicCough: !!formData.symptoms?.chronicCough,
          coughDurationWeeks: Number(formData.symptoms?.coughDurationWeeks) || 0,
          coughBlood: !!formData.symptoms?.coughBlood,
          fever: !!formData.symptoms?.fever,
          nightSweats: !!formData.symptoms?.nightSweats,
          weightLoss: !!formData.symptoms?.weightLoss,
          chestPain: !!formData.symptoms?.chestPain,
          fatigue: !!formData.symptoms?.fatigue,
        },
        comorbidities: {
          hiv: formData.comorbidities?.hiv || 'unknown',
          diabetes: !!formData.comorbidities?.diabetes,
          ckd: !!formData.comorbidities?.ckd,
          smoking: !!formData.comorbidities?.smoking,
          alcohol: !!formData.comorbidities?.alcohol,
          substanceAbuse: !!formData.comorbidities?.substanceAbuse,
          previousTbHistory: formData.comorbidities?.previousTbHistory || 'no',
          otherNotes: formData.comorbidities?.otherNotes || '',
        },
        livingConditions: {
          homeType: formData.livingConditions?.homeType || 'บ้านเดี่ยว',
          ventilation: formData.livingConditions?.ventilation || 'ปานกลาง',
          totalRooms: Number(formData.livingConditions?.totalRooms) || 1,
          totalResidents: Number(formData.livingConditions?.totalResidents) || 1,
        },
        householdContactsCount: Number(formData.householdContactsCount) || 0,
        under5ContactsCount: Number(formData.under5ContactsCount) || 0,
        nonHouseholdContactsCount: Number(formData.nonHouseholdContactsCount) || 0,
        riskAssessmentNotes: formData.riskAssessmentNotes || '',
        controlMeasures: formData.controlMeasures || '',
        supervisorReviewerName: formData.supervisorReviewerName || '',
        recordedAt: existingInvestigation?.recordedAt || new Date().toISOString(),
      };

      await onSave(invToSave);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถบันทึกข้อมูลการสอบสวนโรคได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentInvPreview: InvestigationForm = {
    id: formData.id || 'INV-PREVIEW',
    patientId: patient.id,
    patientHN: patient.hn,
    patientName: patient.fullName,
    investigationDate: formData.investigationDate || new Date().toISOString().split('T')[0],
    investigatorName: formData.investigatorName || 'เจ้าหน้าที่สอบสวนโรค',
    investigatorPosition: formData.investigatorPosition || 'พยาบาลวิชาชีพ / เจ้าหน้าที่สอบสวนโรค',
    occupation: formData.occupation || '',
    symptomOnsetDate: formData.symptomOnsetDate || '',
    firstDoctorVisitDate: formData.firstDoctorVisitDate || '',
    infectiousPeriodStart: formData.infectiousPeriodStart || '',
    infectiousPeriodEnd: formData.infectiousPeriodEnd || '',
    tbClassification: formData.tbClassification || patient.tbClassification,
    afbSmearResult: formData.afbSmearResult || 'Negative',
    afbSmearDate: formData.afbSmearDate || '',
    geneXpertResult: formData.geneXpertResult || 'Not done',
    geneXpertDate: formData.geneXpertDate || '',
    cultureResult: formData.cultureResult || '',
    initialCxrResult: formData.initialCxrResult || '',
    initialCxrDate: formData.initialCxrDate || '',
    symptoms: formData.symptoms as any || {
      chronicCough: true,
      coughDurationWeeks: 3,
      coughBlood: false,
      fever: true,
      nightSweats: true,
      weightLoss: true,
      chestPain: false,
      fatigue: true,
    },
    comorbidities: formData.comorbidities as any || {
      hiv: 'negative',
      diabetes: false,
      ckd: false,
      smoking: false,
      alcohol: false,
      substanceAbuse: false,
      previousTbHistory: 'no',
    },
    livingConditions: formData.livingConditions as any || {
      homeType: 'บ้านเดี่ยว',
      ventilation: 'ปานกลาง',
      totalRooms: 2,
      totalResidents: 3,
    },
    householdContactsCount: Number(formData.householdContactsCount) || 0,
    under5ContactsCount: Number(formData.under5ContactsCount) || 0,
    nonHouseholdContactsCount: Number(formData.nonHouseholdContactsCount) || 0,
    riskAssessmentNotes: formData.riskAssessmentNotes || '',
    controlMeasures: formData.controlMeasures || '',
    supervisorReviewerName: formData.supervisorReviewerName || '',
    recordedAt: new Date().toISOString(),
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl my-8 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">
                    แบบรายงานการสอบสวนโรคผู้ป่วยวัณโรค (TB Case Investigation Form)
                  </h2>
                  <span className="text-[10px] bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded-full">
                    แนวทาง พ.ศ. 2563 / 2566
                  </span>
                </div>
                <p className="text-xs text-teal-100">
                  ผู้ป่วย: <span className="font-bold">{patient.fullName}</span> (HN: {patient.hn || '-'}) • วันขึ้นทะเบียน n-tip: {patient.ntipRegistrationDate || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="พิมพ์แบบสอบสวนโรค"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">พิมพ์แบบสอบสวน</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-teal-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. General Info & Investigator */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <span>1. ข้อมูลการสอบสวนโรคและผู้ดำเนินการ (Investigator Info)</span>
                </h3>
                {currentUserProfile && (
                  <div className="flex items-center gap-2 text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>ระบุอัตโนมัติตามผู้ Login: <strong>{currentUserProfile.displayName}</strong></span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        investigatorName: currentUserProfile.displayName,
                        investigatorPosition: currentUserProfile.position,
                      }))}
                      className="ml-1 text-[10px] text-teal-700 hover:text-teal-900 underline font-semibold cursor-pointer"
                      title="กดเพื่อดึงชื่อและตำแหน่งจากบัญชีที่เข้าสู่ระบบปัจจุบัน"
                    >
                      รีเฟรชชื่อ
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    วันที่สอบสวนโรค *
                  </label>
                  <input
                    type="date"
                    value={formData.investigationDate}
                    onChange={(e) => setFormData({ ...formData, investigationDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      ผู้ทำการสอบสวนโรค *
                    </label>
                    <span className="text-[10px] text-teal-700 font-semibold">อัตโนมัติ</span>
                  </div>
                  <input
                    type="text"
                    placeholder="เช่น ไอญารินธร อุ้มบุญ"
                    value={formData.investigatorName}
                    onChange={(e) => setFormData({ ...formData, investigatorName: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-300 ring-1 ring-teal-200/50 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ตำแหน่ง / หน่วยงาน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นักวิชาการสาธารณสุข / รพ.มหาวิทยาลัยอุบลราชธานี"
                    value={formData.investigatorPosition}
                    onChange={(e) => setFormData({ ...formData, investigatorPosition: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    อาชีพ / สถานที่ทำงาน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ค้าขาย, พนักงานบริษัท..."
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 2. Clinical History & Infectious Period (2563/2566 Guideline) */}
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  2. ประวัติการเจ็บป่วยและช่วงเวลาแพร่กระจายเชื้อ (Infectious Period)
                </h3>
                <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                  เกณฑ์ 2563: ย้อนหลัง 3 เดือน ถึง เริ่มยา 2 สัปดาห์
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    วันที่เริ่มมีอาการ (Onset Date)
                  </label>
                  <input
                    type="date"
                    value={formData.symptomOnsetDate}
                    onChange={(e) => handleOnsetDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    วันที่พบแพทย์ครั้งแรก
                  </label>
                  <input
                    type="date"
                    value={formData.firstDoctorVisitDate}
                    onChange={(e) => setFormData({ ...formData, firstDoctorVisitDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    วันที่เริ่มวินิจฉัย/รักษา
                  </label>
                  <input
                    type="date"
                    value={patient.diagnosisDate}
                    disabled
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-300 rounded-xl text-slate-600 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Calculated Infectious Period Display */}
              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="font-bold text-slate-800">ช่วงเวลาแพร่เชื้อที่ประเมิน:</span>
                  <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg font-mono">
                    {formData.infectiousPeriodStart || '-'} ถึง {formData.infectiousPeriodEnd || '-'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  (ค้นหาผู้สัมผัสที่ใกล้ชิดในช่วงเวลานี้)
                </span>
              </div>
            </div>

            {/* 3. Clinical Symptoms */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-700" />
                3. อาการสำคัญแรกรับ (Clinical Symptoms on Presentation)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms?.chronicCough}
                    onChange={(e) => setFormData({
                      ...formData,
                      symptoms: { ...formData.symptoms!, chronicCough: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span>ไอเรื้อรัง (&gt; 2 สัปดาห์)</span>
                </label>

                {formData.symptoms?.chronicCough && (
                  <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2">
                    <span className="text-[11px] font-medium text-teal-900">ระยะเวลา:</span>
                    <input
                      type="number"
                      min="1"
                      value={formData.symptoms?.coughDurationWeeks}
                      onChange={(e) => setFormData({
                        ...formData,
                        symptoms: { ...formData.symptoms!, coughDurationWeeks: Number(e.target.value) }
                      })}
                      className="w-14 px-1.5 py-0.5 text-xs bg-white border border-teal-300 rounded-lg text-center font-bold"
                    />
                    <span className="text-[11px] text-teal-900">สัปดาห์</span>
                  </div>
                )}

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms?.coughBlood}
                    onChange={(e) => setFormData({
                      ...formData,
                      symptoms: { ...formData.symptoms!, coughBlood: e.target.checked }
                    })}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="text-rose-700 font-bold">ไอเป็นเลือด (Hemoptysis)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms?.fever}
                    onChange={(e) => setFormData({
                      ...formData,
                      symptoms: { ...formData.symptoms!, fever: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                  <span>มีไข้ / ตัวร้อน</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms?.nightSweats}
                    onChange={(e) => setFormData({
                      ...formData,
                      symptoms: { ...formData.symptoms!, nightSweats: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                  <span>เหงื่อออกตอนกลางคืน</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms?.weightLoss}
                    onChange={(e) => setFormData({
                      ...formData,
                      symptoms: { ...formData.symptoms!, weightLoss: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                  <span>น้ำหนักลด / เบื่ออาหาร</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms?.chestPain}
                    onChange={(e) => setFormData({
                      ...formData,
                      symptoms: { ...formData.symptoms!, chestPain: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                  <span>เจ็บแน่นหน้าอก</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms?.fatigue}
                    onChange={(e) => setFormData({
                      ...formData,
                      symptoms: { ...formData.symptoms!, fatigue: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300"
                  />
                  <span>อ่อนเพลีย เหนื่อยง่าย</span>
                </label>
              </div>
            </div>

            {/* 4. Laboratory, Molecular & CXR */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Microscope className="w-4 h-4 text-blue-700" />
                4. ผลตรวจทางห้องปฏิบัติการและภาพถ่ายรังสีทรวงอก (Lab & CXR)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ผลตรวจเสมหะ (AFB Smear)
                  </label>
                  <select
                    value={formData.afbSmearResult}
                    onChange={(e) => setFormData({ ...formData, afbSmearResult: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-bold"
                  >
                    <option value="Positive 3+">Positive 3+ (เสี่ยงแพร่กระจายสูงมาก)</option>
                    <option value="Positive 2+">Positive 2+ (เสี่ยงแพร่กระจายสูง)</option>
                    <option value="Positive 1+">Positive 1+</option>
                    <option value="Scanty (1-9 AFB)">Scanty (1-9 AFB)</option>
                    <option value="Negative">Negative (ไม่พบเชื้อ)</option>
                    <option value="Not done / No sputum">ไม่ได้ตรวจ / เก็บเสมหะไม่ได้</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ผลตรวจระดับโมเลกุล (GeneXpert MTB/RIF)
                  </label>
                  <select
                    value={formData.geneXpertResult}
                    onChange={(e) => setFormData({ ...formData, geneXpertResult: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="MTB detected (Rifampicin sensitive)">MTB detected (Rif-sensitive / ไม่ดื้อยา)</option>
                    <option value="MTB detected (Rifampicin resistant)">MTB detected (Rif-resistant / ดื้อยา Rifampicin)</option>
                    <option value="MTB detected (Rifampicin indeterminate)">MTB detected (Rif indeterminate)</option>
                    <option value="MTB not detected">MTB not detected (ไม่พบเชื้อ)</option>
                    <option value="Not done">ไม่ได้ตรวจ (Not done)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ผลการเพาะเชื้อ (Culture MTB)
                  </label>
                  <select
                    value={formData.cultureResult}
                    onChange={(e) => setFormData({ ...formData, cultureResult: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="รอผลเพาะเชื้อ (Pending)">รอผลเพาะเชื้อ (Pending)</option>
                    <option value="Positive MTB">Positive for Mycobacterium tuberculosis</option>
                    <option value="Negative (No growth)">Negative (No growth)</option>
                    <option value="Not done">ไม่ได้ส่งตรวจ (Not done)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ผลตรวจภาพรังสีทรวงอก (CXR) แรกรับ
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น Infiltration with Cavitary lesion at Right Upper Lobe"
                    value={formData.initialCxrResult}
                    onChange={(e) => setFormData({ ...formData, initialCxrResult: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    วันที่ตรวจ CXR แรกรับ
                  </label>
                  <input
                    type="date"
                    value={formData.initialCxrDate}
                    onChange={(e) => setFormData({ ...formData, initialCxrDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* 5. Risk Factors, Comorbidities & Environment */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Wind className="w-4 h-4 text-amber-700" />
                5. ปัจจัยเสี่ยง ประวัติเดิม สภาพแวดล้อม และการระบายอากาศ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ประวัติเคยป่วยเป็นวัณโรค
                  </label>
                  <select
                    value={formData.comorbidities?.previousTbHistory}
                    onChange={(e) => setFormData({
                      ...formData,
                      comorbidities: { ...formData.comorbidities!, previousTbHistory: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="no">ไม่เคยเป็น (ผู้ป่วยรายใหม่ Cat 1)</option>
                    <option value="yes_cured">เคยเป็น และรักษาหายครบ</option>
                    <option value="yes_relapse">เคยเป็น และกลับเป็นซ้ำ (Relapse)</option>
                    <option value="yes_defaulted">เคยเป็น และขาดการรักษา (Default)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    ลักษณะที่พักอาศัย
                  </label>
                  <select
                    value={formData.livingConditions?.homeType}
                    onChange={(e) => setFormData({
                      ...formData,
                      livingConditions: { ...formData.livingConditions!, homeType: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="บ้านเดี่ยว">บ้านเดี่ยว</option>
                    <option value="ทาวน์เฮาส์/ตึกแถว">ทาวน์เฮาส์ / ตึกแถว</option>
                    <option value="ห้องเช่า/อพาร์ตเมนต์">ห้องเช่า / อพาร์ตเมนต์ / หอพัก</option>
                    <option value="แคมป์คนงาน/โรงงาน">แคมป์คนงาน / โรงงาน</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    สภาพการระบายอากาศ
                  </label>
                  <select
                    value={formData.livingConditions?.ventilation}
                    onChange={(e) => setFormData({
                      ...formData,
                      livingConditions: { ...formData.livingConditions!, ventilation: e.target.value as any }
                    })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="ดี (โปร่ง ถ่ายเทดี)">ดี (โปร่ง ถ่ายเทดี มีหน้าต่าง)</option>
                    <option value="ปานกลาง">ปานกลาง</option>
                    <option value="แออัด/ปิดทึบ/การระบายอากาศไม่ดี">แออัด / ปิดทึบ / ห้องแอร์ไม่มีหน้าต่าง</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-700 border-t border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.comorbidities?.diabetes}
                    onChange={(e) => setFormData({
                      ...formData,
                      comorbidities: { ...formData.comorbidities!, diabetes: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>มีโรคเบาหวาน (DM)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.comorbidities?.ckd}
                    onChange={(e) => setFormData({
                      ...formData,
                      comorbidities: { ...formData.comorbidities!, ckd: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>โรคไตเรื้อรัง (CKD)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.comorbidities?.smoking}
                    onChange={(e) => setFormData({
                      ...formData,
                      comorbidities: { ...formData.comorbidities!, smoking: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>ประวัติสูบบุหรี่</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.comorbidities?.alcohol}
                    onChange={(e) => setFormData({
                      ...formData,
                      comorbidities: { ...formData.comorbidities!, alcohol: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>ดื่มสุรา/แอลกอฮอล์</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.comorbidities?.substanceAbuse}
                    onChange={(e) => setFormData({
                      ...formData,
                      comorbidities: { ...formData.comorbidities!, substanceAbuse: e.target.checked }
                    })}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span>การใช้สารเสพติด</span>
                </label>
              </div>
            </div>

            {/* 6. Contact Risk Assessment & Plan */}
            <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border-2 border-emerald-300 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                <div>
                  <h3 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-700" />
                    6. การค้นหาและจำแนกจำนวนผู้สัมผัสโรค (Contact Tracing Numbers)
                  </h3>
                  <p className="text-xs text-emerald-800">
                    อิงตามเกณฑ์กรมควบคุมโรค 2563/2566 (แยกผู้สัมผัสร่วมบ้าน vs ผู้สัมผัสนอกบ้าน)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCriteriaModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-700" />
                  เปิดดูเกณฑ์การจำแนกผู้สัมผัส
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Household contacts */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">1. ผู้สัมผัสร่วมบ้าน (Household Contacts)</div>
                      <div className="text-[10px] text-emerald-700">อยู่ใต้ชายคาเดียวกัน / นอนห้องเดียวกัน / &ge; 8 ชม./วัน</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-700 font-medium">จำนวนผู้สัมผัสร่วมบ้านทั้งหมด:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={formData.householdContactsCount}
                          onChange={(e) => setFormData({ ...formData, householdContactsCount: Number(e.target.value) })}
                          className="w-20 px-2.5 py-1 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-xl text-center"
                        />
                        <span className="text-xs text-slate-600">คน</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-purple-50/50 p-2 rounded-xl border border-purple-100">
                      <div>
                        <label className="text-xs text-purple-950 font-bold block">ในจำนวนนี้ เป็นเด็กอายุ &le; 5 ปี:</label>
                        <span className="text-[10px] text-purple-700">กลุ่มเปราะบางสูง (ตรวจ IGRA / ให้ TPT)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={formData.under5ContactsCount}
                          onChange={(e) => setFormData({ ...formData, under5ContactsCount: Number(e.target.value) })}
                          className="w-20 px-2.5 py-1 text-xs font-bold text-purple-900 bg-white border border-purple-300 rounded-xl text-center"
                        />
                        <span className="text-xs text-slate-600">คน</span>
                      </div>
                    </div>
                  </div>

                  {onOpenAddContacts && (
                    <button
                      type="button"
                      onClick={() => onOpenAddContacts(patient, 'household')}
                      className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      บันทึกรายชื่อผู้สัมผัสร่วมบ้านรายบุคคล
                    </button>
                  )}
                </div>

                {/* Non-household contacts */}
                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">2. ผู้สัมผัสนอกบ้าน (Non-household Contacts)</div>
                      <div className="text-[10px] text-blue-700">ที่ทำงาน / โรงเรียน / สะสม &ge; 40-120 ชม. ในห้องปิด</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="text-xs text-slate-700 font-medium">จำนวนผู้สัมผัสนอกบ้านที่ระบุ:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={formData.nonHouseholdContactsCount}
                        onChange={(e) => setFormData({ ...formData, nonHouseholdContactsCount: Number(e.target.value) })}
                        className="w-20 px-2.5 py-1 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-300 rounded-xl text-center"
                      />
                      <span className="text-xs text-slate-600">คน</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    เกณฑ์ติดตาม: ตรวจคัดกรองอาการและ CXR แรกรับ หากมีอาการสงสัยให้ตรวจเสมหะทันที
                  </div>

                  {onOpenAddContacts && (
                    <button
                      type="button"
                      onClick={() => onOpenAddContacts(patient, 'non_household')}
                      className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold rounded-xl border border-blue-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-700" />
                      บันทึกรายชื่อผู้สัมผัสนอกบ้านรายบุคคล
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 7. Risk Assessment & Control Measures */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                7. การประเมินความเสี่ยงและมาตรการควบคุมโรค
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    การประเมินความเสี่ยงของการแพร่กระจายเชื้อ
                  </label>
                  <textarea
                    rows={2}
                    value={formData.riskAssessmentNotes}
                    onChange={(e) => setFormData({ ...formData, riskAssessmentNotes: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    placeholder="ประเมินความเสี่ยง เช่น เสมหะบวก, มีแผลโพรงในปอด, มีเด็กเล็กในบ้าน..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    มาตรการควบคุมโรคและแผนการติดตาม
                  </label>
                  <textarea
                    rows={2}
                    value={formData.controlMeasures}
                    onChange={(e) => setFormData({ ...formData, controlMeasures: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                    placeholder="ระบุมาตรการ เช่น ส่งตรวจ CXR 4 ครั้ง, ตรวจ IGRA เด็กเล็ก, สวมหน้ากาก..."
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between sticky bottom-0 bg-white py-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>พิมพ์แบบสอบสวนโรค</span>
              </button>

              <div className="flex items-center gap-3">
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
                  <span>{isSubmitting ? 'กำลังบันทึกลง Google Sheet...' : 'บันทึกใบสอบสวนโรค'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Criteria Popup Modal */}
      <ContactCriteriaModal
        isOpen={showCriteriaModal}
        onClose={() => setShowCriteriaModal(false)}
      />

      {/* Print Preview Modal */}
      <InvestigationPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        patient={patient}
        investigation={currentInvPreview}
      />
    </>
  );
};
