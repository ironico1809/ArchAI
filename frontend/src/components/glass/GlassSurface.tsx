import React from 'react';

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  alpha?: number; // 0.1 to 1.0 (defaults to 0.65)
  shimmerBorder?: boolean;
  elevation?: 'flat' | 'low' | 'high';
  blur?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  alpha = 0.65,
  shimmerBorder = true,
  elevation = 'low',
  blur = 'md',
  style,
  className = '',
  children,
  ...props
}) => {
  const getBlurFilter = () => {
    switch (blur) {
      case 'sm': return 'var(--glass-blur-sm)';
      case 'lg': return 'var(--glass-blur-lg)';
      default: return 'var(--glass-blur-md)';
    }
  };

  const getBoxShadow = () => {
    switch (elevation) {
      case 'high': return 'var(--shadow-glass-elevated)';
      case 'flat': return 'none';
      default: return 'var(--shadow-glass)';
    }
  };

  return (
    <div
      className={`glass-surface ${className}`}
      style={{
        backgroundColor: `rgba(255, 255, 255, ${alpha})`,
        backdropFilter: getBlurFilter(),
        WebkitBackdropFilter: getBlurFilter(),
        border: shimmerBorder ? '1px solid var(--glass-border-color)' : 'none',
        boxShadow: getBoxShadow(),
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
