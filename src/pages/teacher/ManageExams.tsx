import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { TeacherNav } from '../../components/layout/TeacherNav';
import { Card, Button } from '../../components/ui';
import { LogOut, BarChart3, Plus, Clock } from 'lucide-react';

export function ManageExams() {
  const { user, setUser } = useContext(AuthContext);
  const [exams, setExams] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/admin/exams')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setExams(data);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <BarChart3 className="text-blue-400" />
            <span>Teacher Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">Admin: <strong>{user?.fullName}</strong></span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <TeacherNav />

      <main className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Đề thi</h1>
          <Button onClick={() => navigate('/teacher/exams/new')} className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Tạo đề thi mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <Card key={exam.id} className="p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold text-slate-800 line-clamp-2">{exam.title}</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider shrink-0 ${exam.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                  {exam.status}
                </span>
              </div>
              <div className="flex items-center text-slate-500 text-sm mb-6">
                <Clock className="w-4 h-4 mr-1.5" />
                <span>Thời gian: {exam.duration} phút</span>
              </div>
              <div className="mt-auto flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => navigate(`/teacher/exams/${exam.id}/edit`)}>Sửa</Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate(`/teacher/exams/${exam.id}/stats`)}>Thống kê</Button>
              </div>
            </Card>
          ))}
          {exams.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              Chưa có đề thi nào. Hãy tạo đề thi mới.
            </div>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-4 z-50 max-w-md break-words">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
