import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FcGoogle } from "react-icons/fc";
import { useToast } from "../../context/ToastContext";

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`
        }
      });
      if (error) throw error;
    } catch (error) {
      addToast(error.message, "error");
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        addToast("Berhasil login!", "success");
        onClose();
      } else {
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            addToast("Username hanya boleh berisi huruf, angka, garis bawah (_), dan antara 3-20 karakter tanpa spasi.", "error");
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: { data: { full_name: username, username: username } } 
        });
        if (error) throw error;

        if (data.session) {
            await supabase.from('profiles').update({ username: username }).eq('id', data.user.id);
        }
        
        addToast("Berhasil daftar! Anda bisa langsung login.", "success");
        setIsLogin(true);
      }
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-4">
      <div className="relative w-full max-w-md p-8 bg-[#201F31] rounded-2xl shadow-2xl border border-gray-700/50 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xl" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? "Selamat Datang Kembali!" : "Bergabung dengan NEETflix"}
          </h2>
          <p className="text-sm text-gray-400">
            {isLogin ? "Login untuk melanjutkan riwayat tontonanmu" : "Dapatkan XP dan akses fitur VIP"}
          </p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors mb-4"
        >
          <FcGoogle className="text-2xl" />
          Lanjutkan dengan Google
        </button>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Atau</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all"
              required
            />
          )}
          <input
            type="email"
            placeholder="Alamat Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-[#2D2B44] text-white border border-transparent focus:border-[#ffbade] focus:outline-none transition-all"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#ffbade] text-black font-bold py-3 rounded-xl mt-2 hover:bg-[#ff99cc] transition-colors disabled:opacity-50"
          >
            {loading ? "Memproses..." : (isLogin ? "Login" : "Daftar Sekarang")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
            className="text-[#ffbade] font-bold hover:underline"
          >
            {isLogin ? "Daftar di sini" : "Login di sini"}
          </button>
        </div>
      </div>
    </div>
  );
}
