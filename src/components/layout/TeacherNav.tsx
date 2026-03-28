import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileText, Users } from 'lucide-react';

export function TeacherNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/teacher', label: 'Tổng quan', icon: BarChart3 },
    { path: '/teacher/exams', label: 'Quản lý Đề thi', icon: FileText },
  ];

  return (
    <div className="bg-white border-b border-slate-200 mb-8">
      <div className="max-w-6xl mx-auto px-4 flex gap-8">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/teacher' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 py-4 border-b-2 font-medium transition-colors ${isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
