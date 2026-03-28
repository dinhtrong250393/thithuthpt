import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function StudentExamResult() {
  const { examId } = useParams<{ examId: string }>();
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!examId || !appUser) return;
      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (examDoc.exists()) {
          setExam({ id: examDoc.id, ...examDoc.data() });
        }

        const q = query(
          collection(db, 'submissions'),
          where('examId', '==', examId),
          where('studentId', '==', appUser.uid)
        );
        const subSnap = await getDocs(q);
        if (!subSnap.empty) {
          setSubmission({ id: subSnap.docs[0].id, ...subSnap.docs[0].data() });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'exam_result');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId, appUser]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-indigo-600 font-medium text-lg">Đang tải kết quả...</div>;
  if (!exam || !submission) return <div className="flex h-screen items-center justify-center bg-gray-50 text-red-500 font-medium text-lg">Không tìm thấy kết quả.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in duration-500 border border-gray-100">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">Kết quả bài thi</h2>
        <p className="text-gray-500 mb-8 font-medium"><span className="font-bold text-gray-800 block mt-1">{exam.title}</span></p>
        
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-8 mb-8 shadow-inner">
          <div className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Điểm của bạn</div>
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2 drop-shadow-sm">
            {submission.score.toFixed(2)}<span className="text-3xl text-gray-300 font-bold">/10</span>
          </div>
          
          {submission.incorrectQuestions && submission.incorrectQuestions.length > 0 ? (
            <div className="mt-8 text-sm text-rose-600 bg-rose-50/80 border border-rose-100 p-5 rounded-xl text-left shadow-sm">
              <span className="font-bold block mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1.5"/> Sai các câu:</span> 
              <div className="flex flex-wrap gap-2">
                {submission.incorrectQuestions.map((id: string) => {
                  const idx = exam.questions.findIndex((q:any) => q.id === id);
                  return (
                    <span key={id} className="bg-white px-2.5 py-1 rounded-md shadow-sm border border-rose-100 font-semibold">
                      {idx !== -1 ? idx + 1 : id}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-8 text-sm text-emerald-700 bg-emerald-50/80 border border-emerald-100 p-5 rounded-xl font-bold shadow-sm flex items-center justify-center">
              <CheckCircle className="w-5 h-5 mr-2"/> Hoàn hảo! Bạn không sai câu nào.
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/student')}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-lg"
        >
          Quay lại danh sách bài tập
        </button>
      </div>
    </div>
  );
}
