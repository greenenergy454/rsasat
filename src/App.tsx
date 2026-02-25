import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, Users, ClipboardList, Truck, Plus, Trash2, Edit2, 
  CheckCircle2, AlertCircle, XCircle, Package, ArrowLeftRight, Search, 
  LogIn, LogOut, UserCircle 
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { ItemStatus, Department, Worker, CustodyItem, OperationLog } from './types';

// --- Mock Data ---
const INITIAL_DEPARTMENTS: Department[] = [
  { id: '1', name: 'قسم الصيانة' },
  { id: '2', name: 'قسم التركيبات' },
];

const INITIAL_WORKERS: Worker[] = [
  { id: '1', name: 'أحمد محمد', departmentId: '1', status: 'active', password: '123' },
  { id: '2', name: 'سارة خالد', departmentId: '2', status: 'active', password: '123' },
];

// --- Subcomponents ---

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
        active 
          ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`}>
        {icon}
      </span>
      <span className="font-bold text-sm">{label}</span>
      {active && <motion.div layoutId="active-pill" className="mr-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-400">{title}</p>
        <p className="text-3xl font-black text-slate-800">{value}</p>
      </div>
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
        {icon}
      </div>
    </div>
  );
}

function Modal({ isOpen, onClose, onConfirm, title, message, confirmText = "تأكيد", cancelText = "إلغاء", type = "danger" }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-8">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
            {type === 'danger' ? <Trash2 size={28} /> : <AlertCircle size={28} />}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="bg-slate-50 p-6 flex gap-3">
          <button 
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
          >
            {confirmText}
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: ItemStatus }) {
  const colors = {
    [ItemStatus.AVAILABLE]: 'bg-slate-100 text-slate-600',
    [ItemStatus.ASSIGNED]: 'bg-blue-50 text-blue-600',
    [ItemStatus.INSTALLED]: 'bg-emerald-50 text-emerald-600',
    [ItemStatus.DAMAGED]: 'bg-red-50 text-red-600',
    [ItemStatus.LOST]: 'bg-orange-50 text-orange-600',
  };
  return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${colors[status]}`}>{status}</span>;
}

// --- Login Screen ---

function LoginScreen({ onLogin, workers }: { onLogin: (role: 'admin' | 'worker', user?: Worker) => void, workers: Worker[] }) {
  const [mode, setMode] = useState<'admin' | 'worker'>('admin');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (mode === 'admin') {
      if (id.trim().toLowerCase() === 'admin' && password === 'admin') {
        onLogin('admin');
      } else {
        alert('بيانات المدير غير صحيحة (admin/admin)');
      }
    } else {
      if (!id) {
        alert('يرجى اختيار اسم العامل');
        return;
      }
      const worker = workers.find(w => w.id === id);
      if (worker && (worker.password === password || (!worker.password && password === '123'))) {
        onLogin('worker', worker);
      } else {
        alert('كلمة المرور غير صحيحة (الافتراضية هي 123)');
      }
    }
  };

  const switchMode = (newMode: 'admin' | 'worker') => {
    setMode(newMode);
    setId('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 border border-slate-100"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <Package size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800">نظام إدارة العهدة</h1>
          <p className="text-slate-500 mt-2">يرجى تسجيل الدخول للمتابعة</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
          <button 
            type="button"
            onClick={() => switchMode('admin')} 
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            مدير النظام
          </button>
          <button 
            type="button"
            onClick={() => switchMode('worker')} 
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${mode === 'worker' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            عامل ميداني
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 mr-1">
              {mode === 'admin' ? 'اسم المستخدم' : 'اختر اسمك من القائمة'}
            </label>
            {mode === 'admin' ? (
              <input 
                type="text" 
                placeholder="admin" 
                className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                value={id} 
                onChange={e => setId(e.target.value)} 
              />
            ) : (
              <select 
                className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white" 
                value={id} 
                onChange={e => setId(e.target.value)}
              >
                <option value="">اختر العامل...</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600 mr-1">كلمة المرور</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            {mode === 'worker' && <p className="text-[10px] text-slate-400 mr-1">كلمة المرور الافتراضية هي 123</p>}
          </div>

          <button 
            type="button"
            onClick={handleLogin} 
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
          >
            دخول للنظام
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Views ---

const DashboardView = ({ stats, logs, workers }: { stats: any, logs: OperationLog[], workers: Worker[] }) => {
  const chartData = [
    { name: 'مركبة', value: stats.installed, color: '#10b981' },
    { name: 'تالفة', value: stats.damaged, color: '#ef4444' },
    { name: 'مفقودة', value: stats.lost, color: '#f59e0b' },
    { name: 'مع العمال', value: stats.assigned, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الرصاصات" value={stats.total} icon={<Package className="text-blue-500" />} />
        <StatCard title="مركبة" value={stats.installed} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard title="تالفة" value={stats.damaged} icon={<AlertCircle className="text-red-500" />} />
        <StatCard title="مفقودة" value={stats.lost} icon={<XCircle className="text-orange-500" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6">أحدث العمليات</h2>
          <table className="w-full text-right">
            <thead>
              <tr className="text-slate-400 text-sm border-b border-slate-50">
                <th className="pb-4">الرقم</th>
                <th className="pb-4">الحالة</th>
                <th className="pb-4">العامل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.slice(0, 5).map(log => (
                <tr key={log.id}>
                  <td className="py-4 font-mono">{log.serialNumber}</td>
                  <td className="py-4"><StatusBadge status={log.status} /></td>
                  <td className="py-4">{workers.find(w => w.id === log.workerId)?.name || 'نظام'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-6 w-full">توزيع الحالات</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryView = ({ items, setItems }: { items: CustodyItem[], setItems: React.Dispatch<React.SetStateAction<CustodyItem[]>> }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const available = items.filter(i => i.status === ItemStatus.AVAILABLE);

  const addStock = () => {
    const f = parseInt(from), t = parseInt(to);
    if (isNaN(f) || isNaN(t) || f > t) return alert('نطاق غير صحيح');
    
    setItems(prev => {
      const newItems: CustodyItem[] = [];
      for (let i = f; i <= t; i++) {
        const serial = i.toString();
        if (!prev.find(item => item.serialNumber === serial)) {
          newItems.push({ serialNumber: serial, status: ItemStatus.AVAILABLE });
        }
      }
      return [...prev, ...newItems];
    });
    setFrom(''); setTo('');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6">إضافة للمخزون</h2>
        <div className="flex gap-4">
          <input type="number" placeholder="من" className="flex-1 border rounded-xl px-4 py-2" value={from} onChange={e => setFrom(e.target.value)} />
          <input type="number" placeholder="إلى" className="flex-1 border rounded-xl px-4 py-2" value={to} onChange={e => setTo(e.target.value)} />
          <button onClick={addStock} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold">إضافة</button>
        </div>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6">المخزون المتوفر ({available.length})</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto">
          {available.map(i => <div key={i.serialNumber} className="bg-slate-50 p-2 rounded text-center text-xs font-mono">{i.serialNumber}</div>)}
        </div>
      </div>
    </div>
  );
};

const ManagementView = ({ 
  departments, 
  workers, 
  onAddDept, 
  onDeleteDept, 
  onAddWorker, 
  onDeleteWorker 
}: any) => {
  const [dName, setDName] = useState('');
  const [wName, setWName] = useState('');
  const [wDept, setWDept] = useState('');
  const [wPass, setWPass] = useState('123');
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [editingDept, setEditingDept] = useState<any>(null);

  const handleAddDept = () => {
    if (!dName) return;
    onAddDept(dName, editingDept?.id);
    setEditingDept(null);
    setDName('');
  };

  const handleAddWorker = () => {
    if (!wName || !wDept) return alert('يرجى إكمال البيانات');
    onAddWorker({ name: wName, departmentId: wDept, password: wPass }, editingWorker?.id);
    setEditingWorker(null);
    setWName(''); setWDept(''); setWPass('123');
  };

  const startEditWorker = (worker: any) => {
    setEditingWorker(worker);
    setWName(worker.name);
    setWDept(worker.departmentId);
    setWPass(worker.password || '123');
  };

  const startEditDept = (dept: any) => {
    setEditingDept(dept);
    setDName(dept.name);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LayoutDashboard size={20} className="text-blue-500" />
          الأقسام
        </h2>
        <div className="flex gap-2 mb-6">
          <input 
            placeholder={editingDept ? "تعديل اسم القسم" : "اسم القسم الجديد"} 
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
            value={dName} 
            onChange={e => setDName(e.target.value)} 
          />
          <button 
            type="button"
            onClick={handleAddDept} 
            className={`${editingDept ? 'bg-emerald-600' : 'bg-blue-600'} text-white px-4 py-3 rounded-xl hover:opacity-90 transition-all`}
          >
            {editingDept ? <CheckCircle2 size={20}/> : <Plus size={20}/>}
          </button>
          {editingDept && (
            <button 
              type="button"
              onClick={() => { setEditingDept(null); setDName(''); }} 
              className="bg-slate-200 text-slate-600 px-4 py-3 rounded-xl hover:bg-slate-300 transition-all"
            >
              إلغاء
            </button>
          )}
        </div>
        <div className="space-y-2">
          {departments.map((d: any) => (
            <div key={d.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center group hover:bg-slate-100 transition-colors">
              <span className="font-bold text-slate-700">{d.name}</span>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => startEditDept(d)} 
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                  title="تعديل"
                >
                  <Edit2 size={18}/>
                </button>
                <button 
                  type="button"
                  onClick={() => onDeleteDept(d.id)} 
                  className="text-slate-300 hover:text-red-500 transition-colors"
                  title="حذف"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Users size={20} className="text-blue-500" />
          العمال
        </h2>
        <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl">
          <h3 className="font-bold text-sm text-slate-500 mb-2">{editingWorker ? 'تعديل بيانات عامل' : 'إضافة عامل جديد'}</h3>
          <input 
            placeholder="اسم العامل" 
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" 
            value={wName} 
            onChange={e => setWName(e.target.value)} 
          />
          <div className="grid grid-cols-2 gap-4">
            <select 
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" 
              value={wDept} 
              onChange={e => setWDept(e.target.value)}
            >
              <option value="">اختر القسم</option>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input 
              placeholder="كلمة المرور" 
              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white" 
              value={wPass} 
              onChange={e => setWPass(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleAddWorker} 
              className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${editingWorker ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {editingWorker ? 'حفظ التعديلات' : 'إضافة عامل'}
            </button>
            {editingWorker && (
              <button 
                type="button"
                onClick={() => { setEditingWorker(null); setWName(''); setWDept(''); setWPass('123'); }} 
                className="px-4 py-3 rounded-xl font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 transition-all"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {workers.map((w: any) => (
            <div key={w.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
              <button 
                type="button"
                onClick={() => onDeleteWorker(w.id)} 
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="حذف"
              >
                <Trash2 size={18}/>
              </button>
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                    <UserCircle size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{w.name}</div>
                    <div className="text-xs text-slate-400">{departments.find((d: any) => d.id === w.departmentId)?.name || 'بدون قسم'}</div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => startEditWorker(w)} 
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="تعديل"
                >
                  <Edit2 size={18}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DeliveryView = ({ workers, items, setItems, setLogs }: any) => {
  const [wid, setWid] = useState('');
  const [f, setF] = useState('');
  const [t, setT] = useState('');

  const deliver = () => {
    const from = parseInt(f), to = parseInt(t);
    if (!wid || isNaN(from) || isNaN(to)) return alert('بيانات ناقصة');
    const today = new Date().toISOString().split('T')[0];
    
    setItems((prev: CustodyItem[]) => {
      const updated = [...prev];
      const newLogs: any[] = [];
      let count = 0;
      for (let i = from; i <= to; i++) {
        const serial = i.toString();
        const idx = updated.findIndex(x => x.serialNumber === serial && x.status === ItemStatus.AVAILABLE);
        if (idx > -1) {
          updated[idx] = { ...updated[idx], status: ItemStatus.ASSIGNED, workerId: wid, deliveryDate: today };
          newLogs.push({ 
            id: Math.random().toString(), 
            serialNumber: serial, 
            workerId: wid, 
            status: ItemStatus.ASSIGNED, 
            timestamp: new Date().toISOString() 
          });
          count++;
        }
      }
      
      if (count > 0) {
        setLogs((prevLogs: any) => [...newLogs, ...prevLogs]);
        setTimeout(() => alert(`تم تسليم ${count} رصاصة بنجاح`), 100);
      } else {
        setTimeout(() => alert('لا توجد رصاصات متوفرة في هذا النطاق'), 100);
      }
      
      return updated;
    });
    
    setF(''); setT('');
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold mb-8 text-center">تسليم عهدة</h2>
      <div className="space-y-6">
        <select className="w-full border rounded-2xl px-4 py-3" value={wid} onChange={e => setWid(e.target.value)}>
          <option value="">اختر العامل</option>
          {workers.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="من" type="number" className="border rounded-2xl px-4 py-3" value={f} onChange={e => setF(e.target.value)} />
          <input placeholder="إلى" type="number" className="border rounded-2xl px-4 py-3" value={t} onChange={e => setT(e.target.value)} />
        </div>
        <button onClick={deliver} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg">تأكيد التسليم</button>
      </div>
    </div>
  );
};

const LogView = ({ 
  items, 
  workers, 
  departments,
  updateItemStatus,
  returnToStock,
  onBulkReturn
}: { 
  items: CustodyItem[], 
  workers: Worker[], 
  departments: Department[],
  updateItemStatus: (serial: string, status: ItemStatus, meter?: string, notes?: string, type?: string) => void,
  returnToStock: (serial: string) => void,
  onBulkReturn: (serials: string[]) => void
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const worker = workers.find(w => w.id === item.workerId);
      const workerName = worker?.name || '';
      const workerDeptId = worker?.departmentId || '';
      
      const matchesSearch = item.serialNumber.includes(searchTerm) || workerName.includes(searchTerm);
      const matchesWorker = !filterWorker || item.workerId === filterWorker;
      const matchesDept = !filterDept || workerDeptId === filterDept;
      const matchesStatus = !filterStatus || item.status === filterStatus;
      
      return matchesSearch && matchesWorker && matchesDept && matchesStatus;
    });
  }, [items, searchTerm, workers, filterWorker, filterDept, filterStatus]);

  const exportToExcel = () => {
    const data = filteredItems.map(item => ({
      'الرقم التسلسلي': item.serialNumber,
      'الحالة': item.status,
      'العامل المستلم': workers.find(w => w.id === item.workerId)?.name || '-',
      'تاريخ التسليم': item.deliveryDate || '-',
      'تاريخ التركيب': item.installationDate || '-',
      'النوع': item.operationType || '-',
      'رقم العداد/العلبة': item.meterNumber || '-',
      'ملاحظات': item.notes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "سجل العهدة");
    XLSX.writeFile(workbook, `سجل_العهدة_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSerials(filteredItems.map(i => i.serialNumber));
    } else {
      setSelectedSerials([]);
    }
  };

  const handleSelectOne = (serial: string) => {
    setSelectedSerials(prev => 
      prev.includes(serial) ? prev.filter(s => s !== serial) : [...prev, serial]
    );
  };

  const handleBulkReturn = () => {
    if (selectedSerials.length === 0) return;
    onBulkReturn(selectedSerials);
    setSelectedSerials([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">سجل العهدة</h1>
          <p className="text-slate-500 mt-1">تتبع حالة كل رصاصة بشكل منفرد</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {selectedSerials.length > 0 && (
            <button 
              type="button"
              onClick={handleBulkReturn}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <ArrowLeftRight size={18} />
              إرجاع المحددة ({selectedSerials.length})
            </button>
          )}
          <button 
            type="button"
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <ArrowLeftRight size={18} className="rotate-90" />
            تصدير إكسل
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث بالرقم أو العامل..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-12 pl-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
        >
          <option value="">كل الأقسام</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select 
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          value={filterWorker}
          onChange={e => setFilterWorker(e.target.value)}
        >
          <option value="">كل العمال</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select 
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">كل الحالات</option>
          {Object.values(ItemStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                <th className="p-4 font-bold w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded cursor-pointer" 
                    onChange={handleSelectAll}
                    checked={selectedSerials.length === filteredItems.length && filteredItems.length > 0}
                  />
                </th>
                <th className="p-4 font-bold">الرقم التسلسلي</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold">العامل المستلم</th>
                <th className="p-4 font-bold">تاريخ التسليم</th>
                <th className="p-4 font-bold">النوع</th>
                <th className="p-4 font-bold">رقم (العداد/العلبة)</th>
                <th className="p-4 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map(item => (
                <tr key={item.serialNumber} className={`hover:bg-slate-50/50 transition-colors ${selectedSerials.includes(item.serialNumber) ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded cursor-pointer" 
                      checked={selectedSerials.includes(item.serialNumber)}
                      onChange={() => handleSelectOne(item.serialNumber)}
                    />
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-700">{item.serialNumber}</td>
                  <td className="p-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-4 text-slate-600">
                    {workers.find(w => w.id === item.workerId)?.name || '-'}
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{item.deliveryDate || '-'}</td>
                  <td className="p-4 text-slate-500">{item.operationType || '-'}</td>
                  <td className="p-4 text-slate-500">{item.meterNumber || '-'}</td>
                  <td className="p-4">
                    <div className="flex gap-3 items-center">
                      {item.status === ItemStatus.ASSIGNED && (
                        <>
                          <button 
                            type="button"
                            onClick={() => {
                              const meter = prompt('أدخل رقم العداد/العلبة:');
                              if (meter) updateItemStatus(item.serialNumber, ItemStatus.INSTALLED, meter, 'تركيب من لوحة التحكم', 'عداد');
                            }}
                            className="text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors"
                          >
                            تركيب
                          </button>
                          <span className="text-slate-200">|</span>
                          <button 
                            type="button"
                            onClick={() => returnToStock(item.serialNumber)}
                            className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
                          >
                            إرجاع
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400">
                    لا توجد بيانات مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const WorkerPortalView = ({ worker, items, updateItemStatus, setWorkers }: any) => {
  const [serial, setSerial] = useState('');
  const [status, setStatus] = useState(ItemStatus.INSTALLED);
  const [meter, setMeter] = useState('');
  const [type, setType] = useState('عداد');
  const [notes, setNotes] = useState('');
  const [showPassChange, setShowPassChange] = useState(false);
  const [newPass, setNewPass] = useState('');
  
  const custody = useMemo(() => 
    items.filter((i: any) => i.workerId === worker?.id && i.status === ItemStatus.ASSIGNED),
    [items, worker]
  );

  const handleSave = () => {
    if (!serial) return alert('يرجى اختيار الرقم التسلسلي');
    if (status === ItemStatus.INSTALLED && !meter) return alert('يرجى إدخال رقم العداد/العلبة');
    if (status === ItemStatus.INSTALLED && !type) return alert('يرجى اختيار نوع الوحدة');
    
    updateItemStatus(serial, status, meter, notes, type);
    setSerial('');
    setMeter('');
    setNotes('');
    alert('تم تسجيل العملية بنجاح');
  };

  const handlePassChange = () => {
    if (!newPass) return alert('يرجى إدخال كلمة المرور الجديدة');
    setWorkers((prev: any) => prev.map((w: any) => w.id === worker.id ? { ...w, password: newPass } : w));
    setShowPassChange(false);
    setNewPass('');
    alert('تم تغيير كلمة المرور بنجاح');
  };

  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <UserCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">مرحباً، {worker?.name}</h2>
              <p className="text-slate-500">قم بتسجيل العمليات الميدانية لعهدتك</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowPassChange(!showPassChange)}
            className="text-slate-400 hover:text-blue-600 transition-colors"
            title="تغيير كلمة المرور"
          >
            <Edit2 size={20} />
          </button>
        </div>

        {showPassChange ? (
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-700">تغيير كلمة المرور</h3>
            <input 
              type="password"
              placeholder="كلمة المرور الجديدة" 
              className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white" 
              value={newPass} 
              onChange={e => setNewPass(e.target.value)} 
            />
            <div className="flex gap-2">
              <button type="button" onClick={handlePassChange} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">حفظ</button>
              <button type="button" onClick={() => setShowPassChange(false)} className="px-6 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 mr-1">الرصاصة المستخدمة</label>
              <select 
                className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white" 
                value={serial} 
                onChange={e => setSerial(e.target.value)}
              >
                <option value="">اختر من عهدتك ({custody.length} متوفر)...</option>
                {custody.map((i: any) => <option key={i.serialNumber} value={i.serialNumber}>{i.serialNumber}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 mr-1">الحالة الجديدة</label>
                <select 
                  className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white" 
                  value={status} 
                  onChange={e => setStatus(e.target.value as any)}
                >
                  <option value={ItemStatus.INSTALLED}>تم التركيب بنجاح</option>
                  <option value={ItemStatus.DAMAGED}>تالفة (أثناء العمل)</option>
                  <option value={ItemStatus.LOST}>مفقودة</option>
                </select>
              </div>
              {status === ItemStatus.INSTALLED && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 mr-1">نوع الوحدة</label>
                  <select 
                    className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all bg-white" 
                    value={type} 
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="عداد">عداد</option>
                    <option value="علبة">علبة</option>
                  </select>
                </div>
              )}
            </div>

            {status === ItemStatus.INSTALLED && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 mr-1">رقم العداد / العلبة</label>
                <input 
                  placeholder="مثلاً: 183000" 
                  className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                  value={meter} 
                  onChange={e => setMeter(e.target.value)} 
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 mr-1">ملاحظات</label>
              <textarea 
                placeholder="أي ملاحظات إضافية..." 
                className="w-full border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" 
                rows={3}
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
              />
            </div>

            <button 
              type="button"
              onClick={handleSave} 
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
            >
              تسجيل العملية
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [role, setRole] = useState<'admin' | 'worker' | null>(() => {
    return localStorage.getItem('custody_role') as any || null;
  });
  const [user, setUser] = useState<Worker | null>(() => {
    const saved = localStorage.getItem('custody_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tab, setTab] = useState(() => {
    return localStorage.getItem('custody_tab') || 'dashboard';
  });
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('custody_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });
  const [workers, setWorkers] = useState<Worker[]>(() => {
    const saved = localStorage.getItem('custody_workers');
    return saved ? JSON.parse(saved) : INITIAL_WORKERS;
  });
  const [items, setItems] = useState<CustodyItem[]>(() => {
    const saved = localStorage.getItem('custody_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Initial Fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        
        // Only overwrite if server has data, otherwise keep localStorage data
        if (data.departments && data.departments.length > 0) setDepartments(data.departments);
        if (data.workers && data.workers.length > 0) setWorkers(data.workers);
        if (data.items && data.items.length > 0) setItems(data.items);
        if (data.logs && data.logs.length > 0) setLogs(data.logs);
      } catch (err) {
        console.error('Failed to load data from server, using local storage');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Sync to Server (Debounced)
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departments, workers, items, logs })
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [departments, workers, items, logs, isLoading]);

  // Local Persistence (Backup)
  useEffect(() => {
    localStorage.setItem('custody_role', role || '');
    localStorage.setItem('custody_user', JSON.stringify(user));
    localStorage.setItem('custody_tab', tab);
    localStorage.setItem('custody_departments', JSON.stringify(departments));
    localStorage.setItem('custody_workers', JSON.stringify(workers));
    localStorage.setItem('custody_items', JSON.stringify(items));
    localStorage.setItem('custody_logs', JSON.stringify(logs));
  }, [role, user, tab, departments, workers, items, logs]);

  const stats = useMemo(() => ({
    total: items.length,
    installed: items.filter(i => i.status === ItemStatus.INSTALLED).length,
    damaged: items.filter(i => i.status === ItemStatus.DAMAGED).length,
    lost: items.filter(i => i.status === ItemStatus.LOST).length,
    assigned: items.filter(i => i.status === ItemStatus.ASSIGNED).length,
  }), [items]);

  const updateItemStatus = (serial: string, status: ItemStatus, meter?: string, notes?: string, type?: string) => {
    setItems(prev => prev.map(item => 
      item.serialNumber === serial 
        ? { 
            ...item, 
            status, 
            meterNumber: meter || item.meterNumber, 
            notes: notes || item.notes,
            operationType: type || item.operationType,
            installationDate: status === ItemStatus.INSTALLED ? new Date().toISOString().split('T')[0] : item.installationDate
          } 
        : item
    ));

    setLogs(prev => [{
      id: Math.random().toString(),
      serialNumber: serial,
      workerId: items.find(i => i.serialNumber === serial)?.workerId || 'system',
      status,
      timestamp: new Date().toISOString(),
      meterNumber: meter,
      notes,
      operationType: type
    }, ...prev]);
  };

  const returnToStock = (serial: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد الإرجاع',
      message: 'هل أنت متأكد من إرجاع هذه الرصاصة للمخزون؟',
      onConfirm: () => {
        setItems(prev => prev.map(item => 
          item.serialNumber === serial 
            ? { ...item, status: ItemStatus.AVAILABLE, workerId: undefined, deliveryDate: undefined, installationDate: undefined, meterNumber: undefined, operationType: undefined, notes: undefined } 
            : item
        ));
        setLogs(prev => [{
          id: Math.random().toString(),
          serialNumber: serial,
          workerId: 'system',
          status: ItemStatus.AVAILABLE,
          timestamp: new Date().toISOString(),
          notes: 'تم الإرجاع للمخزون'
        }, ...prev]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBulkReturn = (serials: string[]) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد الإرجاع الجماعي',
      message: `هل أنت متأكد من إرجاع ${serials.length} رصاصة للمخزون؟`,
      onConfirm: () => {
        setItems(prev => prev.map(item => 
          serials.includes(item.serialNumber)
            ? { 
                ...item, 
                status: ItemStatus.AVAILABLE, 
                workerId: undefined, 
                deliveryDate: undefined, 
                installationDate: undefined, 
                meterNumber: undefined, 
                operationType: undefined,
                notes: undefined
              } 
            : item
        ));

        const newLogs = serials.map(serial => ({
          id: Math.random().toString(),
          serialNumber: serial,
          workerId: 'system',
          status: ItemStatus.AVAILABLE,
          timestamp: new Date().toISOString(),
          notes: 'تم الإرجاع للمخزون (جماعي)'
        }));

        setLogs(prev => [...newLogs, ...prev]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        alert('تم إرجاع الرصاصات المحددة للمخزون بنجاح');
      }
    });
  };

  const handleDeleteWorker = (workerId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف عامل',
      message: 'هل أنت متأكد من حذف العامل؟ سيتم إرجاع جميع العهدة التي بحوزته للمخزون تلقائياً.',
      onConfirm: () => {
        setItems(prev => prev.map(item => 
          item.workerId === workerId && item.status === ItemStatus.ASSIGNED
            ? { 
                ...item, 
                status: ItemStatus.AVAILABLE, 
                workerId: undefined, 
                deliveryDate: undefined,
                installationDate: undefined,
                meterNumber: undefined,
                operationType: undefined,
                notes: undefined
              }
            : item
        ));

        setWorkers(prev => prev.filter(w => w.id !== workerId));
        
        setLogs(prev => [{
          id: Math.random().toString(),
          serialNumber: 'N/A',
          workerId: 'system',
          status: ItemStatus.AVAILABLE,
          timestamp: new Date().toISOString(),
          notes: `تم حذف العامل وإرجاع عهدته للمخزون`
        }, ...prev]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteDept = (deptId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف قسم',
      message: 'هل أنت متأكد من حذف القسم؟',
      onConfirm: () => {
        setDepartments(prev => prev.filter(d => d.id !== deptId));
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddDept = (name: string, id?: string) => {
    if (id) {
      setDepartments(prev => prev.map(d => d.id === id ? { ...d, name } : d));
    } else {
      setDepartments(prev => [...prev, { id: Date.now().toString(), name }]);
    }
  };

  const handleAddWorker = (data: any, id?: string) => {
    if (id) {
      setWorkers(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
    } else {
      setWorkers(prev => [...prev, { id: Date.now().toString(), ...data, status: 'active' }]);
    }
  };

  if (!role) return <LoginScreen onLogin={(r, u) => { setRole(r); setUser(u || null); if(r === 'worker') setTab('worker-portal'); }} workers={workers} />;

  return (
    <div className="min-h-screen flex font-sans" dir="rtl">
      <aside className="w-72 bg-white border-l hidden lg:flex flex-col h-screen sticky top-0">
        <div className="p-8 border-b font-bold text-xl text-blue-600">نظام العهدة</div>
        <nav className="flex-1 p-6 space-y-2">
          {role === 'admin' && (
            <>
              <NavItem active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon={<LayoutDashboard size={20}/>} label="لوحة التحكم" />
              <NavItem active={tab === 'inventory'} onClick={() => setTab('inventory')} icon={<Package size={20}/>} label="المخزون" />
              <NavItem active={tab === 'log'} onClick={() => setTab('log')} icon={<ClipboardList size={20}/>} label="سجل العهدة" />
              <NavItem active={tab === 'delivery'} onClick={() => setTab('delivery')} icon={<ArrowLeftRight size={20}/>} label="تسليم عهدة" />
              <NavItem active={tab === 'management'} onClick={() => setTab('management')} icon={<Users size={20}/>} label="العمال والأقسام" />
            </>
          )}
          <NavItem active={tab === 'worker-portal'} onClick={() => setTab('worker-portal')} icon={<ClipboardList size={20}/>} label="بوابة العامل" />
        </nav>
        <div className="p-6 border-t flex items-center justify-between">
          <div className="text-sm font-bold">{role === 'admin' ? 'المدير' : user?.name}</div>
          <button onClick={() => { setRole(null); setUser(null); }} className="text-red-500"><LogOut size={20}/></button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-slate-50/50 overflow-y-auto">
        {tab === 'dashboard' && role === 'admin' && <DashboardView stats={stats} logs={logs} workers={workers} />}
        {tab === 'inventory' && role === 'admin' && <InventoryView items={items} setItems={setItems} />}
        {tab === 'log' && role === 'admin' && <LogView items={items} workers={workers} departments={departments} updateItemStatus={updateItemStatus} returnToStock={returnToStock} onBulkReturn={handleBulkReturn} />}
        {tab === 'management' && role === 'admin' && (
          <ManagementView 
            departments={departments} 
            workers={workers} 
            onAddDept={handleAddDept}
            onDeleteDept={handleDeleteDept}
            onAddWorker={handleAddWorker}
            onDeleteWorker={handleDeleteWorker}
          />
        )}
        {tab === 'delivery' && role === 'admin' && <DeliveryView workers={workers} items={items} setItems={setItems} setLogs={setLogs} />}
        {tab === 'worker-portal' && <WorkerPortalView worker={user} items={items} updateItemStatus={updateItemStatus} setWorkers={setWorkers} />}
      </main>

      <Modal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
}
