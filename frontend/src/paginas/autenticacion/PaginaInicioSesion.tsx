import React from 'react';
import { InformacionSesion } from '../../types/auth';
import { LoginModal as ModalInicioSesion } from '../../components/auth/LoginModal';

interface PaginaInicioSesionProps {
  alIniciarSesion: (sesion: InformacionSesion, targetView?: 'proyectos' | 'estudio') => void;
}

export const PaginaInicioSesion: React.FC<PaginaInicioSesionProps> = ({ alIniciarSesion }) => {
  return (
    <main className="pagina-autenticacion" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ModalInicioSesion onLoginSuccess={alIniciarSesion} />
    </main>
  );
};
