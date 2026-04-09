import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import { validateEmail } from '../utils/validation';
import AuthLayout from './auth/AuthLayout';
import Button from '../components/ui/Button';
import formStyles from './auth/AuthForm.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setField = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs = {};
    if (!fields.email) errs.email = 'Email é obrigatório';
    else if (!validateEmail(fields.email)) errs.email = 'Email inválido';
    if (!fields.password) errs.password = 'Senha é obrigatória';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setApiError('');
    try {
      const data = await authApi.login(fields.email.trim(), fields.password);
      login(data.token);
      navigate('/home');
    } catch (err) {
      setApiError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Entrar">
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        {apiError && <div className={`${formStyles.alert} ${formStyles.alertError}`}>{apiError}</div>}

        <div className={formStyles.group}>
          <label className={formStyles.label} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={`${formStyles.input} ${errors.email ? formStyles.error : ''}`}
            value={fields.email}
            onChange={setField('email')}
            placeholder="seu@email.com"
            autoComplete="email"
          />
          {errors.email && <span className={formStyles.fieldError}>{errors.email}</span>}
        </div>

        <div className={formStyles.group}>
          <label className={formStyles.label} htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            className={`${formStyles.input} ${errors.password ? formStyles.error : ''}`}
            value={fields.password}
            onChange={setField('password')}
            placeholder="Sua senha"
            autoComplete="current-password"
          />
          {errors.password && <span className={formStyles.fieldError}>{errors.password}</span>}
        </div>

        <Button type="submit" isLoading={isLoading} size="lg" style={{ width: '100%' }}>
          Entrar
        </Button>

        <Link to="/forgot-password" className={formStyles.linkSecondary}>
          Esqueci minha senha
        </Link>
      </form>

      <p className={formStyles.footer}>
        Não tem uma conta?{' '}
        <Link to="/register">Cadastre-se</Link>
      </p>
    </AuthLayout>
  );
}
