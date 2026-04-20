import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../services/api';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import styles from './ProfilesPage.module.css';

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
  name: '',
  primeiro_nome: '',
  sobrenome: '',
  apelido: '',
  cor_olhos: '',
  cor_cabelo: '',
  cor_favorita: '',
  comida_favorita: '',
  idade: '',
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

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

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
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? `Editar "${profile.name}"` : 'Novo Perfil'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} isLoading={saving}>{isEdit ? 'Salvar' : 'Criar Perfil'}</Button>
        </>
      }
    >
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Nome do perfil *</label>
        <input
          className={styles.formInput}
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder='Ex: Perfil Principal, Personagem Guerreira...'
          maxLength={100}
        />
        <p className={styles.formHint}>Este nome aparece quando você escolhe o perfil para ler uma história.</p>
      </div>

      <div className={styles.divider}>Variáveis do personagem</div>

      <div className={styles.fieldsGrid}>
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className={styles.formGroup}>
            <label className={styles.formLabel}>{label}</label>
            <input
              className={styles.formInput}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default function ProfilesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'new' | profile object

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profileApi.listProfiles,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['profiles'] });

  const handleDelete = async (p) => {
    if (!window.confirm(`Excluir o perfil "${p.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await profileApi.deleteProfile(p.id);
      invalidate();
      toast.success('Perfil excluído.');
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir.');
    }
  };

  return (
    <PageLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Meus Perfis de Leitura</h1>
            <p className={styles.subtitle}>
              Crie perfis com seu nome e características. Ao ler uma história interativa,
              escolha qual perfil usar — ou crie um novo especialmente para ela.
            </p>
          </div>
          <Button onClick={() => setModal('new')}>+ Novo Perfil</Button>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : profiles.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>👤</span>
            <p className={styles.emptyTitle}>Nenhum perfil criado ainda</p>
            <p className={styles.emptySub}>
              Crie um perfil para que as histórias interativas possam usar seu nome e características automaticamente.
            </p>
            <Button onClick={() => setModal('new')}>Criar meu primeiro perfil</Button>
          </div>
        ) : (
          <div className={styles.grid}>
            {profiles.map((p) => (
              <div key={p.id} className={styles.card}>
                <div className={styles.cardAvatar}>
                  {p.apelido?.charAt(0) || p.primeiro_nome?.charAt(0) || '?'}
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardName}>{p.name}</h3>
                  <div className={styles.cardFields}>
                    {p.primeiro_nome && <span><strong>Nome:</strong> {p.primeiro_nome} {p.sobrenome}</span>}
                    {p.apelido && <span><strong>S/N:</strong> {p.apelido}</span>}
                    {p.cor_olhos && <span><strong>Olhos:</strong> {p.cor_olhos}</span>}
                    {p.cor_cabelo && <span><strong>Cabelo:</strong> {p.cor_cabelo}</span>}
                    {p.cor_favorita && <span><strong>Cor fav.:</strong> {p.cor_favorita}</span>}
                    {p.comida_favorita && <span><strong>Comida fav.:</strong> {p.comida_favorita}</span>}
                    {p.idade && <span><strong>Idade:</strong> {p.idade}</span>}
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <Button variant="secondary" size="sm" onClick={() => setModal(p)}>✏️ Editar</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(p)}>🗑️</Button>
                </div>
              </div>
            ))}
          </div>
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
