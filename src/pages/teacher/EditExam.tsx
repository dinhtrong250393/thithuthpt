import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { TeacherNav } from '../../components/layout/TeacherNav';
import { Card, Button, Input } from '../../components/ui';
import { LogOut, ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { MathRenderer } from '../../components/exam/MathRenderer';

export function EditExam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  useEffect(() => {
    fetch(`/api/admin/exams/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải đề thi');
        return res.json();
      })
      .then(data => {
        setExam(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/exams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: exam.title,
          duration: exam.duration,
          status: exam.status
        })
      });

      if (!res.ok) throw new Error('Lỗi khi lưu đề thi');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (error && !exam) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/teacher/exams')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-xl font-bold text-slate-800">Sửa Đề Thi</h1>
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
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Thông tin chung</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên đề thi</label>
                  <Input 
                    value={exam.title} 
                    onChange={e => setExam({...exam, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian (phút)</label>
                    <Input 
                      type="number" 
                      value={exam.duration} 
                      onChange={e => setExam({...exam, duration: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={exam.status}
                      onChange={e => setExam({...exam, status: e.target.value})}
                    >
                      <option value="DRAFT">Bản nháp (DRAFT)</option>
                      <option value="OPEN">Mở (OPEN)</option>
                      <option value="CLOSED">Đóng (CLOSED)</option>
                    </select>
                  </div>
                </div>
                
                {error && <div className="text-red-500 text-sm">{error}</div>}
                {success && (
                  <div className="text-green-600 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Lưu thành công!
                  </div>
                )}

                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu thay đổi
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Danh sách câu hỏi ({exam.questions?.length || 0})</h2>
              <div className="space-y-6">
                {exam.questions?.map((q: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg bg-slate-50">
                    <div className="font-medium mb-2 flex items-start gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs shrink-0 mt-0.5">Câu {i + 1}</span>
                      <div><MathRenderer content={q.content} /></div>
                    </div>
                    
                    {q.type === 'MULTIPLE_CHOICE' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pl-8">
                        {q.options?.map((opt: string, j: number) => (
                          <div key={j} className={`p-2 rounded border text-sm ${opt === q.correctAnswer ? 'bg-green-50 border-green-200 font-medium' : 'bg-white'}`}>
                            {String.fromCharCode(65 + j)}. <MathRenderer content={opt} />
                            {opt === q.correctAnswer && <span className="ml-2 text-green-600 text-xs">(Đáp án đúng)</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === 'TRUE_FALSE' && (
                      <div className="flex gap-4 mt-3 pl-8">
                        <div className={`px-4 py-2 rounded border text-sm ${q.correctAnswer === 'True' ? 'bg-green-50 border-green-200 font-medium' : 'bg-white'}`}>
                          Đúng {q.correctAnswer === 'True' && <span className="ml-2 text-green-600 text-xs">(Đáp án)</span>}
                        </div>
                        <div className={`px-4 py-2 rounded border text-sm ${q.correctAnswer === 'False' ? 'bg-green-50 border-green-200 font-medium' : 'bg-white'}`}>
                          Sai {q.correctAnswer === 'False' && <span className="ml-2 text-green-600 text-xs">(Đáp án)</span>}
                        </div>
                      </div>
                    )}

                    {q.type === 'SHORT_ANSWER' && (
                      <div className="mt-3 pl-8">
                        <div className="p-2 rounded border bg-green-50 border-green-200 text-sm font-medium inline-block">
                          Đáp án đúng: <MathRenderer content={q.correctAnswer} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
