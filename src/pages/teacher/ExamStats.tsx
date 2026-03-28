import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { TeacherNav } from '../../components/layout/TeacherNav';
import { Card, Button } from '../../components/ui';
import { LogOut, ArrowLeft, Users, Target, Award, TrendingUp } from 'lucide-react';

export function ExamStats() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [exam, setExam] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/exams/${id}`).then(res => res.json()),
      fetch(`/api/admin/exams/${id}/results`).then(res => res.json())
    ])
    .then(([examData, resultsData]) => {
      setExam(examData);
      setResults(resultsData);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!exam) return <div className="p-8 text-center">Không tìm thấy đề thi</div>;

  const totalSubmissions = results.length;
  const avgScore = totalSubmissions > 0 ? (results.reduce((acc, r) => acc + r.score, 0) / totalSubmissions).toFixed(2) : '0';
  const maxScore = totalSubmissions > 0 ? Math.max(...results.map(r => r.score)).toFixed(2) : '0';
  const minScore = totalSubmissions > 0 ? Math.min(...results.map(r => r.score)).toFixed(2) : '0';

  // Calculate score distribution
  const distribution = [0, 0, 0, 0, 0]; // 0-2, 2-4, 4-6, 6-8, 8-10
  results.forEach(r => {
    if (r.score < 2) distribution[0]++;
    else if (r.score < 4) distribution[1]++;
    else if (r.score < 6) distribution[2]++;
    else if (r.score < 8) distribution[3]++;
    else distribution[4]++;
  });

  const maxDist = Math.max(...distribution, 1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/teacher/exams')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-xl font-bold text-slate-800">Thống Kê Đề Thi</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Giáo viên: {user?.name}</span>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <TeacherNav />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">{exam.title}</h2>
              <p className="text-slate-500">Trạng thái: {exam.status} • Thời gian: {exam.duration} phút</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Lượt nộp bài</p>
                  <p className="text-2xl font-bold text-slate-800">{totalSubmissions}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Điểm trung bình</p>
                  <p className="text-2xl font-bold text-slate-800">{avgScore}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Điểm cao nhất</p>
                  <p className="text-2xl font-bold text-slate-800">{maxScore}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Điểm thấp nhất</p>
                  <p className="text-2xl font-bold text-slate-800">{minScore}</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Danh sách kết quả</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Học sinh</th>
                        <th className="px-4 py-3">Điểm</th>
                        <th className="px-4 py-3">Thời gian nộp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                            Chưa có dữ liệu nộp bài
                          </td>
                        </tr>
                      ) : (
                        results.map((r, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="px-4 py-3 font-medium text-slate-800">{r.studentName}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                r.score >= 8 ? 'bg-green-100 text-green-700' : 
                                r.score >= 5 ? 'bg-blue-100 text-blue-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                {r.score.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(r.submittedAt).toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Phổ điểm</h3>
                <div className="space-y-4">
                  {[
                    { label: '0 - 2', count: distribution[0] },
                    { label: '2 - 4', count: distribution[1] },
                    { label: '4 - 6', count: distribution[2] },
                    { label: '6 - 8', count: distribution[3] },
                    { label: '8 - 10', count: distribution[4] },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-14 text-sm font-medium text-slate-600">{item.label}</div>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden flex items-center">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${(item.count / maxDist) * 100}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-sm font-bold text-slate-700">{item.count}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
