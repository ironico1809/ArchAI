import React from 'react';

interface GlassSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  alpha?: number;
  children: React.ReactNode;
}

export const GlassSidebar: React.FC<GlassSidebarProps> = ({
  width = '280px',
  alpha = 0.35,
  style,
  className = '',
  children,
  ...props
}) => {
  return (
    <aside
      className={`glass-surface ${className}`}
      style={{
        width,
        backgroundColor: `rgba(255, 255, 255, ${alpha})`,
        backdropFilter: 'var(--glass-blur-md)',
        WebkitBackdropFilter: 'var(--glass-blur-md)',
        borderRight: '1px solid var(--glass-border-color)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
      {...props}
    >
      {children}
    </aside>
  );
};
