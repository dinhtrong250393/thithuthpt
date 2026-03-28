import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Users, CheckCircle, XCircle, Trash2, AlertCircle, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export default function ExamResults() {
  const { examId } = useParams<{ examId: string }>();
  const { appUser } = useAuth();
  const [exam, setExam] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!examId) return;

    const fetchExam = async () => {
      try {
        const docRef = doc(db, 'exams', examId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExam({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `exams/${examId}`);
      }
    };
    fetchExam();

    const qSubmissions = query(collection(db, 'submissions'), where('examId', '==', examId));
    const unsubSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'submissions'));

    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => {
      unsubSubmissions();
      unsubStudents();
    };
  }, [examId]);

  if (!exam) return <div className="flex h-screen items-center justify-center">Đang tải...</div>;

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.uid === studentId);
    return student ? `${student.name} (${student.className})` : 'Học sinh không xác định';
  };

  const handleDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'submissions', submissionToDelete));
      setSubmissionToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `submissions/${submissionToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getScoreDistribution = () => {
    const bins: { name: string, count: number }[] = [];
    for (let i = 0; i <= 20; i++) {
      bins.push({ name: (i * 0.5).toFixed(1), count: 0 });
    }
    
    submissions.forEach(sub => {
      // Round to nearest 0.5
      const roundedScore = Math.round(sub.score * 2) / 2;
      const binIndex = Math.max(0, Math.min(20, roundedScore * 2));
      bins[binIndex].count++;
    });
    return bins;
  };

  const scoreData = getScoreDistribution();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <Link to="/teacher" className="text-gray-400 hover:text-indigo-600 mr-6 transition-colors p-2 hover:bg-indigo-50 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Kết quả: {exam.title}</h1>
            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center">
              <Users className="w-4 h-4 mr-1.5" />
              Số bài nộp: <span className="ml-1 text-indigo-600 font-bold">{submissions.length}</span>
            </p>
          </div>
        </div>

        {submissions.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">
                <BarChart3 className="w-5 h-5" />
              </span>
              Phổ điểm
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={scoreData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                    label={{ value: 'Điểm số', position: 'insideBottom', offset: -15, fill: '#4B5563', fontSize: 14, fontWeight: 500 }}
                  />
                  <YAxis 
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    label={{ value: 'Số lượng', angle: -90, position: 'insideLeft', fill: '#4B5563', fontSize: 14, fontWeight: 500 }}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#F3F4F6', strokeWidth: 2 }}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                    formatter={(value: number) => [`${value} học sinh`, 'Số lượng']}
                    labelFormatter={(label) => `Điểm: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6366F1" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#4F46E5', strokeWidth: 0 }}
                  >
                    <LabelList dataKey="count" position="top" fill="#4F46E5" fontSize={12} fontWeight={600} formatter={(val: number) => val > 0 ? val : ''} offset={10} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {submissions.length === 0 ? (
              <li className="px-8 py-12 text-center text-gray-500 font-medium flex flex-col items-center justify-center">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                Chưa có học sinh nào nộp bài.
              </li>
            ) : submissions.map((sub) => (
              <li key={sub.id} className="px-6 py-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border border-indigo-200 shadow-sm">
                      <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-bold text-gray-900">{getStudentName(sub.studentId)}</h3>
                      <p className="text-sm font-medium text-gray-500 mt-0.5">
                        Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex flex-col sm:items-end">
                    <div className="flex items-center justify-between sm:justify-end w-full">
                      <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 mr-4">
                        <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{sub.score.toFixed(2)} <span className="text-base text-indigo-300 font-bold">/ 10</span></p>
                      </div>
                      <button
                        onClick={() => setSubmissionToDelete(sub.id)}
                        className="text-red-400 hover:text-red-600 p-2.5 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                        title="Xóa kết quả để học sinh làm lại"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {sub.incorrectQuestions && sub.incorrectQuestions.length > 0 ? (
                      <div className="text-sm text-rose-600 flex flex-col sm:items-end mt-3 bg-rose-50/50 px-3 py-2 rounded-lg border border-rose-100">
                        <div className="flex items-center font-bold">
                          <XCircle className="w-4 h-4 mr-1.5" />
                          {sub.incorrectQuestions.length} câu sai
                        </div>
                        <span className="text-xs font-medium text-rose-500/80 mt-1">
                          (Sai các câu: {sub.incorrectQuestions.map((qId: string) => {
                            const qIndex = exam.questions.findIndex((q: any) => q.id === qId);
                            return qIndex !== -1 ? (qIndex + 1) : qId;
                          }).join(', ')})
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-emerald-600 flex items-center sm:justify-end mt-3 bg-emerald-50/50 px-3 py-2 rounded-lg border border-emerald-100 font-bold">
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Hoàn hảo! Không sai câu nào.
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Delete Submission Confirmation Modal */}
      {submissionToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Xác nhận xóa kết quả</h3>
            <p className="text-center text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa kết quả bài làm này? Sau khi xóa, học sinh sẽ có thể làm lại bài thi. Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => setSubmissionToDelete(null)} 
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button 
                onClick={handleDeleteSubmission} 
                className="px-5 py-2.5 border border-transparent rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
