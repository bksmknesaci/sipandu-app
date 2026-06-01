"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase'; // Koneksi ke Supabase
import { User, Lock, Eye, EyeOff, LogIn, GraduationCap } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); // VARIABEL ERROR DIPASANG KEMBALI DI SINI
  
  // State untuk mengambil logo dari Supabase
  const [settings, setSettings] = useState({ logo_url: null });

  // Ambil data pengaturan (logo) dari Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/');
    } else {
      setError('Username atau Password salah!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        
        {/* Header Login (Logo + Judul) */}
        <div className="text-center mb-8">
          {/* Logo Dinamis dari Supabase */}
          <div className="flex justify-center mb-4">
            {settings.logo_url ? (
              <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-blue-600 shadow-lg flex items-center justify-center">
                <GraduationCap size={50} className="text-white" />
              </div>
            )}
          </div>
          <h1 className="text-4xl font-extrabold text-blue-600 tracking-wider">SIPANDU</h1>
          <p className="text-gray-500 mt-2 text-sm">Masuk ke Dashboard SIPANDU</p>
        </div>

        {/* Card Login */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          
          {/* Pesan Error (Sekarang sudah aman, variabelnya ada) */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input Username (Teks Hitam) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Admin" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Input Password (Teks Hitam) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Masukkan password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black placeholder-gray-400"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Checkbox Ingat Saya */}
            <div className="flex items-center">
              <input 
                id="remember" 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" 
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Ingat Saya
              </label>
            </div>

            {/* Tombol Login */}
            <button 
              type="submit" 
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Login
            </button>
          </form>
        </div>

        {/* Footer Login */}
        <p className="text-center text-gray-400 text-xs mt-6">
          © 2026 SIPANDU
        </p>
      </div>
    </div>
  );
}