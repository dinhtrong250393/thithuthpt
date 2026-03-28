import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-exam-app";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

function getAIClient() {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!key || key === "YOUR_API_KEY_HERE" || key === "MY_GEMINI_API_KEY" || key.includes("TODO")) {
    throw new Error("MISSING_API_KEY");
  }
  return new GoogleGenAI({ apiKey: key });
}

// --- MOCK DATA (Fallback if Google Sheets is not configured) ---
const mockUsers = [
  { id: "USR-001", email: "teacher@exam.com", password: "password", role: "ADMIN", fullName: "Giáo viên Toán" },
  { id: "USR-002", email: "student@exam.com", password: "password", role: "STUDENT", fullName: "Nguyễn Văn A", class: "12A1" }
];

const mockExams = [
  {
    id: "EXM-001",
    title: "Thi thử THPT Quốc gia Lần 1 - Môn Toán",
    duration: 90,
    status: "OPEN",
    questions: [
      // Phần 1: Trắc nghiệm 4 lựa chọn
      { id: "Q1", part: 1, content: "Nghiệm của phương trình $2x - 4 = 0$ là:", options: ["A. $x = 1$", "B. $x = 2$", "C. $x = 3$", "D. $x = 4$"], correctAnswer: "B" },
      { id: "Q2", part: 1, content: "Đạo hàm của hàm số $y = x^3 - 3x$ là:", options: ["A. $y' = 3x^2 - 3$", "B. $y' = 3x^2 + 3$", "C. $y' = x^2 - 3$", "D. $y' = 3x - 3$"], correctAnswer: "A" },
      // Phần 2: Đúng/Sai
      { id: "Q3", part: 2, content: "Cho hàm số $y = f(x) = x^2 - 2x + 1$. Các mệnh đề sau đúng hay sai?", options: ["a) Hàm số đồng biến trên $(1; +\\infty)$", "b) Đồ thị cắt trục tung tại điểm có tung độ bằng 1", "c) Giá trị nhỏ nhất của hàm số là 0", "d) Hàm số nghịch biến trên $\\mathbb{R}$"], correctAnswer: ["Đ", "Đ", "Đ", "S"] },
      // Phần 3: Trả lời ngắn
      { id: "Q4", part: 3, content: "Tính giá trị của biểu thức $P = \\log_2 8 + \\log_3 9$.", correctAnswer: "5" },
      { id: "Q5", part: 3, content: "Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông tại $B$, $AB=a, BC=a\\sqrt{3}$. Thể tích khối chóp là $V = \\frac{a^3}{2}$. Tính chiều cao $h$ của khối chóp.", correctAnswer: "1.732" } // sqrt(3) ~ 1.732
    ]
  }
];

let mockResults: any[] = [];

// --- GRADING LOGIC ---
function gradeExam(examId: string, studentAnswers: Record<string, any>) {
  const exam = mockExams.find(e => e.id === examId);
  if (!exam) throw new Error("Exam not found");

  let totalScore = 0;
  const wrongQuestions: string[] = [];

  exam.questions.forEach(q => {
    const answer = studentAnswers[q.id];
    let isCorrect = false;

    if (q.part === 1) {
      // Phần 1: 0.25 điểm / câu
      if (answer === q.correctAnswer) {
        totalScore += 0.25;
        isCorrect = true;
      }
    } else if (q.part === 2) {
      // Phần 2: 0.1 - 0.25 - 0.5 - 1.0 điểm
      if (Array.isArray(answer) && Array.isArray(q.correctAnswer)) {
        let correctCount = 0;
        for (let i = 0; i < 4; i++) {
          if (answer[i] === q.correctAnswer[i]) correctCount++;
        }
        if (correctCount === 1) totalScore += 0.1;
        else if (correctCount === 2) totalScore += 0.25;
        else if (correctCount === 3) totalScore += 0.5;
        else if (correctCount === 4) {
          totalScore += 1.0;
          isCorrect = true; // Chỉ tính là đúng hoàn toàn nếu đúng cả 4 ý
        }
        if (correctCount > 0 && correctCount < 4) {
           // Tính là sai một phần để báo lại cho học sinh
           isCorrect = false;
        }
      }
    } else if (q.part === 3) {
      // Phần 3: 0.5 điểm / câu
      // So sánh chuỗi số (có thể cần chuẩn hóa dấu phẩy/chấm)
      if (answer && parseFloat(answer.replace(',', '.')) === parseFloat((q.correctAnswer as string).replace(',', '.'))) {
        totalScore += 0.5;
        isCorrect = true;
      }
    }

    if (!isCorrect) {
      wrongQuestions.push(q.id);
    }
  });

  return { totalScore: Math.min(Math.max(totalScore, 0), 10), wrongQuestions };
}

// --- SERVER SETUP ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Middleware xác thực
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- API ROUTES ---
  
  // 1. Auth
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });
    
    const token = jwt.sign({ id: user.id, role: user.role, fullName: user.fullName }, JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ user: { id: user.id, email: user.email, role: user.role, fullName: user.fullName } });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    res.json({ user: req.user });
  });

  // 2. Exams (Student)
  app.get("/api/exams", authenticate, (req: any, res) => {
    // Trả về danh sách đề thi (không kèm đáp án)
    const examsList = mockExams.map(e => ({ id: e.id, title: e.title, duration: e.duration, status: e.status }));
    res.json(examsList);
  });

  app.get("/api/exams/:id", authenticate, (req: any, res) => {
    const exam = mockExams.find(e => e.id === req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    
    // Loại bỏ correctAnswer trước khi gửi cho học sinh
    const safeExam = {
      ...exam,
      questions: exam.questions.map(q => {
        const { correctAnswer, ...safeQ } = q;
        return safeQ;
      })
    };
    res.json(safeExam);
  });

  app.post("/api/exams/:id/submit", authenticate, (req: any, res) => {
    const examId = req.params.id;
    const { answers } = req.body;
    const studentId = req.user.id;

    try {
      const { totalScore, wrongQuestions } = gradeExam(examId, answers);
      
      const result = {
        id: `RES-${Date.now()}`,
        examId,
        studentId,
        studentName: req.user.fullName,
        answers,
        totalScore,
        wrongQuestions,
        submittedAt: new Date().toISOString()
      };
      
      mockResults.push(result);
      res.json({ success: true, totalScore, wrongQuestions });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 3. Teacher Dashboard
  app.get("/api/admin/results", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    res.json(mockResults);
  });

  app.get("/api/admin/exams", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    res.json(mockExams);
  });

  app.post("/api/admin/exams", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    const newExam = {
      id: `EXM-${Date.now()}`,
      title: req.body.title,
      duration: req.body.duration,
      status: req.body.status || "DRAFT",
      questions: req.body.questions || []
    };
    mockExams.push(newExam);
    res.json({ success: true, exam: newExam });
  });

  app.get("/api/admin/exams/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    const exam = mockExams.find(e => e.id === req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json(exam);
  });

  app.put("/api/admin/exams/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    const index = mockExams.findIndex(e => e.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Exam not found" });
    
    mockExams[index] = { ...mockExams[index], ...req.body };
    res.json({ success: true, exam: mockExams[index] });
  });

  app.get("/api/admin/exams/:id/results", authenticate, (req: any, res) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    const results = mockResults.filter(r => r.examId === req.params.id);
    res.json(results);
  });

  app.post("/api/admin/parse-exam", authenticate, (req: any, res: any, next: any) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: "Lỗi upload file: " + err.message });
      }
      next();
    });
  }, async (req: any, res: any) => {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
    
    if (!req.file) {
      return res.status(400).json({ error: "Vui lòng tải lên file đề thi." });
    }

    try {
      const fileBuffer = req.file.buffer;
      const mimeType = req.file.mimetype;

      if (mimeType !== 'application/pdf') {
         return res.status(400).json({ error: "Lỗi định dạng: Chỉ hỗ trợ file PDF. Vui lòng chuyển đổi sang PDF và thử lại." });
      }

      let ai;
      try {
        ai = getAIClient();
      } catch (e: any) {
        if (e.message === "MISSING_API_KEY") {
          console.error("Server Error: GEMINI_API_KEY is missing or invalid in environment variables.");
          return res.status(500).json({ error: "API Key không hợp lệ. Vui lòng xóa GEMINI_API_KEY khỏi phần Settings > Secrets để sử dụng key mặc định của hệ thống, hoặc nhập một API Key thật." });
        }
        throw e;
      }

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Tiêu đề đề thi" },
          subject: { type: Type.STRING, description: "Môn học" },
          duration: { type: Type.NUMBER, description: "Thời gian làm bài (phút)" },
          parts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                partNumber: { type: Type.INTEGER, description: "Số thứ tự phần thi (1, 2, 3...)" },
                title: { type: Type.STRING, description: "Tiêu đề phần thi" },
                description: { type: Type.STRING, description: "Mô tả phần thi" }
              }
            }
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Mã câu hỏi duy nhất" },
                part: { type: Type.INTEGER, description: "Thuộc phần thi số mấy" },
                content: { type: Type.STRING, description: "Nội dung câu hỏi, giữ nguyên định dạng LaTeX inline (ví dụ: $x^2$)" },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các đáp án lựa chọn (nếu có)" },
                correctAnswer: { type: Type.STRING, description: "Đáp án đúng (A, B, C, D hoặc Đ/S hoặc câu trả lời ngắn)" },
                imageReferences: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các tham chiếu hình ảnh trong câu hỏi" }
              }
            }
          }
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            inlineData: {
              data: fileBuffer.toString("base64"),
              mimeType: mimeType
            }
          },
          "Phân tích đề thi từ tài liệu này. Trả về kết quả dưới dạng JSON có cấu trúc bao gồm: title (tiêu đề đề thi), subject (môn học), duration (thời gian làm bài tính bằng phút), parts (danh sách các phần thi), và questions (danh sách câu hỏi). Mỗi câu hỏi cần có: id (chuỗi duy nhất), part (số thứ tự phần thi), content (nội dung câu hỏi, giữ nguyên định dạng LaTeX inline như $x^2$), options (mảng các chuỗi đáp án bắt đầu bằng A., B., C., D. nếu là trắc nghiệm), correctAnswer (đáp án đúng nếu có), và imageReferences (mảng các tham chiếu hình ảnh nếu có)."
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const parsedData = JSON.parse(response.text || "{}");
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error parsing exam:", error);
      let errorMessage = "Lỗi không xác định trong quá trình phân tích.";
      
      try {
        const errStr = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
        if (errStr.includes("API key not valid") || errStr.includes("API_KEY_INVALID")) {
          errorMessage = "API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình GEMINI_API_KEY trong phần Settings > Secrets.";
        } else if (errStr.includes("quota") || errStr.includes("429")) {
          errorMessage = "Đã vượt quá giới hạn sử dụng AI (Quota exceeded). Vui lòng thử lại sau.";
        } else if (errStr.includes("JSON")) {
          errorMessage = "Lỗi đọc dữ liệu từ AI. Vui lòng thử lại với file rõ ràng hơn.";
        }
      } catch (e) {
        // Ignore parsing errors
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global error handler:", err);
    if (req.path.startsWith('/api/')) {
      res.status(500).json({ error: err.message || "Internal Server Error" });
    } else {
      next(err);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
