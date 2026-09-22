import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: string | number;
  hoverEffect?: boolean;
  radialGlow?: boolean;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  padding = '24px',
  hoverEffect = true,
  radialGlow = true,
  style,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`glass-card ${className}`}
      style={{
        padding,
        ...style
      }}
      {...props}
    >
      {radialGlow && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'var(--card-radial-glow)',
            pointerEvents: 'none',
            opacity: 0.7
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};
