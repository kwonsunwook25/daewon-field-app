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

  // 💡 [243시간제 인력 DB] 단가 정산용 기본 월급 및 시급 단가 컬럼 추가
  const [masterWorkerPool, setMasterWorkerPool] = useState([
    { id: 'm-1', corp: '대원전기(주)', constType: '배전', name: '김정규', type: '정규직', monthlyWage: 4500000 }, // 월급 기준
    { id: 'm-2', corp: '대원전기(주)', constType: '지중송전', name: '이일용', type: '일용직', hourlyWage: 18000 }, // 시급 기준
    { id: 'm-3', corp: '대원전기(주)', constType: '배전', name: '박안전', type: '일용직', hourlyWage: 16500 },
    { id: 'm-4', corp: '우창전력(주)', constType: '변전', name: '최전력', type: '정규직', monthlyWage: 4200000 },
  ]);

  // 관리자 입력 상태값
  const [adminCorp, setAdminCorp] = useState('');
  const [adminType, setAdminType] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminWorkerType, setAdminWorkerType] = useState('정규직');
  const [adminWageInput, setAdminWageInput] = useState(''); // 월급 또는 시급 입력용

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

  // 1. 관리자 선등록 - 243시간제 기반 단가 입력 기능
  const handleAdminAddWorker = (e) => {
    e.preventDefault();
    if (!adminCorp || !adminType || !adminName.trim() || !adminWageInput) {
      alert("법인, 공종, 성명, 단가(월급/시급)를 모두 입력해 주세요.");
      return;
    }

    const wageNum = Number(adminWageInput);
    const newWorker = {
      id: `admin-${Date.now()}`,
      corp: adminCorp,
      constType: adminType,
      name: adminName.trim(),
      type: adminWorkerType,
      ...(adminWorkerType === '정규직' ? { monthlyWage: wageNum } : { hourlyWage: wageNum })
    };

    setMasterWorkerPool([...masterWorkerPool, newWorker]);
    setAdminName('');
    setAdminWageInput('');
    alert(`✅ [선등록 완료] 243시간제 정산 대상자로 등록되었습니다.`);
  };

  // 2. 📋 243시간제 기반 급여, 소득세, 4대보험 실시간 계산 핵심 공식 로직
  const calculate243Wage = (worker) => {
    // 243제 기본 정산 시급 도출
    let baseHourlyRate = 0;
    if (worker.type === '정규직') {
      // 💡 월급을 243시간으로 나누어 기본 통상 시급 정밀 산출
      baseHourlyRate = Math.round(worker.monthlyWage / 243);
    } else {
      baseHourlyRate = worker.hourlyWage || 0;
    }

    // 주간노임 = 주간근무시간 * 통상시급
    const basePay = worker.baseHours * baseHourlyRate;
    // 연장노임 = 연장근무시간 * 통상시급 * 1.5배 가산 적용
    const otPay = worker.otHours * baseHourlyRate * 1.5;
    const totalGrossPay = Math.round(basePay + otPay);

    // 💡 세금 및 4대보험 공제 정산율 (243제 세무 표준 적용)
    // 갑근세(소득세)+지방소득세 대략 1.5%, 고용보험 0.9%, 국민/건강/장기요양 등 일괄 모의 정산율 9.3% 적용
    const incomeTax = Math.round(totalGrossPay * 0.015); // 소득세
    const localIncomeTax = Math.round(incomeTax * 0.1); // 지방소득세
    const totalInsurance = Math.round(totalGrossPay * 0.093); // 4대보험 근로자부담분 계산

    const totalDeductions = incomeTax + localIncomeTax + totalInsurance;
    const netPay = totalGrossPay - totalDeductions; // 차인지급액(실수령)

    return {
      hourlyRate: baseHourlyRate,
      grossPay: totalGrossPay,
      tax: incomeTax + localIncomeTax,
      insurance: totalInsurance,
      netPay: netPay
    };
  };

  // 3. 오늘 출역 명단에 인원 토글
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

  // 총액 집계용 계산
  const totalSummary = todayActiveWorkers.reduce((acc, curr) => {
    const calc = calculate243Wage(curr);
    return {
      gross: acc.gross + calc.grossPay,
      tax: acc.tax + calc.tax,
      net: acc.net + calc.netPay
    };
  }, { gross: 0, tax: 0, net: 0 });

  return (
    <div className="max-w-md mx-auto bg-slate-100 min-h-screen pb-40 font-sans text-slate-800 antialiased">
      
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-5 shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black tracking-tight">⚙️ 대원 통합 관리 (243시간제)</h1>
          <span className="bg-blue-600 text-[11px] px-2.5 py-1 rounded-full font-bold">243 공수제용</span>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl">
          <button onClick={() => setActiveTab('daily')} className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
            📝 현장 출역일보 작성
          </button>
          <button onClick={() => setActiveTab('admin')} className={`flex-1 text-center py-2.5 text-xs font-black rounded-lg transition-all ${activeTab === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}>
            👮 근로자 243제 선등록
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        
        {/* 모드 1: 관리자 선등록 탭 화면 */}
        {activeTab === 'admin' && (
          <div className="space-y-4 animate-fade-in">
            <section className="bg-white p-5 rounded-2xl shadow-md border border-slate-200/60 space-y-3">
              <h2 className="text-sm font-extrabold text-slate-800">👤 243시간제 정산 근로자 선등록</h2>
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
                    <option value="정규직">정규직 (월급 정산)</option>
                    <option value="일용직">일용직 (시급 정산)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">
                    {adminWorkerType === '정규직' ? '💡 기본 월급 입력 (243시간으로 시급 환산)' : '💡 약정 통상 시급 입력'}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="number" placeholder={adminWorkerType === '정규직' ? "예: 4500000" : "예: 18000"} 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                      value={adminWageInput} onChange={e => setAdminWageInput(e.target.value)}
                    />
                    <button type="submit" className="bg-slate-900 text-white text-xs px-5 rounded-xl font-bold hover:bg-slate-800">선등록 저장</button>
                  </div>
                </div>
              </form>
            </section>

            <section className="bg-white p-4 rounded-2xl shadow-md border border-slate-200/60">
              <h2 className="text-xs font-black text-slate-400 uppercase mb-2">243시간제 등록부 ({masterWorkerPool.length}명)</h2>
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {masterWorkerPool.map(w => {
                  const calculatedRate = w.type === '정규직' ? Math.round(w.monthlyWage / 243) : w.hourlyWage;
                  return (
                    <div key={w.id} className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl border">
                      <div>
                        <span className="font-black text-slate-900 mr-2">{w.name} ({w.type[0]})</span>
                        <span className="text-[10px] text-slate-500">{w.corp}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-blue-600 block">환산시급: {calculatedRate.toLocaleString()}원</span>
                        <span className="text-[9px] text-slate-400">{w.type === '정규직' ? `월 ${w.monthlyWage.toLocaleString()}원` : '시급제'}</span>
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
                {/* 검색 필터 정렬 시스템 */}
                <section className="bg-white p-4 rounded-2xl shadow-md border border-blue-200/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-900">🔍 근로자 검색 정렬 (243제 매칭)</h3>
                  </div>
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

                {/* 당일 배치 인원 명단 카드 (세금/정산 내역 실시간 출력) */}
                <section className="space-y-3">
                  <h3 className="text-xs font-black text-slate-500 px-1">👷 오늘 현장 투입 정산 명단 ({todayActiveWorkers.length}명)</h3>
                  {todayActiveWorkers.map(worker => {
                    const calc = calculate243Wage(worker);
                    return (
                      <div key={worker.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-black text-slate-900">{worker.name}</span>
                            <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 border rounded text-slate-600 font-bold">{worker.corp}</span>
                            <span className="text-[9px] bg-amber-50 px-1.5 py-0.5 border border-amber-200 text-amber-700 font-bold">243환산시급: {calc.hourlyRate.toLocaleString()}원</span>
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

                        {/* 💡 실시간 243 정산 및 공제내역 노출판 */}
                        <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                          <div className="flex justify-between"><span className="text-slate-400">💰 일일 노임 총액:</span><span className="font-bold text-white">{calc.grossPay.toLocaleString()} 원</span></div>
                          <div className="flex justify-between text-red-400"><span>└ 갑근세+지방세(1.65%):</span><span>- {calc.tax.toLocaleString()} 원</span></div>
                          <div className="flex justify-between text-red-400"><span>└ 4대보험 근로자분(9.3%):</span><span>- {calc.insurance.toLocaleString()} 원</span></div>
                          <div className="border-t border-slate-700 my-1"></div>
                          <div className="flex justify-between text-emerald-400 font-bold"><span>💵 차인 실수령액:</span><span>{calc.netPay.toLocaleString()} 원</span></div>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border text-xs space-y-2">
                          <label className="flex justify-between items-center cursor-pointer">
                            <span className={worker.healthOk ? 'text-slate-600 font-bold' : 'text-red-500 font-black'}>🩺 당일 건강 상태 정상 여부</span>
                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={worker.healthOk} onChange={() => setTodayActiveWorkers(todayActiveWorkers.map(w => w.id === worker.id ? {...w, healthOk: !w.healthOk} : w))} />
                          </label>
                          <div className="flex justify-between items-center pt-1.5 border-t">
                            <span className={worker.signatureUrl ? 'text-blue-700 font-black' : 'text-slate-500 font-bold'}> Worker TBM 서명 확인</span>
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

      {/* 하단 집계 및 데이터 전송 바 */}
      {activeTab === 'daily' && todayActiveWorkers.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600 px-1">
              <span>총 노무비: {totalSummary.gross.toLocaleString()}원</span>
              <span className="text-red-500">총 공제세금: {totalSummary.tax.toLocaleString()}원</span>
            </div>
            <button 
              onClick={() => {
                if(todayActiveWorkers.some(w => !w.healthOk || !w.signatureUrl)) {
                  alert("⚠️ TBM 안전 서명이나 건강체크가 안 된 근로자가 있습니다.");
                  return;
                }
                alert(`✅ [243시간제 데이터 정산 완료]\n\n오늘 총 노무비 ${totalSummary.gross.toLocaleString()}원이 법인별 정산 계정에 반영되었습니다.`);
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