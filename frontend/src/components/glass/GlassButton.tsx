import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cyan' | 'error';
  pill?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  pill = true,
  icon,
  children,
  style,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary': return 'btn-glass-primary';
      case 'secondary': return 'btn-glass-secondary';
      default: return 'btn-glass-primary';
    }
  };

  return (
    <button
      className={`${getVariantClass()} ${className}`}
      style={{
        borderRadius: pill ? 'var(--radius-full)' : 'var(--radius-md)',
        ...style
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
};
