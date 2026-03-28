import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MathRenderer } from '../../components/exam/MathRenderer';
import { CustomKeypad } from '../../components/exam/CustomKeypad';
import { Button, Card } from '../../components/ui';
import { Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export function ExamView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/exams/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải đề thi');
        return res.json();
      })
      .then(data => {
        setExam(data);
        setTimeLeft(data.duration * 60);
      })
      .catch(err => setError(err.message === 'Failed to fetch' ? 'Không thể kết nối đến máy chủ' : err.message));
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0 || result) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePart1Change = (qId: string, option: string) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [qId]: option[0] })); // Lưu 'A', 'B', 'C', 'D'
  };

  const handlePart2Change = (qId: string, index: number, value: 'Đ' | 'S') => {
    if (result) return;
    setAnswers(prev => {
      const current = prev[qId] || [];
      const newArr = [...current];
      newArr[index] = value;
      return { ...prev, [qId]: newArr };
    });
  };

  const handleKeypadPress = (key: string) => {
    if (!activeInput || result) return;
    setAnswers(prev => ({
      ...prev,
      [activeInput]: (prev[activeInput] || '') + key
    }));
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    try {
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      setResult(data);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Có lỗi xảy ra khi nộp bài!', err);
    }
  };

  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!exam) return <div className="p-8 text-center">Đang tải đề thi...</div>;

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* Header cố định */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-slate-800 truncate pr-4">{exam.title}</h1>
          <div className="flex items-center gap-4 shrink-0">
            <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            {!result && (
              <Button onClick={() => setShowConfirmModal(true)} variant="primary">Nộp bài</Button>
            )}
            {result && (
              <Button onClick={() => navigate('/student')} variant="secondary">Quay lại</Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {result && (
          <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
            <h2 className="text-2xl font-bold text-blue-800 mb-2">Kết quả làm bài</h2>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-black text-blue-600">{result.totalScore.toFixed(2)}</span>
              <span className="text-xl text-blue-400 font-bold mb-1">/ 10</span>
            </div>
            <p className="text-blue-700">
              Bạn đã làm sai {result.wrongQuestions.length} câu. Các câu sai được đánh dấu <XCircle className="inline w-4 h-4 text-red-500 mx-1"/> bên dưới.
            </p>
          </Card>
        )}

        <div className="space-y-8">
          {exam.questions.map((q: any, index: number) => {
            const isWrong = result?.wrongQuestions.includes(q.id);
            const isCorrect = result && !isWrong;

            return (
              <Card key={q.id} className={`p-6 ${isWrong ? 'border-red-300 bg-red-50/30' : ''} ${isCorrect ? 'border-green-300 bg-green-50/30' : ''}`}>
                <div className="flex gap-3 mb-4">
                  <div className="shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="pt-1 flex-1">
                    <div className="font-medium text-slate-800 mb-4">
                      <MathRenderer content={q.content} />
                    </div>

                    {/* Render Phần 1: 4 đáp án */}
                    {q.part === 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt: string) => {
                          const letter = opt[0]; // A, B, C, D
                          const isSelected = answers[q.id] === letter;
                          return (
                            <label 
                              key={opt} 
                              className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'} ${result ? 'pointer-events-none' : ''}`}
                            >
                              <input 
                                type="radio" 
                                name={`q-${q.id}`} 
                                value={letter}
                                checked={isSelected}
                                onChange={() => handlePart1Change(q.id, opt)}
                                className="mt-1 mr-3"
                                disabled={!!result}
                              />
                              <MathRenderer content={opt} />
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Render Phần 2: Đúng/Sai */}
                    {q.part === 2 && (
                      <div className="space-y-3">
                        {q.options.map((opt: string, i: number) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-200 bg-white gap-4">
                            <div className="flex-1"><MathRenderer content={opt} /></div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handlePart2Change(q.id, i, 'Đ')}
                                disabled={!!result}
                                className={`px-4 py-1.5 rounded font-medium border transition-colors ${answers[q.id]?.[i] === 'Đ' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                              >
                                ĐÚNG
                              </button>
                              <button
                                onClick={() => handlePart2Change(q.id, i, 'S')}
                                disabled={!!result}
                                className={`px-4 py-1.5 rounded font-medium border transition-colors ${answers[q.id]?.[i] === 'S' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                              >
                                SAI
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render Phần 3: Trả lời ngắn */}
                    {q.part === 3 && (
                      <div className="mt-4">
                        <input
                          type="text"
                          readOnly
                          value={answers[q.id] || ''}
                          onClick={() => !result && setActiveInput(q.id)}
                          placeholder="Nhấn vào đây để nhập đáp án..."
                          className={`w-full max-w-sm px-4 py-3 text-lg font-mono border-2 rounded-lg cursor-pointer focus:outline-none transition-colors ${activeInput === q.id ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-300'} ${result ? 'bg-slate-100 text-slate-600' : 'bg-white'}`}
                        />
                      </div>
                    )}

                    {/* Hiển thị icon đúng/sai sau khi nộp */}
                    {result && (
                      <div className="mt-4 flex items-center gap-2">
                        {isCorrect ? (
                          <span className="flex items-center text-green-600 font-medium"><CheckCircle2 className="w-5 h-5 mr-1"/> Trả lời đúng</span>
                        ) : (
                          <span className="flex items-center text-red-600 font-medium"><XCircle className="w-5 h-5 mr-1"/> Trả lời sai</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Bàn phím ảo nổi cho Phần 3 */}
      {activeInput && !result && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-2 rounded-t-xl border-t border-x border-slate-200 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2">Nhập đáp án</span>
            <button onClick={() => setActiveInput(null)} className="text-slate-400 hover:text-slate-600 p-1">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <CustomKeypad
            onKeyPress={handleKeypadPress}
            onDelete={() => setAnswers(prev => ({ ...prev, [activeInput]: (prev[activeInput] || '').slice(0, -1) }))}
            onClear={() => setAnswers(prev => ({ ...prev, [activeInput]: '' }))}
          />
        </div>
      )}

      {/* Modal Xác nhận nộp bài */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận nộp bài</h3>
            <p className="text-slate-600 mb-6">Bạn có chắc chắn muốn nộp bài không? Bạn không thể thay đổi đáp án sau khi nộp.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Hủy</Button>
              <Button variant="primary" onClick={handleSubmit}>Đồng ý nộp</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
