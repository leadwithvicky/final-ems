'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { addNotification } = useNotification();
  const { login, isLoading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(email, password);
    
    if (success) {
      addNotification({
        type: 'success',
        message: 'Welcome to Visiontech EMS!'
      });
      // Force redirect to dashboard after successful login
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      addNotification({
        type: 'error',
        message: 'Invalid credentials! Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-coral-400 to-red-400 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-coral-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Visiontech EMS</h2>
            <p className="text-gray-600 mt-2">Welcome back to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-coral-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-coral-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {authLoading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-right mt-2">
              <button
                type="button"
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                onClick={() => window.location.href = '/forgot-password'}
              >
                Forgot Password?
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => window.location.href = '/register'}
                className="text-orange-600 hover:text-orange-800 font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
