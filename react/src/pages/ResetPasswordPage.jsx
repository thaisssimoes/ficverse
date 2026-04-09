import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';
import AuthLayout from './auth/AuthLayout';
import Button from '../components/ui/Button';
import formStyles from './auth/AuthForm.module.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [fields, setFields] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setField = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (fields.password.length < 8) errs.password = 'Senha deve ter pelo menos 8 caracteres';
    if (fields.password !== fields.confirm) errs.confirm = 'As senhas não coincidem';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, fields.password);
      setStatus('success');
      setMessage('Senha redefinida com sucesso! Redirecionando...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Erro ao redefinir senha. O link pode ter expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Link inválido">
        <div className={`${formStyles.alert} ${formStyles.alertError}`}>
          Link inválido ou expirado.{' '}
          <Link to="/forgot-password" style={{ color: 'inherit', textDecoration: 'underline' }}>
            Solicite um novo link.
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Redefinir senha" subtitle="Digite sua nova senha abaixo.">
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        {status && (
          <div className={`${formStyles.alert} ${status === 'success' ? formStyles.alertSuccess : formStyles.alertError}`}>
            {message}
          </div>
        )}

        <div className={formStyles.group}>
          <label className={formStyles.label} htmlFor="password">Nova senha</label>
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

        <div className={formStyles.group}>
          <label className={formStyles.label} htmlFor="confirm">Confirmar nova senha</label>
          <input
            id="confirm"
            type="password"
            className={`${formStyles.input} ${errors.confirm ? formStyles.error : ''}`}
            value={fields.confirm}
            onChange={setField('confirm')}
            placeholder="Repita a nova senha"
            autoComplete="new-password"
          />
          {errors.confirm && <span className={formStyles.fieldError}>{errors.confirm}</span>}
        </div>

        <Button type="submit" isLoading={isLoading} disabled={status === 'success'} size="lg" style={{ width: '100%' }}>
          Redefinir senha
        </Button>
      </form>
    </AuthLayout>
  );
}
