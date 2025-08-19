
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppData } from '../../hooks/useAppData';
import { APP_NAME } from '../../constants';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState(''); // Changed from email
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { settings } = useAppData();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    if (username.length < 3) {
        toast.error('O nome de usuário deve ter pelo menos 3 caracteres.');
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        toast.error('O nome de usuário deve conter apenas letras, números e underscore (_).');
        return;
    }
    setIsLoading(true);
    const success = await register(username, password); // Changed from email
    setIsLoading(false);
    if (success) {
      toast.success('Registro bem-sucedido! Bem-vindo(a)!');
      navigate('/dashboard');
    } else {
      toast.error('Falha no registro. Este nome de usuário pode já estar em uso ou ocorreu um erro.'); // Updated error message
    }
  };
  
  const commonInputClass = "w-full px-4 py-3 border border-border-color rounded-lg shadow-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-shadow bg-card-bg text-text-primary placeholder-text-secondary";


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
           {settings.customLogo ? (
            <img src={settings.customLogo} alt={`${APP_NAME} Logo`} className="h-12 sm:h-16 mx-auto mb-2 object-contain" />
          ) : (
            <h1 className="text-4xl sm:text-5xl font-bold text-accent mb-2">{APP_NAME}</h1>
          )}
          <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">Crie sua Conta</h2>
          <p className="text-text-secondary">Comece a gerenciar seus projetos de forma inteligente.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card-bg shadow-xl rounded-xl p-6 sm:p-8 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-1">Usuário (mín. 3 caracteres, letras, números, _)</label> {/* Changed from Email */}
            <input
              type="text" // Changed from email
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)} // Changed from setEmail
              className={commonInputClass}
              placeholder="seu_usuario" // Changed placeholder
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Senha (mín. 6 caracteres)</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={commonInputClass}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={commonInputClass}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-white py-3 px-4 rounded-lg shadow-md hover:brightness-90 transition-all duration-150 ease-in-out font-semibold text-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Registrando...' : 'Registrar'}
          </button>
          <p className="text-center text-sm text-text-secondary">
            Já tem uma conta?{' '}
            <Link to="/login" className="font-medium text-accent hover:underline">
              Fazer Login
            </Link>
          </p>
        </form>
      </div>
       <footer className="text-center text-xs text-slate-500 mt-8 sm:mt-12">
        <p>&copy; {new Date().getFullYear()} {APP_NAME} Soluções. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default RegisterPage;
