import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { validateEmail } from '../utils/validation';
import AuthLayout from './auth/AuthLayout';
import Button from '../components/ui/Button';
import formStyles from './auth/AuthForm.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !validateEmail(email)) {
      setEmailError('Digite um email válido');
      return;
    }
    setEmailError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStatus('success');
      setMessage('Se este email estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de entrada.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Esqueci minha senha"
      subtitle="Digite seu email e enviaremos um link para redefinir sua senha."
    >
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        {status && (
          <div className={`${formStyles.alert} ${status === 'success' ? formStyles.alertSuccess : formStyles.alertError}`}>
            {message}
          </div>
        )}

        <div className={formStyles.group}>
          <label className={formStyles.label} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={`${formStyles.input} ${emailError ? formStyles.error : ''}`}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            placeholder="seu@email.com"
            autoComplete="email"
          />
          {emailError && <span className={formStyles.fieldError}>{emailError}</span>}
        </div>

        <Button type="submit" isLoading={isLoading} size="lg" style={{ width: '100%' }}>
          Enviar link de recuperação
        </Button>
      </form>

      <p className={formStyles.footer}>
        Lembrou a senha?{' '}
        <Link to="/login">Voltar ao login</Link>
      </p>
    </AuthLayout>
  );
}
