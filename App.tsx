
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RowData } from './types';
import Header from './components/Header';
import CalculatorTable from './components/CalculatorTable';
import VirtualKeyboard from './components/VirtualKeyboard';
import Footer from './components/Footer';
import Bubbles from './components/Bubbles';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('userName') || '');
  const [rows, setRows] = useState<RowData[]>(() => {
    const saved = localStorage.getItem('percentageCalculatorData');
    if (saved) return JSON.parse(saved);
    return Array.from({ length: 9 }, (_, i) => ({ id: i + 1, billA: 0, billB: 0 }));
  });
  
  const [activeCell, setActiveCell] = useState<{ rowId: number; col: 'A' | 'B' } | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('userName', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('percentageCalculatorData', JSON.stringify(rows));
  }, [rows]);

  const handleUpdateValue = useCallback((rowId: number, col: 'A' | 'B', value: number) => {
    setRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, [col === 'A' ? 'billA' : 'billB']: value } : row
    ));
  }, []);

  const handleAddRow = () => {
    setRows(prev => [...prev, { id: prev.length > 0 ? Math.max(...prev.map(r => r.id)) + 1 : 1, billA: 0, billB: 0 }]);
  };

  const handleDeleteRow = () => {
    if (rows.length <= 1) return;
    setRows(prev => prev.slice(0, -1));
  };

  const handleReset = () => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại bảng tính?")) {
      setRows(Array.from({ length: 9 }, (_, i) => ({ id: i + 1, billA: 0, billB: 0 })));
      setUserName('');
    }
  };

  const openKeyboard = (rowId: number, col: 'A' | 'B') => {
    setActiveCell({ rowId, col });
    setIsKeyboardOpen(true);
  };

  const handleExport = () => {
    // @ts-ignore
    const XLSX = window.XLSX;
    if (!XLSX) return;

    const data = [
      ['STT', 'BILL (A) VNĐ', '0.4% VNĐ', 'BILL (B) VNĐ', '0.2% VNĐ', 'TỔNG VNĐ'],
      ...rows.map((r, i) => [
        i + 1,
        r.billA.toLocaleString('vi-VN'),
        (r.billA * 0.004).toLocaleString('vi-VN') + ' VNĐ',
        r.billB.toLocaleString('vi-VN'),
        (r.billB * 0.002).toLocaleString('vi-VN') + ' VNĐ',
        (r.billA * 0.004 + r.billB * 0.002).toLocaleString('vi-VN') + ' VNĐ'
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commission Report");
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Hoa_Hong_CTV_${userName || 'User'}_${dateStr}.xlsx`);
  };

  return (
    <div className="relative z-0 min-h-screen flex flex-col items-center pb-20 overflow-hidden">
      <Bubbles />
      
      <Header userName={userName} setUserName={setUserName} />

      <main className="w-full max-w-6xl px-4 md:px-8 mt-8">
        <CalculatorTable 
          rows={rows} 
          openKeyboard={openKeyboard} 
          activeCell={activeCell}
        />

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button 
            onClick={handleAddRow}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-1"
          >
            <span>➕</span> Thêm Hàng
          </button>
          <button 
            onClick={handleDeleteRow}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-1"
          >
            <span>🗑️</span> Xóa Hàng
          </button>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-1"
          >
            <span>🔄</span> Đặt Lại
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-1"
          >
            <span>📊</span> Xuất Excel
          </button>
        </div>
      </main>

      <Footer />

      {isKeyboardOpen && activeCell && (
        <VirtualKeyboard 
          initialValue={rows.find(r => r.id === activeCell.rowId)?.[activeCell.col === 'A' ? 'billA' : 'billB'] || 0}
          onClose={() => setIsKeyboardOpen(false)}
          onUpdate={(val) => handleUpdateValue(activeCell.rowId, activeCell.col, val)}
          onNext={() => {
             // Logic to move to next cell
             if (activeCell.col === 'A') {
               setActiveCell({ ...activeCell, col: 'B' });
             } else {
               const nextRow = rows.find(r => r.id > activeCell.rowId);
               if (nextRow) {
                 setActiveCell({ rowId: nextRow.id, col: 'A' });
               } else {
                 handleAddRow();
                 setActiveCell(prev => prev ? { rowId: prev.rowId + 1, col: 'A' } : null);
               }
             }
          }}
          label={`Hàng ${rows.findIndex(r => r.id === activeCell.rowId) + 1} - Bill ${activeCell.col}`}
        />
      )}
    </div>
  );
};

export default App;
