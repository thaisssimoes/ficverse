import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../services/api';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const FV = {
  paper: '#fbf3e2', paperAlt: '#f5e9d0',
  surface: '#fffbf3', ink: '#1f1610', inkSoft: '#4d3f30', inkMute: '#8c7a62',
  border: '#e7d8b8', borderStrong: '#d2bd92',
  brick: '#d24a2e', brickDeep: '#a23320', brickSoft: '#fad6cc', brickBg: '#fce8df', onBrick: '#fffbf3',
  moss: '#5a8038', mossSoft: '#d6e0b9', mossBg: '#ecf2da',
  mustard: '#e0a428', mustardSoft: '#f5dfa3', mustardBg: '#fcefc7',
  plum: '#6e2c52', plumSoft: '#e8c8d6', plumBg: '#f7e0eb',
  sky: '#3a8aa8', skySoft: '#c4dde5', skyBg: '#e2eef3',
};

const FIELDS = [
  { key: 'primeiro_nome', label: 'Nome', placeholder: 'Ex: Ana' },
  { key: 'sobrenome', label: 'Sobrenome', placeholder: 'Ex: Silva' },
  { key: 'apelido', label: 'Apelido', placeholder: 'Como a história te chama' },
  { key: 'cor_olhos', label: 'Cor dos Olhos', placeholder: 'Ex: castanho' },
  { key: 'cor_cabelo', label: 'Cor do Cabelo', placeholder: 'Ex: preto' },
  { key: 'cor_favorita', label: 'Cor Favorita', placeholder: 'Ex: roxo' },
  { key: 'comida_favorita', label: 'Comida Favorita', placeholder: 'Ex: pizza' },
  { key: 'idade', label: 'Idade', placeholder: 'Ex: 22' },
];

const emptyForm = () => ({
  name: '', primeiro_nome: '', sobrenome: '', apelido: '',
  cor_olhos: '', cor_cabelo: '', cor_favorita: '', comida_favorita: '', idade: '',
});

function ProfileModal({ profile, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(profile ? {
    name: profile.name,
    primeiro_nome: profile.primeiro_nome || '',
    sobrenome: profile.sobrenome || '',
    apelido: profile.apelido || '',
    cor_olhos: profile.cor_olhos || '',
    cor_cabelo: profile.cor_cabelo || '',
    cor_favorita: profile.cor_favorita || '',
    comida_favorita: profile.comida_favorita || '',
    idade: profile.idade || '',
  } : emptyForm());
  const [saving, setSaving] = useState(false);
  const isEdit = !!profile;
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Dê um nome ao perfil.'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await profileApi.updateProfile(profile.id, form);
        toast.success('Perfil atualizado!');
      } else {
        await profileApi.createProfile(form);
        toast.success('Perfil criado!');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar perfil.');
    } finally { setSaving(false); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: `1px solid ${FV.border}`,
    borderRadius: 8, fontFamily: 'Inter', fontSize: 14, color: FV.ink,
    background: FV.paper, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? `Editar "${profile.name}"` : 'Novo Perfil de Leitura'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} isLoading={saving}>{isEdit ? 'Salvar' : 'Criar Perfil'}</Button>
        </>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: FV.ink, display: 'block', marginBottom: 6 }}>
          Nome do perfil *
        </label>
        <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Eu noturna, Eu de domingo..." maxLength={100} />
        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: FV.inkMute, marginTop: 4 }}>
          Este nome aparece quando você escolhe o perfil para ler uma história.
        </p>
      </div>
      <div style={{ borderTop: `1px solid ${FV.border}`, paddingTop: 16, marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: FV.inkMute, fontWeight: 700 }}>
        Variáveis do personagem
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label style={{ fontFamily: 'Inter', fontSize: 12.5, fontWeight: 600, color: FV.ink, display: 'block', marginBottom: 4 }}>{label}</label>
            <input style={inputStyle} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function ProfilesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileApi.listProfiles,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['profiles'] });

  const handleDelete = async (p) => {
    if (!window.confirm(`Excluir o perfil "${p.name}"?`)) return;
    try {
      await profileApi.deleteProfile(p.id);
      invalidate();
      toast.success('Perfil excluído.');
    } catch (err) { toast.error(err.message || 'Erro ao excluir.'); }
  };

  const tones = [FV.plum, FV.brick, FV.mustard, FV.moss, FV.sky];

  return (
    <PageLayout fullWidth>
      {/* SKY HERO */}
      <div style={{ padding: '36px 40px 28px', background: FV.skyBg, borderBottom: `1px solid ${FV.skySoft}`, position: 'relative', overflow: 'hidden' }}>
        <svg style={{ position: 'absolute', top: -20, right: 60, width: 220, height: 220, opacity: 0.25, pointerEvents: 'none' }} viewBox="0 0 100 100">
          {[...Array(8)].map((_, i) => (
            <path key={i} d={`M0 ${20 + i * 12} Q25 ${10 + i * 12} 50 ${20 + i * 12} T100 ${20 + i * 12}`} fill="none" stroke={FV.sky} strokeWidth="0.6" />
          ))}
        </svg>
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: FV.sky, fontWeight: 700, marginBottom: 10 }}>
            Perfis de leitura · {profiles.length} {profiles.length === 1 ? 'ativo' : 'ativos'}
          </div>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 'clamp(36px,4vw,50px)', fontWeight: 400, letterSpacing: -1.4, margin: '0 0 12px', color: FV.ink, lineHeight: 1 }}>
            Suas <span style={{ fontStyle: 'italic', color: FV.sky }}>versões</span> de leitora.
          </h1>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 16, color: FV.sky, margin: 0, maxWidth: 580, lineHeight: 1.55, opacity: 0.9 }}>
            Crie perfis pra organizar leituras por humor, hora do dia ou estado de espírito. Cada um tem sua própria estante e recomendações.
          </p>
        </div>
      </div>

      <div style={{ padding: '32px 40px 80px', maxWidth: 1180, margin: '0 auto' }}>
        {isLoading ? <LoadingSpinner /> : (
          <>
            {/* PERSONAS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
              {profiles.map((p, idx) => {
                const tone = tones[idx % tones.length];
                return (
                  <article key={p.id} style={{ background: FV.surface, border: `1px solid ${FV.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 22px', background: tone, color: '#fffbf3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fffbf3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setModal(p)} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(255,251,243,0.2)', border: '1px solid rgba(255,251,243,0.3)', color: '#fffbf3', fontFamily: 'Inter', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(p)} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(255,251,243,0.1)', border: '1px solid rgba(255,251,243,0.2)', color: '#fffbf3', fontFamily: 'Inter', fontSize: 11, cursor: 'pointer' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                    <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 400, letterSpacing: -0.6, margin: '0 0 8px', color: FV.ink, lineHeight: 1.05 }}>
                        <span style={{ fontStyle: 'italic', color: tone }}>{p.name.split(' ')[0]}</span>
                        {p.name.split(' ').length > 1 && <> {p.name.split(' ').slice(1).join(' ')}</>}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                        {p.primeiro_nome && <span style={{ padding: '3px 9px', borderRadius: 999, background: FV.paperAlt, color: FV.inkSoft, fontFamily: 'Inter', fontSize: 11, fontWeight: 500 }}>{p.primeiro_nome}{p.sobrenome ? ' ' + p.sobrenome : ''}</span>}
                        {p.apelido && <span style={{ padding: '3px 9px', borderRadius: 999, background: FV.paperAlt, color: FV.inkSoft, fontFamily: 'Inter', fontSize: 11, fontWeight: 500 }}>S/N: {p.apelido}</span>}
                        {p.cor_olhos && <span style={{ padding: '3px 9px', borderRadius: 999, background: FV.paperAlt, color: FV.inkSoft, fontFamily: 'Inter', fontSize: 11, fontWeight: 500 }}>olhos {p.cor_olhos}</span>}
                        {p.cor_cabelo && <span style={{ padding: '3px 9px', borderRadius: 999, background: FV.paperAlt, color: FV.inkSoft, fontFamily: 'Inter', fontSize: 11, fontWeight: 500 }}>cabelo {p.cor_cabelo}</span>}
                        {p.idade && <span style={{ padding: '3px 9px', borderRadius: 999, background: FV.paperAlt, color: FV.inkSoft, fontFamily: 'Inter', fontSize: 11, fontWeight: 500 }}>{p.idade} anos</span>}
                      </div>
                      <button style={{ marginTop: 'auto', width: '100%', padding: '10px 14px', border: `1px solid ${FV.borderStrong}`, borderRadius: 8, background: 'transparent', color: FV.ink, fontFamily: 'Inter', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        Abrir estante
                      </button>
                    </div>
                  </article>
                );
              })}

              {/* CREATE CARD */}
              <article onClick={() => setModal('new')} style={{ background: FV.paperAlt, border: `2px dashed ${FV.borderStrong}`, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14, cursor: 'pointer', minHeight: 280, padding: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: FV.brick, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fffbf3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: -0.4, color: FV.ink, lineHeight: 1.1 }}>
                    Criar <span style={{ fontStyle: 'italic', color: FV.brick }}>nova</span> persona
                  </div>
                  <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 13.5, color: FV.inkSoft, margin: '8px 0 0', lineHeight: 1.5 }}>
                    Tem um humor de leitura que ainda não cabe {profiles.length > 0 ? 'nos outros' : 'aqui'}? Crie um novo.
                  </p>
                </div>
              </article>
            </div>

            {/* DIVIDER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: FV.border, marginBottom: 40 }}>
              <div style={{ flex: 1, height: 1, background: FV.border }} />
              <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, color: FV.brick }}>✦</div>
              <div style={{ flex: 1, height: 1, background: FV.border }} />
            </div>

            {/* HOW IT WORKS */}
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: FV.brick, fontWeight: 700, marginBottom: 14 }}>
                Como funciona
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                {[
                  { n: '01', t: 'Crie uma persona', d: 'Dê um nome e suas características. Escolha tags que combinem com o humor de leitura.', tone: FV.brick },
                  { n: '02', t: 'Salve fanfics nela', d: 'Quando salvar uma fanfic, escolha em qual persona. Cada uma tem sua estante separada.', tone: FV.moss },
                  { n: '03', t: 'Recomendações afinadas', d: 'A home muda de acordo com a persona ativa. Você não recebe drama pesado durante o expediente.', tone: FV.plum },
                ].map(s => (
                  <div key={s.n}>
                    <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 64, fontWeight: 400, fontStyle: 'italic', color: s.tone, lineHeight: 1, letterSpacing: -1.4 }}>{s.n}</div>
                    <h4 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: -0.4, margin: '8px 0 8px', color: FV.ink, lineHeight: 1.1 }}>{s.t}</h4>
                    <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 14, lineHeight: 1.55, color: FV.inkSoft, margin: 0 }}>{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {modal !== null && (
        <ProfileModal
          profile={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { invalidate(); setModal(null); }}
        />
      )}
    </PageLayout>
  );
}
