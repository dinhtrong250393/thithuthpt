import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import React from 'react';

interface MathRendererProps {
  content: string;
}

export function MathRenderer({ content }: MathRendererProps) {
  // Hàm này phân tích chuỗi chứa text và LaTeX (nằm trong $...$)
  // Ví dụ: "Nghiệm của $x^2 = 4$ là" -> Text("Nghiệm của "), InlineMath("x^2 = 4"), Text(" là")
  
  const renderContent = () => {
    const parts = content.split(/(\$.*?\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        return <InlineMath key={index} math={math} />;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return <span className="leading-relaxed">{renderContent()}</span>;
}
