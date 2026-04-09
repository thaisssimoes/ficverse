import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';
import AuthLayout from './auth/AuthLayout';
import Button from '../components/ui/Button';
import formStyles from './auth/AuthForm.module.css';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState({ username: '', email: '', password: '' });
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
    if (!fields.username) errs.username = 'Nome de usuário é obrigatório';
    else if (!validateUsername(fields.username)) errs.username = 'Mínimo 3 caracteres';
    if (!fields.email) errs.email = 'Email é obrigatório';
    else if (!validateEmail(fields.email)) errs.email = 'Email inválido';
    if (!fields.password) errs.password = 'Senha é obrigatória';
    else if (!validatePassword(fields.password)) errs.password = 'Mínimo 8 caracteres';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setApiError('');
    try {
      const data = await authApi.register(fields.username.trim(), fields.email.trim(), fields.password);
      login(data.token);
      navigate('/home');
    } catch (err) {
      let msg = 'Erro ao criar conta. Tente novamente.';
      if (err.message?.includes('email')) msg = 'Este email já está em uso.';
      else if (err.message?.includes('username') || err.message?.includes('usuário')) msg = 'Este nome de usuário já está em uso.';
      else if (err.message?.includes('duplicate')) msg = 'Este email ou nome de usuário já está em uso.';
      else if (err.message) msg = err.message;
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Criar Conta" subtitle="Junte-se à FicVerse e comece sua história">
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        {apiError && <div className={`${formStyles.alert} ${formStyles.alertError}`}>{apiError}</div>}

        <div className={formStyles.group}>
          <label className={formStyles.label} htmlFor="username">Nome de Usuário</label>
          <input
            id="username"
            type="text"
            className={`${formStyles.input} ${errors.username ? formStyles.error : ''}`}
            value={fields.username}
            onChange={setField('username')}
            placeholder="ex: anasilva"
            autoComplete="username"
          />
          {errors.username && <span className={formStyles.fieldError}>{errors.username}</span>}
        </div>

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
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
          {errors.password && <span className={formStyles.fieldError}>{errors.password}</span>}
        </div>

        <Button type="submit" isLoading={isLoading} size="lg" style={{ width: '100%' }}>
          Criar Conta
        </Button>
      </form>

      <p className={formStyles.footer}>
        Já tem uma conta?{' '}
        <Link to="/login">Faça login</Link>
      </p>
    </AuthLayout>
  );
}
