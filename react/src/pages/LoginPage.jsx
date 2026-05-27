import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { authApi } from '../services/api';
import { validateEmail, validatePassword, validateUsername } from '../utils/validation';

// ── design tokens ──────────────────────────────────────────────────────────
const C = {
  paper:      '#fbf3e2',
  paperAlt:   '#f5e9d0',
  ink:        '#1f1610',
  inkSoft:    '#4d3f30',
  inkMute:    '#8c7a62',
  brick:      '#d24a2e',
  brickDeep:  '#a23320',
  border:     '#e7d8b8',
  gold:       '#f5dfa3',
  amber:      '#e0a428',
};

// ── tiny constellation SVG overlay ─────────────────────────────────────────
function ConstellationOverlay() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.25,
        pointerEvents: 'none',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* connecting lines */}
      <line x1="12%"  y1="18%" x2="28%" y2="32%" stroke="white" strokeWidth="0.8" />
      <line x1="28%"  y1="32%" x2="55%" y2="22%" stroke="white" strokeWidth="0.8" />
      <line x1="55%"  y1="22%" x2="72%" y2="40%" stroke="white" strokeWidth="0.8" />
      <line x1="72%"  y1="40%" x2="88%" y2="28%" stroke="white" strokeWidth="0.8" />
      <line x1="20%"  y1="60%" x2="40%" y2="48%" stroke="white" strokeWidth="0.8" />
      <line x1="40%"  y1="48%" x2="55%" y2="22%" stroke="white" strokeWidth="0.8" />
      <line x1="40%"  y1="48%" x2="62%" y2="68%" stroke="white" strokeWidth="0.8" />
      <line x1="62%"  y1="68%" x2="80%" y2="75%" stroke="white" strokeWidth="0.8" />
      <line x1="15%"  y1="82%" x2="35%" y2="78%" stroke="white" strokeWidth="0.8" />
      <line x1="35%"  y1="78%" x2="62%" y2="68%" stroke="white" strokeWidth="0.8" />
      {/* dots */}
      {[
        [12, 18], [28, 32], [55, 22], [72, 40], [88, 28],
        [20, 60], [40, 48], [62, 68], [80, 75], [15, 82], [35, 78],
        [92, 55], [8,  45], [50, 88], [70, 12],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={`${cx}%`} cy={`${cy}%`} r="2.5" fill="white" />
      ))}
    </svg>
  );
}

// ── decorative mini book covers ─────────────────────────────────────────────
const BOOKS = [
  { color: '#7e4862', title: 'K-Drama',  rotate: '-6deg',  left: '10%' },
  { color: '#3a4a72', title: 'Hogwarts', rotate:  '4deg',  left: '38%' },
  { color: '#6e2c52', title: 'Drama',    rotate: '-2deg',  left: '62%' },
];

function MiniBookCovers() {
  return (
    <div style={{ position: 'relative', height: '148px', width: '100%', marginTop: '8px' }}>
      {BOOKS.map((b) => (
        <div
          key={b.title}
          style={{
            position: 'absolute',
            left: b.left,
            bottom: 0,
            width: '90px',
            aspectRatio: '2/3',
            background: b.color,
            borderRadius: '4px',
            transform: `rotate(${b.rotate})`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '8px',
            transformOrigin: 'bottom center',
          }}
        >
          <span
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '11px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.2,
            }}
          >
            {b.title}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── input component ─────────────────────────────────────────────────────────
function Field({ id, label, type = 'text', value, onChange, placeholder, autoComplete, error, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label
          htmlFor={id}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12.5px',
            fontWeight: 600,
            color: C.inkSoft,
          }}
        >
          {label}
        </label>
        {right}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 14px',
          background: 'white',
          border: `1.5px solid ${error ? C.brick : focused ? C.brick : C.border}`,
          borderRadius: '8px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: C.ink,
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
      />
      {error && (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.brick }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [fields, setFields] = useState({ authorName: '', email: '', password: '' });
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
    if (tab === 'register') {
      if (!fields.authorName) errs.authorName = 'Nome é obrigatório';
      else if (!validateUsername(fields.authorName)) errs.authorName = 'Mínimo 3 caracteres, sem espaços';
    }
    if (!fields.email) errs.email = 'Email é obrigatório';
    else if (!validateEmail(fields.email)) errs.email = 'Email inválido';
    if (!fields.password) errs.password = 'Senha é obrigatória';
    else if (tab === 'register' && !validatePassword(fields.password)) errs.password = 'Mínimo 8 caracteres';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setIsLoading(true);
    setApiError('');
    try {
      if (tab === 'register') {
        const data = await authApi.register(fields.authorName.trim(), fields.email.trim(), fields.password);
        login(data.token);
        navigate('/home');
      } else {
        const data = await authApi.login(fields.email.trim(), fields.password);
        login(data.token);
        navigate('/home');
      }
    } catch (err) {
      if (tab === 'register') {
        let msg = 'Erro ao criar conta. Tente novamente.';
        if (err.message?.includes('email')) msg = 'Este email já está em uso.';
        else if (err.message?.includes('username') || err.message?.includes('usuário')) msg = 'Este nome de usuária já está em uso.';
        else if (err.message?.includes('duplicate')) msg = 'Este email ou nome já está em uso.';
        else if (err.message) msg = err.message;
        setApiError(msg);
      } else {
        setApiError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    toast.info(`Login com ${provider} ainda não está disponível — em breve!`);
  };

  // ── tab pill ──────────────────────────────────────────────────────────────
  const tabBtnStyle = (active) => ({
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    fontSize: '13.5px',
    fontWeight: 600,
    background: active ? 'white' : 'transparent',
    color: active ? C.brick : C.inkMute,
    transition: 'background 0.15s, color 0.15s',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
  });

  // ── copy per tab ──────────────────────────────────────────────────────────
  const isLogin = tab === 'login';
  const headingEl = isLogin
    ? <h1 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: '38px', fontWeight: 700, color: C.ink, lineHeight: 1.18 }}>
        Oi de novo,{' '}
        <em style={{ fontStyle: 'italic', color: C.brick }}>autora</em>.
      </h1>
    : <h1 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: '38px', fontWeight: 700, color: C.ink, lineHeight: 1.18 }}>
        Vamos{' '}
        <em style={{ fontStyle: 'italic', color: C.brick }}>começar</em>?
      </h1>;

  const subtitleText = isLogin
    ? 'Entre na sua conta e volte para onde parou.'
    : 'Crie sua conta e comece a escrever hoje.';

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        background: C.paper,
      }}
    >
      {/* ── LEFT PANEL ───────────────────────────────────────────────────── */}
      <div
        style={{
          width: '46%',
          flexShrink: 0,
          background: C.brick,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '44px 48px 36px',
          overflow: 'hidden',
        }}
      >
        <ConstellationOverlay />

        {/* logo */}
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '26px',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.3px',
            zIndex: 1,
          }}
        >
          <em style={{ fontStyle: 'italic' }}>fic</em>
          <span style={{ color: 'white', margin: '0 1px' }}>·</span>
          verse
        </div>

        {/* center copy */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1, gap: '18px' }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.gold,
            }}
          >
            Bem-vinda de volta
          </p>

          <h2
            style={{
              margin: 0,
              fontFamily: "'Fraunces', serif",
              fontSize: '64px',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.05,
            }}
          >
            Suas histórias{' '}
            <em style={{ fontStyle: 'italic', color: C.amber }}>continuam</em>{' '}
            de onde você parou.
          </h2>

          <p
            style={{
              margin: 0,
              fontFamily: "'Fraunces', serif",
              fontStyle: 'italic',
              fontSize: '19px',
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.55,
              maxWidth: '380px',
            }}
          >
            Login pelo email ou social. Sua estante, capítulos salvos e progresso
            de leitura sincronizam em todos os dispositivos.
          </p>
        </div>

        {/* decorative book covers */}
        <div style={{ zIndex: 1 }}>
          <MiniBookCovers />
        </div>

        {/* footer */}
        <p
          style={{
            margin: '20px 0 0',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: 'rgba(255,255,255,0.45)',
            zIndex: 1,
          }}
        >
          v3.0 · plataforma brasileira de fanfic
        </p>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          overflowY: 'auto',
          background: C.paper,
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* tab switcher */}
          <div
            style={{
              display: 'flex',
              background: C.paperAlt,
              border: `1px solid ${C.border}`,
              borderRadius: '8px',
              padding: '4px',
              gap: '4px',
            }}
          >
            <button style={tabBtnStyle(tab === 'login')}  onClick={() => setTab('login')}>Entrar</button>
            <button style={tabBtnStyle(tab === 'register')} onClick={() => setTab('register')}>Criar conta</button>
          </div>

          {/* heading */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {headingEl}
            <p
              style={{
                margin: 0,
                fontFamily: "'Fraunces', serif",
                fontStyle: 'italic',
                fontSize: '15px',
                color: C.inkMute,
              }}
            >
              {subtitleText}
            </p>
          </div>

          {/* social buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {['Google', 'Apple'].map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleSocialLogin(provider)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 0',
                  background: 'white',
                  border: `1.5px solid ${C.border}`,
                  borderRadius: '8px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: C.inkSoft,
                  cursor: 'pointer',
                }}
              >
                {provider === 'Google'
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.38.07 2.33.74 3.14.8 1.19-.24 2.33-.93 3.6-.84 1.54.12 2.7.72 3.44 1.84-3.16 1.9-2.41 5.71.59 6.82-.57 1.52-1.31 3.02-2.77 4.24zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                }
                {provider}
              </button>
            ))}
          </div>

          {/* divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11.5px',
                color: C.inkMute,
                whiteSpace: 'nowrap',
              }}
            >
              ou com email
            </span>
            <div style={{ flex: 1, height: '1px', background: C.border }} />
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {apiError && (
              <div
                style={{
                  padding: '11px 14px',
                  background: 'rgba(210,74,46,0.08)',
                  border: `1px solid rgba(210,74,46,0.28)`,
                  borderRadius: '8px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13.5px',
                  color: C.brick,
                }}
              >
                {apiError}
              </div>
            )}

            {tab === 'register' && (
              <Field
                id="authorName"
                label="Nome de autora"
                value={fields.authorName || ''}
                onChange={setField('authorName')}
                placeholder="Como quer ser chamada?"
                autoComplete="username"
                error={errors.authorName}
              />
            )}

            <Field
              id="email"
              label="Email"
              type="email"
              value={fields.email}
              onChange={setField('email')}
              placeholder="seu@email.com"
              autoComplete="email"
              error={errors.email}
            />

            <Field
              id="password"
              label="Senha"
              type="password"
              value={fields.password}
              onChange={setField('password')}
              placeholder="Sua senha"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              error={errors.password}
              right={
                isLogin
                  ? <Link
                      to="/forgot-password"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '12px',
                        color: C.brick,
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Esqueci
                    </Link>
                  : null
              }
            />

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: isLoading ? C.brickDeep : C.brick,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = C.brickDeep; }}
              onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = C.brick; }}
            >
              {isLoading ? (isLogin ? 'Entrando…' : 'Criando conta…') : isLogin ? 'Entrar' : 'Criar conta'}
              {!isLoading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          {/* bottom switch */}
          <p
            style={{
              margin: 0,
              textAlign: 'center',
              fontFamily: "'Fraunces', serif",
              fontStyle: 'italic',
              fontSize: '14.5px',
              color: C.inkMute,
            }}
          >
            {isLogin ? 'Ainda não tem conta? ' : 'Já tem uma conta? '}
            <button
              type="button"
              onClick={() => setTab(isLogin ? 'register' : 'login')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: "'Fraunces', serif",
                fontStyle: 'italic',
                fontSize: '14.5px',
                color: C.brick,
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              {isLogin ? 'Crie a sua' : 'Entre aqui'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
