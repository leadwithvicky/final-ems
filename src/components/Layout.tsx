'use client';

import React from 'react';
import { Users, LogOut, User } from 'lucide-react';

interface LayoutProps {
  title: string;
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ title, children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                {title}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-700">
                <User className="h-5 w-5 mr-2" />
                <span>{user.name}</span>
                <span className="ml-2 text-sm text-gray-500 capitalize">({user.role})</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
