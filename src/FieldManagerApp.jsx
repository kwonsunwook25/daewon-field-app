import React, { useState } from 'react';
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
  "내선전기", "전문소방", "구내통신", "변전", "지중송전", "가공송전", "배전", "kt", "태양광"
];

export default function FieldManagerApp() {
  // 💡 상단 탭 제어판 확장: 'daily' (일보작성) | 'admin' (인력등록/삭제) | 'roster' (전체 명부 조회)
  const [activeTab, setActiveTab] = useState('daily');

  // [통합 마스터 인력 DB 데이터베이스]
  const [masterWorkerPool, setMasterWorkerPool] = useState([
    { id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직', annualSalary: 54000000, specialAllowance: 300000 },
    { id: 'm-2', corp: '대원전기(주)', constType: '지중송전', name: '이일용', type: '일용직', hourlyWage: 18000, specialAllowance: 0 },
    { id: 'm-3', corp: '대원전기(주)', constType: '배전', name: '박안전', type: '일용직', hourlyWage: 16500, specialAllowance: 0 },
    { id: 'm-4', corp: '우창전력(주)', constType: '변전', name: '최전력', type: '정규직', annualSalary: 48000000, specialAllowance: 500000 },
  ]);

  // 관리자 등록용 상태값
  const [adminCorp, setAdminCorp] = useState('');
  const [adminType, setAdminType] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminWorkerType, setAdminWorkerType] = useState('정규직');
  const [adminWageInput, setAdminWageInput] = useState(''); 
  const [adminAllowanceInput, setAdminAllowanceInput] = useState(''); 

  // 일보 작성 전용 상태값
  const [selectedCorp, setSelectedCorp] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // 퀵 소트 및 검색용 공통 상태값
  const [filterCorp, setFilterCorp] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 오늘 실시간 현장 투입 명단
  const [todayActiveWorkers, setTodayActiveWorkers] = useState([]);

  // TBM 모바일 서명용 팝업 제어
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);

  const handleCorpChange = (e) => {
    setSelectedCorp(e.target.value);
    setSelectedSite('');
    setSelectedType('');
    setTodayActiveWorkers([]);
    setFilterCorp(e.target.value);
  };

  // 관리자 신규 등록 트리거
  const handleAdminAddWorker = (e) => {
    e.preventDefault();
    if (!adminCorp || !adminType || !adminName.trim() || !adminWageInput) {
      alert("법인, 공종, 성명, 단가를 입력해 주세요.");
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
    alert(`✅ [등록 완료] 근로자가 전산 DB에 등록되었습니다.`);
  };

  // 마스터 DB 영구 삭제 트리거
  const handleAdminDeleteWorker = (workerId, workerName) => {
    if (!window.confirm(`⚠️ [위험] '${workerName}' 근로자를 마스터 DB에서 삭제하시겠습니까?`)) return;
    setMasterWorkerPool(masterWorkerPool.filter(w => w.id !== workerId));
    setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== workerId));
  };

  // 243 정산용 급여 계산 포뮬러
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

    const totalDeductions = incomeTax + localIncomeTax + totalInsurance;
    return {
      hourlyRate: baseHourlyRate,
      grossPay: totalGrossPay,
      severance: severancePay,
      tax: incomeTax + localIncomeTax,
      insurance: totalInsurance,
      netPay: totalGrossPay - totalDeductions
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

  // 공통 다용도 퀵 필터 및 검색 처리 엔진
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
          <span className="bg-blue-600 text-[10px] px-2 py-0.5 rounded font-bold">V4 최신형</span>
        </div>

        {/* 💡 [정밀 스위치] 3단 연동 네비게이션 탭 구현 */}
        <div className="flex bg-black/20 p-1 rounded-xl text-[11px] font-black">
          <button onClick={() => { setActiveTab('daily'); setSearchQuery(''); }} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>
            📝 일보 작성
          </button>
          <button onClick={() => { setActiveTab('admin'); setSearchQuery(''); }} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>
            ➕ 인력 등록/삭제
          </button>
          <button onClick={() => { setActiveTab('roster'); setSearchQuery(''); setFilterCorp(''); setFilterType(''); }} className={`flex-1 text-center py-2 rounded-lg transition-all ${activeTab === 'roster' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>
            📊 전체 명부 조회
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        
        {/* ========================================================= */}
        {/* [신규 탭] 모드 3: 연합 법인 전체 소속 근로자 종합 조회 창 */}
        {/* ========================================================= */}
        {activeTab === 'roster' && (
          <div className="space-y-4 animate-fade-in">
            {/* 정밀 검색용 상단 헤더 필터 조건판 */}
            <section className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
              <h2 className="text-sm font-black text-slate-800 flex justify-between items-center">
                <span>🔎 전사 소속 인력 종합 검색부</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">총 {filteredMasterPool.length}명 검색됨</span>
              </h2>
              
              <div className="grid grid-cols-2 gap-1.5">
                <select className="bg-slate-50 border border-slate-200 text-[11px] font-bold p-2.5 rounded-xl outline-none" value={filterCorp} onChange={e => setFilterCorp(e.target.value)}>
                  <option value="">🏢 전체 법인 리스트</option>
                  {CORPORATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="bg-slate-50 border border-slate-200 text-[11px] font-bold p-2.5 rounded-xl outline-none" value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">⚡ 전체 공종 리스트</option>
                  {CONSTRUCTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              
              <input 
                type="text" placeholder="🔎 찾으려는 근로자의 성명을 입력하세요..." 
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold p-3 rounded-xl outline-none focus:border-blue-500"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </section>

            {/* 고해상도 전체 인력 현황 카드 대시보드 리스트 */}
            <section className="space-y-2.5">
              {filteredMasterPool.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border text-center text-xs font-bold text-slate-400">조건에 부합하는 소속 근로자가 존재하지 않습니다.</div>
              ) : (
                filteredMasterPool.map(worker => {
                  const isRegular = worker.type === '정규직';
                  const monthlyWage = isRegular ? (worker.annualSalary / 12) : 0;
                  const totalMonthly = isRegular ? (monthlyWage + (worker.specialAllowance || 0)) : 0;
                  const hourlyRate = isRegular ? Math.round(totalMonthly / 243) : worker.hourlyWage;

                  return (
                    <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 space-y-2.5">
                      {/* 이름 및 구분 태그 바 */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">{worker.name}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isRegular ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
                            {worker.type}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{worker.constType} 공종</span>
                      </div>

                      {/* 전산 세부 세무 계약 정보 노출 파트 */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                        <div>소속 법인: <span className="font-bold text-slate-800">{worker.corp}</span></div>
                        <div className="text-right">243 환산시급: <span className="font-bold text-blue-600">{hourlyRate.toLocaleString()}원</span></div>
                        
                        {isRegular ? (
                          <>
                            <div className="mt-1">계약 연봉: <span className="font-bold text-slate-700">{(worker.annualSalary/10000).toLocaleString()} 만원</span></div>
                            <div className="text-right mt-1">월 특별수당: <span className="font-bold text-indigo-600">{(worker.specialAllowance || 0).toLocaleString()} 원</span></div>
                          </>
                        ) : (
                          <div className="col-span-2 text-slate-400 mt-1">※ 현장 일용직 시급제 근로자 (일일 시수 정산 대상)</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          </div>
        )}

        {/* 모드 1: 관리자 인력 추가 및 삭제 탭 화면 */}
        {activeTab === 'admin' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/60 space-y-3">
              <h2 className="text-sm font-extrabold text-slate-800">👤 243시간제 연봉 및 고정 수당 계약 선등록</h2>
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
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">{adminWorkerType === '정규직' ? '💡 총 계약 연봉금액 입력 (원 단위, 예: 48000000)' : '💡 약정 통상 시급 입력'}</label>
                    <input type="number" placeholder={adminWorkerType === '정규직' ? "예: 48000000" : "예: 18000"} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none" value={adminWageInput} onChange={e => setAdminWageInput(e.target.value)} />
                  </div>
                  {adminWorkerType === '정규직' && (
                    <div>
                      <label className="block text-[10px] text-blue-500 font-bold mb-1">💡 매월 고정 특별수당 / 직책수당 입력 (없을 시 공란)</label>
                      <input type="number" placeholder="예: 매월 300000" className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-xs font-bold outline-none" value={adminAllowanceInput} onChange={e => setAdminAllowanceInput(e.target.value)} />
                    </div>
                  )}
                  <div className="pt-1"><button type="submit" className="w-full bg-slate-900 text-white text-xs py-3 rounded-xl font-bold hover:bg-slate-800">등록 완료 및 마스터 DB 저장</button></div>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-2xl shadow-md border border-slate-200/60">
              <h2 className="text-xs font-black text-slate-400 uppercase mb-2">마스터 명부 간이 관리창 ({masterWorkerPool.length}명)</h2>
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {masterWorkerPool.map(w => {
                  const calculatedRate = w.type === '정규직' ? Math.round(((w.annualSalary / 12) + (w.specialAllowance || 0)) / 243) : w.hourlyWage;
                  return (
                    <div key={w.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border">
                      <div><span className="font-black text-slate-900 mr-1">{w.name}</span><span className="text-[10px] text-slate-400 block">{w.corp} | {w.constType}</span></div>
                      <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-blue-600">시급: {calculatedRate.toLocaleString()}원</span>
                        <button onClick={() => handleAdminDeleteWorker(w.id, w.name)} className="bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded font-black hover:bg-red-600 hover:text-white transition-all text-[10px]">삭제</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 모드 2: 일보 및 현장 배치 탭 화면 */}
        {activeTab === 'daily' && (
          <div className="space-y-4">
            <section className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/60 space-y-3">
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
                    return (
                      <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-black text-slate-900">{worker.name}</span>
                            <span className="text-[9px] bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 text-emerald-700 font-bold">243시급: {calc.hourlyRate.toLocaleString()}원</span>
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
              <span className="text-slate-600">노임총액: {totalSummary.gross.toLocaleString()}원</span>
              <span className="text-blue-600">퇴직적립: {totalSummary.severance.toLocaleString()}원</span>
              <span className="text-red-500">세금공제: {totalSummary.tax.toLocaleString()}원</span>
            </div>
            <button 
              onClick={() => alert(`✅ [전산 마감 및 본사 전송 완료]`)}
              className="w-full bg-blue-800 text-white font-black text-base py-4 rounded-xl shadow-xl hover:bg-blue-900"
            >
              243제 마감 및 본사 전송 ({totalSummary.net.toLocaleString()}원 지급)
            </button>
          </div>
        </div>
      )}

      <SignaturePadPopup 
        isOpen={isSignatureOpen} 
        onClose={() => setIsSignatureOpen(false)} 
        onSave={(url) => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === currentWorker.id ? { ...w, signatureUrl: url } : w))} 
        workerName={currentWorker?.name} 
        workerId={currentWorker?.id} 
      />
    </div>
  );
}