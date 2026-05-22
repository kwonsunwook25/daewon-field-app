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
  const [activeTab, setActiveTab] = useState('daily');

  // [마스터 인력 DB] - 💡 specialAllowance(월 고정 특별수당) 컬럼 기본 세팅 추가
  const [masterWorkerPool, setMasterWorkerPool] = useState([
    { id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직', annualSalary: 54000000, specialAllowance: 300000 }, // 연봉 5400만 + 매월 직책수당 30만
    { id: 'm-2', corp: '대원전기(주)', constType: '지중송전', name: '이일용', type: '일용직', hourlyWage: 18000, specialAllowance: 0 },
    { id: 'm-3', corp: '대원전기(주)', constType: '배전', name: '박안전', type: '일용직', hourlyWage: 16500, specialAllowance: 0 },
    { id: 'm-4', corp: '우창전력(주)', constType: '변전', name: '최전력', type: '정규직', annualSalary: 48000000, specialAllowance: 500000 }, // 연봉 4800만 + 매월 현장수당 50만
  ]);

  // 관리자 입력 상태값
  const [adminCorp, setAdminCorp] = useState('');
  const [adminType, setAdminType] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminWorkerType, setAdminWorkerType] = useState('정규직');
  const [adminWageInput, setAdminWageInput] = useState(''); // 연봉 또는 시급
  const [adminAllowanceInput, setAdminAllowanceInput] = useState(''); // 💡 특별수당 입력창 상태값

  // 일보 작성 상태값
  const [selectedCorp, setSelectedCorp] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // 소트 및 퀵 필터 상태값
  const [filterCorp, setFilterCorp] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 오늘 투입 인원 명단
  const [todayActiveWorkers, setTodayActiveWorkers] = useState([]);

  // 서명 패드 팝업 상태
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState(null);

  const handleCorpChange = (e) => {
    setSelectedCorp(e.target.value);
    setSelectedSite('');
    setSelectedType('');
    setTodayActiveWorkers([]);
    setFilterCorp(e.target.value);
  };

  // 1. 관리자 선등록 - 연봉 + 월 고정 특별수당 통합 입력 세팅
  const handleAdminAddWorker = (e) => {
    e.preventDefault();
    if (!adminCorp || !adminType || !adminName.trim() || !adminWageInput) {
      alert("법인, 공종, 성명, 단가를 기본적으로 모두 입력해 주세요.");
      return;
    }

    const wageNum = Number(adminWageInput);
    const allowanceNum = Number(adminAllowanceInput) || 0; // 수당이 없으면 0원 처리

    const newWorker = {
      id: `admin-${Date.now()}`,
      corp: adminCorp,
      constType: adminType,
      name: adminName.trim(),
      type: adminWorkerType,
      specialAllowance: allowanceNum, // 특별수당 저장
      ...(adminWorkerType === '정규직' ? { annualSalary: wageNum } : { hourlyWage: wageNum })
    };

    setMasterWorkerPool([...masterWorkerPool, newWorker]);
    setAdminName('');
    setAdminWageInput('');
    setAdminAllowanceInput(''); // 수당 입력창 초기화
    alert(`✅ [선등록 완료] 특별수당 정산 연동자로 DB에 등록되었습니다.`);
  };

  // 2. 📋 243시간제 [연봉 + 월 특별수당] 통합 시급 역산 공식 포뮬러
  const calculate243Wage = (worker) => {
    let baseHourlyRate = 0;
    const allowance = worker.specialAllowance || 0;

    if (worker.type === '정규직') {
      // 💡 (연봉 ÷ 12개월) + 월 고정 특별수당액 = 최종 월 정산 대상 총액
      const monthlyBase = (worker.annualSalary || 0) / 12;
      const totalMonthlyTarget = monthlyBase + allowance;
      // 이 최종 월 대상 총액을 243시간으로 정밀 역산하여 리얼 통상시급 산출
      baseHourlyRate = Math.round(totalMonthlyTarget / 243);
    } else {
      // 일용직인 경우 약정 시급에 일일 배분 성격의 수당이 있다면 산입 처리 가능 구조
      baseHourlyRate = (worker.hourlyWage || 0);
    }

    // 일일 총 노임 계산 (연장근무 1.5배 가산)
    const basePay = worker.baseHours * baseHourlyRate;
    const otPay = worker.otHours * baseHourlyRate * 1.5; 
    const totalGrossPay = Math.round(basePay + otPay);

    // 일일 법정 퇴직급여 충당 적립금 계산 (수당이 합산되어 상향된 총 노임의 1/12)
    const severancePay = Math.round(totalGrossPay / 12);

    // 공제 세금(1.65%) 및 4대보험(9.3%) 계산
    const incomeTax = Math.round(totalGrossPay * 0.015); 
    const localIncomeTax = Math.round(incomeTax * 0.1); 
    const totalInsurance = Math.round(totalGrossPay * 0.093); 

    const totalDeductions = incomeTax + localIncomeTax + totalInsurance;
    const netPay = totalGrossPay - totalDeductions;

    return {
      hourlyRate: baseHourlyRate,
      grossPay: totalGrossPay,
      severance: severancePay,
      tax: incomeTax + localIncomeTax,
      insurance: totalInsurance,
      netPay: netPay
    };
  };

  const handleToggleSelectWorker = (worker) => {
    const isAlreadyAdded = todayActiveWorkers.some(w => w.id === worker.id);
    if (isAlreadyAdded) {
      setTodayActiveWorkers(todayActiveWorkers.filter(w => w.id !== worker.id));
    } else {
      setTodayActiveWorkers([
        ...todayActiveWorkers,
        { ...worker, baseHours: 8, otHours: 0, healthOk: false, signatureUrl: null }
      ]);
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
    return {
      gross: acc.gross + calc.grossPay,
      severance: acc.severance + calc.severance,
      tax: acc.tax + calc.tax,
      net: acc.net + calc.netPay
    };
  }, { gross: 0, severance: 0, tax: 0, net: 0 });

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-44 font-sans text-slate-800 antialiased">
      
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-5 shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black tracking-tight">⚙️ 대원 통합 관리 (수당 정산판)</h1>
          <span className="bg-blue-600 text-[11px] px-2.5 py-1 rounded-full font-bold">직책·특별수당 연동</span>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
            📝 현장 출역일보 작성
          </button>
          <button onClick={() => setActiveTab('admin')} className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
            👮 근로자 특별수당 선등록
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        
        {/* 모드 1: 관리자 선등록 탭 화면 */}
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
                
                {/* 수당 및 연봉 입력 블록 분리화 */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">
                      {adminWorkerType === '정규직' ? '💡 총 계약 연봉금액 입력 (원 단위, 예: 48000000)' : '💡 약정 통상 시급 입력'}
                    </label>
                    <input 
                      type="number" placeholder={adminWorkerType === '정규직' ? "예: 48000000" : "예: 18000"} 
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                      value={adminWageInput} onChange={e => setAdminWageInput(e.target.value)}
                    />
                  </div>
                  
                  {/* 🎯 [핵심 요구사항] 정규직 직책·특별수당 고정 입력창 단독 구성 */}
                  {adminWorkerType === '정규직' && (
                    <div>
                      <label className="block text-[10px] text-blue-500 font-bold mb-1">💡 매월 고정 특별수당 / 직책수당 입력 (선택사항, 없을 시 공란)</label>
                      <input 
                        type="number" placeholder="예: 매월 300000" 
                        className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-xs font-bold outline-none focus:border-blue-500"
                        value={adminAllowanceInput} onChange={e => setAdminAllowanceInput(e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="pt-1">
                    <button type="submit" className="w-full bg-slate-900 text-white text-xs py-3 rounded-xl font-bold hover:bg-slate-800">등록 완료 및 마스터 DB 저장</button>
                  </div>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-2xl shadow-md border border-slate-200/60">
              <h2 className="text-xs font-black text-slate-400 uppercase mb-2">243시간제 수당 연동 명부 ({masterWorkerPool.length}명)</h2>
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {masterWorkerPool.map(w => {
                  const allowance = w.specialAllowance || 0;
                  const calculatedRate = w.type === '정규직' ? Math.round(((w.annualSalary / 12) + allowance) / 243) : w.hourlyWage;
                  return (
                    <div key={w.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border">
                      <div>
                        <span className="font-black text-slate-900 mr-2">{w.name} ({w.type[0]})</span>
                        <span className="text-[10px] text-slate-500">{w.corp}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-blue-600 block">통합시급: {calculatedRate.toLocaleString()}원</span>
                        <span className="text-[9px] text-slate-400">
                          {w.type === '정규직' ? `연 ${(w.annualSalary/10000).toLocaleString()}만 ${allowance > 0 ? `+ 수당 ${allowance.toLocaleString()}원` : ''}` : '시급제'}
                        </span>
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
                    const allowance = worker.specialAllowance || 0;
                    return (
                      <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-black text-slate-900">{worker.name}</span>
                            {allowance > 0 && <span className="text-[9px] bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-indigo-700 font-bold">수당대상자</span>}
                            <span className="text-[9px] bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 text-emerald-700 font-bold">통합산출시급: {calc.hourlyRate.toLocaleString()}원</span>
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

                        {/* 특별수당이 정밀 연동된 블랙 마스터 명세 보드 스크린 */}
                        <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                          {allowance > 0 && <div className="flex justify-between text-indigo-400"><span>📢 월 약정 특별수당 기본값:</span><span>{allowance.toLocaleString()} 원 / 월</span></div>}
                          <div className="flex justify-between"><span className="text-slate-400">💰 일일 노임 총액 (수당포함 시급기준):</span><span className="font-bold text-white">{calc.grossPay.toLocaleString()} 원</span></div>
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

      {/* 하단 통합 전산 집계 바 */}
      {activeTab === 'daily' && todayActiveWorkers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-[11px] font-black px-1">
              <span className="text-slate-600">노임총액: {totalSummary.gross.toLocaleString()}원</span>
              <span className="text-blue-600">퇴직적립: {totalSummary.severance.toLocaleString()}원</span>
              <span className="text-red-500">세금공제: {totalSummary.tax.toLocaleString()}원</span>
            </div>
            <button 
              onClick={() => {
                if(todayActiveWorkers.some(w => !w.healthOk || !w.signatureUrl)) {
                  alert("⚠️ TBM 안전 서명이나 건강체크가 안 된 근로자가 있습니다.");
                  return;
                }
                alert(`✅ [특별수당 포함 정산 데이터 연동 완료]\n\n오늘 총 노무비 ${totalSummary.gross.toLocaleString()}원이 수당 분배 규칙에 맞춰 안전하게 ERP로 전송되었습니다.`);
              }}
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