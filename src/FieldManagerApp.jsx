import React, { useState } from 'react';
import * as XLSX from 'xlsx'; 
import SignaturePadPopup from './SignaturePadPopup';

const CORPORATIONS = [
  "대원전기(주)", "우창전력(주)", "세대전력(주)", "(주)태원전력공사", "(주)정동전력",
  "보람전설(주)", "화신전기(주)", "우림전기(주)", "(주)창전사", "(주)대원전기교육원",
  "대상전력(주)", "대홍전건(주)", "태홍전력(주)", "대원산전(주)", "대명전업(주)"
];

const SITE_MAPPING = {
  "대원전기(주)": ["증평 지중화 공사 현장", "청주 한전 배전단가 현장", "본사 안전보건 교육장"],
  "우창전력(주)": ["진천 변전소 신설 공사", "음성 가공송전로 점검 현장"],
  "세대전력(주)": ["세종 구내통신망 구축 공사"],
  "(주)태원전력공사": ["천안 산단 내선전기 공사"],
};

const CONSTRUCTION_TYPES = [
  "내선공사", "변전", "지중송전", "가공송전", "배전", "kt", "태양광"
];

export default function FieldManagerApp() {
  const [activeTab, setActiveTab] = useState('daily');

  // [통합 마스터 인력 DB 데이터베이스]
  const [masterWorkerPool, setMasterWorkerPool] = useState([
    { id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직', annualSalary: 54000000, specialAllowance: 300000 },
    { id: 'm-2', corp: '대원전기(주)', constType: '지중송전', name: '이일용', type: '일용직', hourlyWage: 18000, specialAllowance: 0 },
    { id: 'm-3', corp: '대원전기(주)', constType: '배전', name: '박안전', type: '일용직', hourlyWage: 16500, specialAllowance: 0 },
    { id: 'm-4', corp: '우창전력(주)', constType: '변전', name: '최전력', type: '정규직', annualSalary: 48000000, specialAllowance: 500000 },
  ]);

  // 관리자 신규 등록용 임시 상태값
  const [adminCorp, setAdminCorp] = useState('');
  const [adminType, setAdminType] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminWorkerType, setAdminWorkerType] = useState('정규직');
  const [adminWageInput, setAdminWageInput] = useState(''); 
  const [adminAllowanceInput, setAdminAllowanceInput] = useState(''); 

  // 🎯 [신규 핵심 상태] 현재 수정 팝업창(모달)에 열려있는 근로자의 복제 정보 보관함
  const [editingWorker, setEditingWorker] = useState(null);

  // 일보 작성 전용 상태값
  const [selectedCorp, setSelectedCorp] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // 소트 정렬용 공통 상태값
  const [filterCorp, setFilterCorp] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 당일 출역 투입 명단 상태값
  const [todayActiveWorkers, setTodayActiveWorkers] = useState([]);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);

  const handleCorpChange = (e) => {
    setSelectedCorp(e.target.value);
    setSelectedSite('');
    setSelectedType('');
    setTodayActiveWorkers([]);
    setFilterCorp(e.target.value);
  };

  // 1. 근로자 수동 신규 등록
  const handleAdminAddWorker = (e) => {
    e.preventDefault();
    if (!adminCorp || !adminType || !adminName.trim() || !adminWageInput) {
      alert("기본 계약 정보를 빠짐없이 입력해 주세요.");
      return;
    }
    const wageNum = Number(adminWageInput);
    const allowanceNum = Number(adminAllowanceInput) || 0;

    const newWorker = {
      id: `admin-${Date.now()}`,
      corp: adminCorp,
      constType: adminType,
      name: adminName.trim(),
      type: adminWorkerType,
      specialAllowance: allowanceNum,
      ...(adminWorkerType === '정규직' ? { annualSalary: wageNum } : { hourlyWage: wageNum })
    };

    setMasterWorkerPool([...masterWorkerPool, newWorker]);
    setAdminName('');
    setAdminWageInput('');
    setAdminAllowanceInput('');
    alert(`✅ 마스터 인력풀에 정상 등록되었습니다.`);
  };

  // 🎯 [신규 기능] 수정 버튼 클릭 시 팝업(모달)을 열고 기존 데이터를 채워 넣는 트리거
  const handleOpenEditModal = (worker) => {
    setEditingWorker({
      ...worker,
      // 임시 폼 입력을 위한 단가 문자열 변환 처리
      wageInput: worker.type === '정규직' ? worker.annualSalary : worker.hourlyWage
    });
  };

  // 🎯 [신규 기능] 팝업창에서 수정한 최종본을 전산 마스터 DB 및 당일 일보에 실시간 동시 저장
  const handleSaveEditedWorker = (e) => {
    e.preventDefault();
    if (!editingWorker.name.trim() || !editingWorker.wageInput) {
      alert("성명과 급여 단가는 필수 입력 항목입니다.");
      return;
    }

    const wageNum = Number(editingWorker.wageInput);
    const allowanceNum = Number(editingWorker.specialAllowance) || 0;

    // 업데이트될 타깃 오브젝트 재조합
    const updatedWorker = {
      id: editingWorker.id,
      corp: editingWorker.corp,
      constType: editingWorker.constType,
      name: editingWorker.name.trim(),
      type: editingWorker.type,
      specialAllowance: allowanceNum,
      ...(editingWorker.type === '정규직' ? { annualSalary: wageNum } : { hourlyWage: wageNum })
    };

    // 가. 전산 마스터 인력풀 갈아끼우기
    setMasterWorkerPool(masterWorkerPool.map(w => w.id === editingWorker.id ? updatedWorker : w));
    
    // 나. 오늘 출역 일보 명단에 이미 들어간 사람이라면 거기서도 시급/수당 수정을 동시 실시간 전파
    setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === editingWorker.id ? {
      ...w,
      ...updatedWorker
    } : w));

    setEditingWorker(null); // 모달 창 닫기
    alert(`⚙️ '${updatedWorker.name}' 근로자의 공종 및 급여 수정 정보가 전산에 실시간 동기화되었습니다.`);
  };

  // 근로자 영구 삭제 모듈
  const handleAdminDeleteWorker = (workerId, workerName) => {
    if (!window.confirm(`⚠️ [경고] '${workerName}' 근로자를 삭제하시겠습니까?\n출역 명단에서도 자동 제외됩니다.`)) return;
    setMasterWorkerPool(masterWorkerPool.filter(w => w.id !== workerId));
    setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== workerId));
  };

  // 엑셀 일괄 업로드 파서
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) return alert("엑셀 데이터가 비어있습니다.");

        const uploadedWorkers = jsonData.map((row, index) => {
          const name = String(row['성명'] || row['이름'] || '').trim();
          const corp = String(row['법인명'] || row['소속법인'] || '').trim();
          let constType = String(row['공사종류'] || row['공종'] || '').trim();
          if (["내선전기", "전문소방", "구내통신"].includes(constType)) constType = "내선공사";

          const type = String(row['근무형태'] || '').trim() === '일용직' ? '일용직' : '정규직';
          const baseWage = Number(row['급여단가'] || row['연봉'] || row['시급'] || 0);
          const allowance = Number(row['특별수당'] || row['직책수당'] || 0);

          return {
            id: `excel-${Date.now()}-${index}`,
            name: name || `미명명_${index+1}`,
            corp: CORPORATIONS.includes(corp) ? corp : CORPORATIONS[0],
            constType: CONSTRUCTION_TYPES.includes(constType) ? constType : CONSTRUCTION_TYPES[0], 
            type: type,
            specialAllowance: allowance,
            ...(type === '정규직' ? { annualSalary: baseWage } : { hourlyWage: baseWage })
          };
        });
        setMasterWorkerPool([...masterWorkerPool, ...uploadedWorkers]);
        alert(`📊 엑셀 대량 업로드 성공! 총 ${uploadedWorkers.length}명 선등록 완료.`);
      } catch (error) { alert("엑셀 분석 실패"); }
    };
    reader.readAsArrayBuffer(file);
  };

  // 243 정산용 급여 계산식
  const calculate243Wage = (worker) => {
    let baseHourlyRate = 0;
    const allowance = worker.specialAllowance || 0;
    if (worker.type === '정규직') {
      const monthlyBase = (worker.annualSalary || 0) / 12;
      baseHourlyRate = Math.round((monthlyBase + allowance) / 243);
    } else {
      baseHourlyRate = (worker.hourlyWage || 0);
    }
    const basePay = worker.baseHours * baseHourlyRate;
    const otPay = worker.otHours * baseHourlyRate * 1.5; 
    const totalGrossPay = Math.round(basePay + otPay);
    const severancePay = Math.round(totalGrossPay / 12);
    const incomeTax = Math.round(totalGrossPay * 0.015); 
    const localIncomeTax = Math.round(incomeTax * 0.1); 
    const totalInsurance = Math.round(totalGrossPay * 0.093); 
    return {
      hourlyRate: baseHourlyRate, grossPay: totalGrossPay, severance: severancePay,
      tax: incomeTax + localIncomeTax, insurance: totalInsurance, netPay: totalGrossPay - (incomeTax + localIncomeTax + totalInsurance)
    };
  };

  const handleToggleSelectWorker = (worker) => {
    const isAlreadyAdded = todayActiveWorkers.some(w => w.id === worker.id);
    if (isAlreadyAdded) {
      setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== worker.id));
    } else {
      setTodayActiveWorkers([...todayActiveWorkers, { ...worker, baseHours: 8, otHours: 0, healthOk: false, signatureUrl: null }]);
    }
  };

  const filteredMasterPool = masterWorkerPool.filter(worker => {
    const matchCorp = filterCorp ? worker.corp === filterCorp : true;
    const matchType = filterType ? worker.constType === filterType : true;
    const matchQuery = searchQuery ? worker.name.includes(searchQuery) : true;
    return matchCorp && matchType && matchQuery;
  });

  const availableSites = selectedCorp ? (SITE_MAPPING[selectedCorp] || [`${selectedCorp} 상시 현장`]) : [];
  const totalSummary = todayActiveWorkers.reduce((acc, curr) => {
    const calc = calculate243Wage(curr);
    return { gross: acc.gross + calc.grossPay, severance: acc.severance + calc.severance, tax: acc.tax + calc.tax, net: acc.net + calc.netPay };
  }, { gross: 0, severance: 0, tax: 0, net: 0 });

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-44 font-sans text-slate-800 antialiased">
      
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-5 shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-lg font-black tracking-tight">⚙️ 대원 통합 현장 전산시스템</h1>
          <span className="bg-emerald-600 text-[10px] px-2 py-0.5 rounded font-bold">수정/편집 추가</span>
        </div>
        <div className="flex bg-black/20 p-1 rounded-xl text-[11px] font-black">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>📝 일보 작성</button>
          <button onClick={() => setActiveTab('admin')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>➕ 인력 등록/수정</button>
          <button onClick={() => setActiveTab('roster')} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'roster' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>📊 전체 명부 조회</button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        
        {/* 모드 1: 인력 추가 및 [수정 기능 연동] 명부 관리 탭 */}
        {activeTab === 'admin' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl shadow-sm border border-blue-200 space-y-3">
              <h2 className="text-sm font-black text-blue-900">📊 스마트 Excel 대량 일괄 등록</h2>
              <div className="bg-white border-2 border-dashed border-blue-300 rounded-xl p-4 text-center relative hover:bg-blue-100/30 transition-all cursor-pointer">
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <p className="text-xs font-black text-slate-700">📁 여기에 .xlsx 진짜 엑셀 파일을 등록하세요</p>
              </div>
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border space-y-3">
              <h2 className="text-sm font-extrabold text-slate-800">👤 근로자 개별 수동 등록</h2>
              <form onSubmit={handleAdminAddWorker} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" value={adminCorp} onChange={e => setAdminCorp(e.target.value)}>
                    <option value="">법인 선택</option>
                    {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" value={adminType} onChange={e => setAdminType(e.target.value)}>
                    <option value="">공종 선택</option>
                    {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="근로자 성명" className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none" value={adminName} onChange={e => setAdminName(e.target.value)} />
                  <select className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold" value={adminWorkerType} onChange={e => setAdminWorkerType(e.target.value)}>
                    <option value="정규직">정규직 (연봉 계약)</option>
                    <option value="일용직">일용직 (시급 정산)</option>
                  </select>
                </div>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">{adminWorkerType === '정규직' ? '💡 총 계약 연봉금액 입력 (예: 48000000)' : '💡 약정 통상 시급 입력'}</label>
                    <input type="number" placeholder={adminWorkerType === '정규직' ? "예: 48000000" : "예: 18000"} className="w-full bg-white border rounded-xl p-2.5 text-xs font-bold outline-none" value={adminWageInput} onChange={e => setAdminWageInput(e.target.value)} />
                  </div>
                  {adminWorkerType === '정규직' && (
                    <div>
                      <label className="block text-[10px] text-blue-500 font-bold mb-1">💡 매월 고정 특별수당 / 직책수당 입력</label>
                      <input type="number" placeholder="예: 매월 300000" className="w-full bg-white border rounded-xl p-2.5 text-xs font-bold outline-none" value={adminAllowanceInput} onChange={e => setAdminAllowanceInput(e.target.value)} />
                    </div>
                  )}
                  <div className="pt-1"><button type="submit" className="w-full bg-slate-900 text-white text-xs py-3 rounded-xl font-bold hover:bg-slate-800">등록 완료</button></div>
                </div>
              </form>
            </section>

            {/* 마스터 명부 간이 삭제 및 [수정] 리스트 프레임 */}
            <section className="bg-white p-4 rounded-2xl shadow-sm border">
              <h2 className="text-xs font-black text-slate-400 uppercase mb-2">마스터 명부 관리 및 수정부 ({masterWorkerPool.length}명)</h2>
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {masterWorkerPool.map(w => {
                  const calculatedRate = w.type === '정규직' ? Math.round(((w.annualSalary / 12) + (w.specialAllowance || 0)) / 243) : w.hourlyWage;
                  return (
                    <div key={w.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border">
                      <div><span className="font-black text-slate-900 mr-1">{w.name} <span className="text-[9px] text-slate-400 font-normal">({w.constType})</span></span><span className="text-[10px] text-slate-400 block">{w.corp}</span></div>
                      <div className="flex items-center gap-1.5"><span className="text-[10px] font-bold text-blue-600 mr-1">{calculatedRate.toLocaleString()}원</span>
                        {/* 🎯 [수정 버튼 레이아웃 추가] */}
                        <button onClick={() => handleOpenEditModal(w)} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded font-black text-[10px]">수정</button>
                        <button onClick={() => handleAdminDeleteWorker(w.id, w.name)} className="bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded font-black text-[10px]">삭제</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 모드 3: 전체 근로자 명부 조회 탭 */}
        {activeTab === 'roster' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
              <h2 className="text-sm font-black text-slate-800 flex justify-between items-center">
                <span>🔎 전사 소속 인력 종합 검색부</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">총 {filteredMasterPool.length}명</span>
              </h2>
              <div className="grid grid-cols-2 gap-1.5">
                <select className="bg-slate-50 border border-slate-200 text-[11px] font-bold p-2.5 rounded-xl outline-none" value={filterCorp} onChange={e => setFilterCorp(e.target.value)}><option value="">🏢 전체 법인 리스트</option>{CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select className="bg-slate-50 border border-slate-200 text-[11px] font-bold p-2.5 rounded-xl outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}><option value="">⚡ 전체 공종 리스트</option>{CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <input type="text" placeholder="🔎 찾으려는 근로자의 성명을 입력하세요..." className="w-full bg-slate-50 border border-slate-200 text-xs font-bold p-3 rounded-xl outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </section>

            <section className="space-y-2.5">
              {filteredMasterPool.map(worker => {
                const isRegular = worker.type === '정규직';
                const hourlyRate = isRegular ? Math.round(((worker.annualSalary / 12) + (worker.specialAllowance || 0)) / 243) : worker.hourlyWage;
                return (
                  <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 space-y-2.5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">{worker.name}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isRegular ? 'bg-indigo-50 text-indigo-600 border' : 'bg-teal-50 text-teal-600 border'}`}>{worker.type}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{worker.constType}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                      <div>소속 법인: <span className="font-bold text-slate-800">{worker.corp}</span></div>
                      <div className="text-right">243 시급: <span className="font-bold text-blue-600">{hourlyRate.toLocaleString()}원</span></div>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* 모드 2: 일보 및 현장 배치 탭 */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <section className="bg-white p-5 rounded-2xl shadow-md border space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5">1. 투입 법인 선택</label>
                <select className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl p-3 outline-none" value={selectedCorp} onChange={handleCorpChange}>
                  <option value="">소속 법인을 골라주세요</option>
                  {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5">2. 현장 선택</label>
                  <select className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl p-3 outline-none" value={selectedSite} onChange={e => setSelectedSite(e.target.value)} disabled={!selectedCorp}>
                    <option value="">현장 선택</option>
                    {availableSites.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5">3. 대표 공종</label>
                  <select className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl p-3 outline-none" value={selectedType} onChange={e => setSelectedType(e.target.value)} disabled={!selectedSite}>
                    <option value="">공종 선택</option>
                    {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {selectedCorp && selectedSite && selectedType && (
              <>
                <section className="bg-white p-4 rounded-2xl shadow-md border border-blue-200/60 space-y-3">
                  <div className="grid grid-cols-2 gap-1.5">
                    <select className="bg-slate-50 border border-slate-200 text-[11px] font-black p-2 rounded-xl" value={filterCorp} onChange={e => setFilterCorp(e.target.value)}>
                      <option value="">모든 법인 소트</option>
                      {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select className="bg-slate-50 border border-slate-200 text-[11px] font-black p-2 rounded-xl" value={filterType} onChange={e => setFilterType(e.target.value)}>
                      <option value="">모든 공종 소트</option>
                      {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <input type="text" placeholder="🔎 이름을 입력하세요..." className="w-full bg-slate-50 border border-slate-200 text-xs font-bold p-2.5 rounded-xl outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {filteredMasterPool.map(worker => {
                      const isSelected = todayActiveWorkers.some(w => w.id === worker.id);
                      return (
                        <button key={worker.id} onClick={() => handleToggleSelectWorker(worker)} className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          {isSelected ? '✓ ' : '+ '} {worker.name}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-black text-slate-500 px-1">👷 오늘 현장 투입 정산 명단 ({todayActiveWorkers.length}명)</h3>
                  {todayActiveWorkers.map(worker => {
                    const calc = calculate243Wage(worker);
                    const allowance = worker.specialAllowance || 0;
                    return (
                      <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-black text-slate-900">{worker.name}</span>
                            <span className="text-[9px] bg-emerald-50 px-1.5 py-0.5 border text-emerald-700 font-bold">243시급: {calc.hourlyRate.toLocaleString()}원</span>
                          </div>
                          <button onClick={() => handleToggleSelectWorker(worker)} className="text-xs text-red-400 font-bold">제외</button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">주간 근무 시간</label>
                            <input type="number" className="w-full text-center text-sm font-black bg-slate-50 border rounded-lg p-2" value={worker.baseHours} onChange={e => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? {...w, baseHours: Number(e.target.value)} : w))} />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">연장근무 (1.5배)</label>
                            <input type="number" className="w-full text-center text-sm font-black bg-slate-50 border rounded-lg p-2" value={worker.otHours} onChange={e => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? {...w, otHours: Number(e.target.value)} : w))} />
                          </div>
                        </div>

                        <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                          {allowance > 0 && <div className="flex justify-between text-indigo-400"><span>📢 월 고정 특별수당 기본값:</span><span>{allowance.toLocaleString()} 원 / 월</span></div>}
                          <div className="flex justify-between"><span className="text-slate-400">💰 일일 노임 총액:</span><span className="font-bold text-white">{calc.grossPay.toLocaleString()} 원</span></div>
                          <div className="flex justify-between text-blue-400 font-bold"><span>📁 일일 퇴직연금 적립금 (1/12):</span><span>+ {calc.severance.toLocaleString()} 원</span></div>
                          <div className="border-t border-slate-700/60 my-1"></div>
                          <div className="flex justify-between text-red-400"><span>└ 갑근세+지방세(1.65%):</span><span>- {calc.tax.toLocaleString()} 원</span></div>
                          <div className="flex justify-between text-red-400"><span>└ 4대보험 근로자분(9.3%):</span><span>- {calc.insurance.toLocaleString()} 원</span></div>
                          <div className="border-t border-slate-700 my-1"></div>
                          <div className="flex justify-between text-emerald-400 font-bold"><span>💵 차인 당일 실수령액:</span><span>{calc.netPay.toLocaleString()} 원</span></div>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border text-xs space-y-2">
                          <label className="flex justify-between items-center cursor-pointer">
                            <span className={worker.healthOk ? 'text-slate-600 font-bold' : 'text-red-500 font-black'}>🩺 당일 건강 상태 정상 여부</span>
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={worker.healthOk} onChange={() => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? {...w, healthOk: !w.healthOk} : w))} />
                          </label>
                          <div className="flex justify-between items-center pt-1.5 border-t">
                            <span className={worker.signatureUrl ? 'text-blue-700 font-black' : 'text-slate-500 font-bold'}>Worker TBM 서명 확인</span>
                            {worker.signatureUrl ? <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded font-black">서명완료</span> : <button onClick={() => { setCurrentWorker(worker); setIsSignatureOpen(true); }} className="bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-bold">서명 받기</button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>
              </>
            )}
          </div>
        )}
      </main>

      {/* 하단 집계 바 */}
      {activeTab === 'daily' && todayActiveWorkers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-[11px] font-black px-1">
              <span>노임총액: {totalSummary.gross.toLocaleString()}원</span>
              <span className="text-blue-600">퇴직적립: {totalSummary.severance.toLocaleString()}원</span>
              <span className="text-red-500">세금공제: {totalSummary.tax.toLocaleString()}원</span>
            </div>
            <button onClick={() => alert(`✅ [243시간제 데이터 정산 완료]`)} className="w-full bg-blue-800 text-white font-black text-base py-4 rounded-xl shadow-xl hover:bg-blue-900">
              243제 마감 및 본사 전송 ({totalSummary.net.toLocaleString()}원 지급)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 🎯 [신규 스마트 UI 모달] 마스터 인력풀 실시간 정보 수정 팝업창 */}
      {/* ========================================================= */}
      {editingWorker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 p-4 text-white">
              <h3 className="font-black text-sm">✏️ 근로자 정보 정밀 수정 패널</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">선택된 근로자의 급여 및 소속 공종 정보를 변경합니다.</p>
            </div>
            
            <form onSubmit={handleSaveEditedWorker} className="p-4 space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">근로자 이름</label>
                <input type="text" className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={editingWorker.name} onChange={e => setEditingWorker({...editingWorker, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">소속 법인</label>
                  <select className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={editingWorker.corp} onChange={e => setEditingWorker({...editingWorker, corp: e.target.value})}>
                    {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">담당 공사종류(공종)</label>
                  <select className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={editingWorker.constType} onChange={e => setEditingWorker({...editingWorker, constType: e.target.value})}>
                    {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">{editingWorker.type === '정규직' ? '계약 연봉금액 (원 단위)' : '약정 통상 시급 (원 단위)'}</label>
                <input type="number" className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={editingWorker.wageInput} onChange={e => setEditingWorker({...editingWorker, wageInput: e.target.value})} />
              </div>

              {editingWorker.type === '정규직' && (
                <div>
                  <label className="block text-[10px] font-bold text-blue-600 mb-1">매월 고정 특별수당 / 직책수당 (원 단위)</label>
                  <input type="number" className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs font-bold outline-none" value={editingWorker.specialAllowance} onChange={e => setEditingWorker({...editingWorker, specialAllowance: e.target.value})} />
                </div>
              )}

              {/* 하단 제어 액션 버트 바 */}
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setEditingWorker(null)} className="flex-1 bg-slate-100 border text-slate-500 font-bold text-xs py-3 rounded-xl hover:bg-slate-200">취소</button>
                <button type="submit" className="flex-1 bg-blue-800 text-white font-black text-xs py-3 rounded-xl hover:bg-blue-900">수정본 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SignaturePadPopup isOpen={isSignatureOpen} onClose={() => setIsSignatureOpen(false)} onSave={(url) => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === currentWorker.id ? { ...w, signatureUrl: url } : w))} workerName={currentWorker?.name} workerId={currentWorker?.id} />
    </div>
  );
}