import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { Card, Button } from '../../components/ui';
import { LogOut, Clock, FileText } from 'lucide-react';

export function StudentDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [exams, setExams] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/exams')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setExams(data);
        } else {
          console.error('Expected array but got:', data);
          setExams([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch exams:', err);
        setExams([]);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
            <FileText />
            <span>ExamPortal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">Xin chào, <strong>{user?.fullName}</strong></span>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Kỳ thi của bạn</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {exams.map(exam => (
            <Card key={exam.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-slate-800 leading-tight">{exam.title}</h2>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                  {exam.status}
                </span>
              </div>
              
              <div className="flex items-center text-slate-500 mb-6 text-sm">
                <Clock className="w-4 h-4 mr-1.5" />
                <span>Thời gian: {exam.duration} phút</span>
              </div>
              
              <Button 
                onClick={() => navigate(`/student/exam/${exam.id}`)}
                className="w-full flex items-center justify-center gap-2"
              >
                Bắt đầu làm bài
              </Button>
            </Card>
          ))}
          
          {exams.length === 0 && (
            <div className="col-span-2 text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              Hiện tại không có kỳ thi nào.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
