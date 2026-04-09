import styles from './Typography.module.css';

const VARIANT_MAP = {
  'h1-display':  { tag: 'h1', style: styles.h1Display  },
  'h2-display':  { tag: 'h2', style: styles.h2Display  },
  'h1-reading':  { tag: 'h1', style: styles.h1Reading  },
  'h2-reading':  { tag: 'h2', style: styles.h2Reading  },
  'h3-reading':  { tag: 'h3', style: styles.h3Reading  },
  'body-primary':   { tag: 'p',    style: styles.bodyPrimary   },
  'reading-body':   { tag: 'p',    style: styles.readingBody   }, /* leitura longa — 18-20px, line-height 1.6 */
  'body-secondary': { tag: 'p',    style: styles.bodySecondary },
  'lead':           { tag: 'p',    style: styles.lead          },
  'label-micro':    { tag: 'span', style: styles.labelMicro    },
  'label-small':    { tag: 'span', style: styles.labelSmall    },
  'caption':        { tag: 'span', style: styles.caption       },
};

/**
 * Componente semântico central de tipografia.
 *
 * @param {string}  variant     - Variante visual (ex: 'h1-display', 'body-primary')
 * @param {string}  [as]        - Sobrescreve a tag HTML gerada automaticamente
 * @param {boolean} [noMaxWidth]- Remove o max-width de 65ch do body-primary
 * @param {boolean} [center]    - Centraliza o texto
 * @param {boolean} [accent]    - Aplica a cor accent-brand
 * @param {boolean} [italic]    - Itálico
 * @param {string}  [className] - Classes adicionais
 */
export default function Typography({
  variant = 'body-primary',
  as,
  noMaxWidth = false,
  center = false,
  accent = false,
  italic = false,
  className = '',
  children,
  ...props
}) {
  const config = VARIANT_MAP[variant] ?? VARIANT_MAP['body-primary'];
  const Tag = as ?? config.tag;

  const classNames = [
    config.style,
    noMaxWidth && styles.noMaxWidth,
    center     && styles.center,
    accent     && styles.accent,
    italic     && styles.italic,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={classNames} {...props}>
      {children}
    </Tag>
  );
}
