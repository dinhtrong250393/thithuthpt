import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../App';
import { Card } from '../../components/ui';
import { TeacherNav } from '../../components/layout/TeacherNav';
import { LogOut, Users, FileText, BarChart3 } from 'lucide-react';

export function TeacherDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/results')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          console.error('Expected array but got:', data);
          setResults([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch results:', err);
        setResults([]);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Tổng học sinh</p>
              <p className="text-2xl font-bold text-slate-800">1</p>
            </div>
          </Card>
          <Card className="p-6 flex items-center gap-4 border-l-4 border-l-green-500">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><FileText className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Đề thi đang mở</p>
              <p className="text-2xl font-bold text-slate-800">1</p>
            </div>
          </Card>
          <Card className="p-6 flex items-center gap-4 border-l-4 border-l-purple-500">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><BarChart3 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Lượt nộp bài</p>
              <p className="text-2xl font-bold text-slate-800">{results.length}</p>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-white">
            <h2 className="text-xl font-bold text-slate-800">Kết quả thi gần đây</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Học sinh</th>
                  <th className="p-4 font-medium">Đề thi</th>
                  <th className="p-4 font-medium">Thời gian nộp</th>
                  <th className="p-4 font-medium text-right">Điểm số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{r.studentName}</td>
                    <td className="p-4 text-slate-600">{r.examId}</td>
                    <td className="p-4 text-slate-500 text-sm">{new Date(r.submittedAt).toLocaleString('vi-VN')}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold ${r.totalScore >= 8 ? 'bg-green-100 text-green-700' : r.totalScore >= 5 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {r.totalScore.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">Chưa có học sinh nào nộp bài.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
