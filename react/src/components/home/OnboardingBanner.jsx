import { Link } from 'react-router-dom';
import styles from './OnboardingBanner.module.css';

/**
 * Banner de onboarding — exibido apenas para usuários autenticados
 * que ainda não criaram um Perfil de Leitura.
 * Desaparece assim que o primeiro perfil é criado.
 */
export default function OnboardingBanner() {
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>Modo Interativo</p>
        <h2 className={styles.title}>Você é a Estrela da História</h2>
        <p className={styles.description}>
          Crie seu Perfil de Leitura e se torne o protagonista de milhares de
          fanfics interativas. Personalize nome, aparência e muito mais — cada
          história se adapta a você.
        </p>
        <Link to="/profiles" className={styles.cta}>
          Criar Perfil de Leitura
        </Link>
      </div>

      {/* Decoração tipográfica */}
      <div className={styles.deco} aria-hidden="true">
        <span className={styles.decoChar}>{'{'}</span>
        <span className={styles.decoWord}>nome</span>
        <span className={styles.decoChar}>{'}'}</span>
      </div>
    </div>
  );
}
