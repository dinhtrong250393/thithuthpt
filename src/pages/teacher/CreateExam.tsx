import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { TeacherNav } from '../../components/layout/TeacherNav';
import { Card, Button, Input } from '../../components/ui';
import { LogOut, BarChart3, UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { MathRenderer } from '../../components/exam/MathRenderer';

export function CreateExam() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('90');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const showToast = (text: string, type: 'error' | 'success' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.type !== 'application/pdf') {
        showToast('Hiện tại hệ thống chỉ hỗ trợ file PDF. Vui lòng chuyển đổi sang PDF.');
        e.target.value = '';
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToast('File quá lớn. Vui lòng chọn file dưới 5MB.');
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleParseAI = async () => {
    if (!file) {
      showToast('Vui lòng chọn file đề thi (PDF) trước!');
      return;
    }
    
    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/parse-exam', { 
        method: 'POST',
        body: formData
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi khi phân tích đề thi!');
        
        if (data.title) setTitle(data.title);
        if (data.duration) setDuration(data.duration.toString());
        setParsedQuestions(data.questions || []);
        showToast('Phân tích thành công!', 'success');
      } else {
        const text = await res.text();
        console.error("Server returned non-JSON response:", res.status, text);
        if (res.status === 413) {
          throw new Error('File quá lớn. Vui lòng chọn file nhỏ hơn.');
        }
        if (text.includes('<!doctype html>') || text.includes('<html')) {
          throw new Error('Máy chủ đang quá tải hoặc đang khởi động lại. Vui lòng thử lại sau ít phút.');
        }
        throw new Error(`Lỗi server (${res.status}): ${text.substring(0, 100)}...`);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      if (err.message === 'Failed to fetch') {
        showToast('Không thể kết nối đến máy chủ. Có thể file quá lớn hoặc máy chủ đang khởi động lại.');
      } else {
        showToast(err.message || 'Lỗi khi phân tích đề thi!');
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveExam = async () => {
    if (!title) return showToast('Vui lòng nhập tên kỳ thi');
    if (parsedQuestions.length === 0) return showToast('Vui lòng upload và phân tích đề thi');

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          duration: parseInt(duration),
          status: 'OPEN',
          questions: parsedQuestions
        })
      });
      if (res.ok) {
        showToast('Tạo đề thi thành công!', 'success');
        setTimeout(() => navigate('/teacher/exams'), 1000);
      }
    } catch (err) {
      showToast('Lỗi khi lưu đề thi!');
    } finally {
      setIsSaving(false);
    }
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

      <main className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Tạo Đề Thi Mới</h1>
          <Button onClick={() => navigate('/teacher/exams')} variant="outline">Hủy</Button>
        </div>

        <div className="space-y-6">
          {/* Thông tin chung */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">1. Thông tin chung</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên kỳ thi</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Thi thử THPT Quốc gia Lần 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian làm bài (phút)</label>
                <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Upload & Phân tích AI */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">2. Upload & Phân tích Đề (AI)</h2>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 mb-4">
              <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">Kéo thả file PDF vào đây, hoặc click để chọn file (tối đa 5MB).</p>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full max-w-xs mx-auto text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              {file && <p className="mt-3 text-sm font-medium text-green-600 flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4"/> Đã chọn: {file.name}</p>}
            </div>
            
            <Button onClick={handleParseAI} disabled={!file || isParsing} className="w-full flex justify-center items-center gap-2">
              {isParsing ? <><Loader2 className="w-5 h-5 animate-spin" /> AI đang đọc và bóc tách công thức LaTeX...</> : 'Phân tích đề thi bằng AI'}
            </Button>
          </Card>

          {/* Preview kết quả AI */}
          {parsedQuestions.length > 0 && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">3. Xem trước nội dung (Đã bóc tách)</h2>
                <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1 rounded-full">{parsedQuestions.length} câu hỏi</span>
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {parsedQuestions.map((q, i) => (
                  <div key={q.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <div className="font-medium text-slate-800 mb-2">
                      <span className="text-blue-600 mr-2">Câu {i + 1} (Phần {q.part}):</span>
                      <MathRenderer content={q.content} />
                    </div>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-600">
                        {q.options.map((opt: string, j: number) => (
                          <div key={j}><MathRenderer content={opt} /></div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 text-sm font-medium text-green-600">
                      Đáp án: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
                <Button onClick={handleSaveExam} disabled={isSaving} className="flex items-center gap-2 px-8">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Lưu & Xuất bản đề thi
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-4 z-50 text-white max-w-md break-words ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
