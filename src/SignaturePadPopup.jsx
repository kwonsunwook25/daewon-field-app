import React, { useRef, useState, useEffect } from 'react';

export default function SignaturePadPopup({ isOpen, onClose, onSave, workerName, workerId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      canvasRef.current.getContext('2d').closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    setIsUploading(true);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("서명 이미지 생성 실패");
        setIsUploading(false);
        return;
      }
      const fileName = `sig_${workerId || 'unknown'}_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload-signature', { method: 'POST', body: formData });
        if (!response.ok) throw new Error("업로드 실패");
        const data = await response.json();
        onSave(data.url); 
        onClose();
      } catch (error) {
        alert("서명 파일 클라우드 업로드 중 오류가 발생했습니다.");
      } finally {
        setIsUploading(false);
      }
    }, 'image/jpeg', 0.5); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-blue-800 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">안전보건 서약 서명</h3>
          <button onClick={onClose} disabled={isUploading} className="text-white hover:text-gray-300">X</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <p className="font-bold">성명: {workerName}</p>
          <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden">
            <canvas
              ref={canvasRef} width={340} height={200}
              className="w-full touch-none cursor-crosshair bg-transparent"
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
              onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={clearCanvas} disabled={isUploading} className="flex-1 py-3 bg-slate-200 font-bold rounded-xl">다시 쓰기</button>
            <button onClick={handleSave} disabled={isUploading} className="flex-1 py-3 bg-blue-700 text-white font-bold rounded-xl">
              {isUploading ? "저장 중..." : "서명 완료"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}