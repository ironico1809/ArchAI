import React, { useState } from 'react';
import { 
  Boxes, 
  Users, 
  Radio, 
  Key, 
  UserCheck, 
  ArrowRight, 
  Sparkles,
  User,
  Mail,
  Lock,
  Briefcase,
  FolderKanban
} from 'lucide-react';
import { PerfilUsuario, InformacionSesion, RolUsuario } from '../../types/auth';
import { GlassTextField } from '../glass/GlassTextField';
import { GlassDropdown, DropdownOption } from '../glass/GlassDropdown';
import { LoginBackground } from './LoginBackground';
import {
  iniciarSesion,
  registrarUsuario,
  crearSalaColaborativa,
  unirseSalaColaborativa
} from '../../services/api';

interface LoginModalProps {
  onLoginSuccess: (session: InformacionSesion, targetView?: 'proyectos' | 'estudio') => void;
}

const ROLE_OPTIONS: DropdownOption<RolUsuario>[] = [
  { value: 'Arquitecto de Software', label: 'Arquitecto de Software', icon: <Briefcase size={14} color="var(--text-secondary)" /> },
  { value: 'Ingeniero de Datos', label: 'Ingeniero de Datos', icon: <Briefcase size={14} color="var(--text-secondary)" /> },
  { value: 'Desarrollador Backend', label: 'Desarrollador Backend', icon: <Briefcase size={14} color="var(--text-secondary)" /> },
  { value: 'Ingeniero Frontend', label: 'Ingeniero Frontend', icon: <Briefcase size={14} color="var(--text-secondary)" /> },
  { value: 'Líder Técnico', label: 'Líder Técnico', icon: <Briefcase size={14} color="var(--text-secondary)" /> }
];

// 🎨 Paleta Midnight Navy & Warm Sand (vault 01 - Arquitectura): avatares sobrios,
// sin tonos "arcoíris" estridentes.
const AVATAR_COLORS = [
  '#e8c39e', '#2f2c79', '#8892b0', '#f5e1ce', '#5c688c', '#3a3670'
];

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'host' | 'join' | 'solo'>('host');
  const [name, setName] = useState('Ing. Carlos Criado');
  const [email, setEmail] = useState('carlos.criado@archai.io');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<RolUsuario>('Arquitecto de Software');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [roomPin, setRoomPin] = useState('');
  const [roomName, setRoomName] = useState('Sesión Examen CASE - Grupo 04');
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [errorLocal, setErrorLocal] = useState('');
  const [salaDetectada] = useState<string>(() => {
    try {
      return localStorage.getItem('archai_ultima_sala') || '';
    } catch {
      return '';
    }
  });

  const handleSubmit = async (e?: React.FormEvent, targetView: 'proyectos' | 'estudio' = 'proyectos') => {
    if (e) e.preventDefault();

    // CU-01 · Registro explícito de nuevo usuario (precondición del inicio de sesión)
    if (modo === 'registro') {
      if (!name.trim() || !email.trim() || password.trim().length < 6) {
        setErrorLocal('Complete todos los campos. La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      setErrorLocal('');
      setLoading(true);
      try {
        await registrarUsuario({
          nombre: name.trim(),
          nombreUsuario: name.trim().toLowerCase().replace(/\s+/g, '_'),
          correo: email.trim(),
          contrasena: password.trim(),
          rol: role as string
        });
        // Autenticación automática tras el registro
        const data = await iniciarSesion(email.trim(), password.trim());
        if (data && data.session) {
          localStorage.setItem('archai_token', data.token || '');
          localStorage.setItem('archai_session', JSON.stringify(data.session));
          onLoginSuccess(data.session, targetView);
          return;
        }
        setModo('login');
      } catch (err: any) {
        setErrorLocal(err?.message || 'No se pudo registrar el usuario en el backend.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!name.trim() || !email.trim()) return;
    setErrorLocal('');
    setLoading(true);

    try {
      // CU-01 · Autenticación contra el backend (email/username/contraseña)
      const data = await iniciarSesion(email.trim(), password.trim());
      if (data && data.session) {
        let sesion = data.session;

        // CU-03 · Sala colaborativa real: el anfitrión crea la sala y obtiene el PIN;
        // el colaborador se une con el PIN compartido.
        try {
          if (tab === 'host') {
            sesion = await crearSalaColaborativa(roomName.trim() || 'Sesión de Ingeniería', data.user);
          } else if (tab === 'join' && roomPin.trim()) {
            sesion = await unirseSalaColaborativa(roomPin.trim(), data.user);
          }
        } catch {
          // se conserva la sesión devuelta por el login
        }

        localStorage.setItem('archai_token', data.token || '');
        localStorage.setItem('archai_session', JSON.stringify(sesion));
        if (sesion.roomId && sesion.roomId !== 'LOCAL-MODE') {
          localStorage.setItem('archai_ultima_sala', sesion.roomId);
        }
        onLoginSuccess(sesion, targetView);
        return;
      }
    } catch (err: any) {
      console.warn('Backend en arranque o credenciales inválidas, aplicando fallback local:', err?.message);
    } finally {
      setLoading(false);
    }

    // 2. Fallback de sesión en modo local
    let generatedRoomId = '';
    let isHost = false;

    if (tab === 'host') {
      generatedRoomId = 'ARC-' + Math.floor(100000 + Math.random() * 900000);
      isHost = true;
    } else if (tab === 'join') {
      generatedRoomId = roomPin.trim() || 'ARC-GRUPO04';
      isHost = false;
    } else {
      generatedRoomId = 'LOCAL-MODE';
      isHost = true;
    }

    const currentUser: PerfilUsuario = {
      id: 'usr-' + Date.now(),
      name: name.trim(),
      email: email.trim() || 'carlos.criado@archai.io',
      username: name.trim().toLowerCase().replace(/\s+/g, '_'),
      role,
      avatarColor: selectedColor,
      isHost
    };

    const participants: PerfilUsuario[] = [currentUser];

    const session: InformacionSesion = {
      roomId: generatedRoomId,
      roomName: tab === 'solo' ? 'Espacio Individual de Modelado' : (roomName || 'Sesión de Ingeniería'),
      hostName: isHost ? currentUser.name : 'Ing. Anfitrión Remoto',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currentUser,
      participants,
      isLocalMode: tab === 'solo'
    };

    localStorage.setItem('archai_session', JSON.stringify(session));
    if (generatedRoomId && generatedRoomId !== 'LOCAL-MODE') {
      localStorage.setItem('archai_ultima_sala', generatedRoomId);
    }
    onLoginSuccess(session, targetView);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 9999
    }}>
      <LoginBackground />

      {/* 🛸 Superficie de Vidrio Translúcido (Glassmorphism HUD) — Paleta Midnight Navy & Warm Sand */}
      <div className="glass-login-modal" style={{
        maxWidth: '440px',
        width: '100%',
        maxHeight: 'calc(100vh - 36px)',
        overflowY: 'auto',
        padding: '20px 22px',
        position: 'relative',
        zIndex: 10,
        borderRadius: '16px',
        background: 'rgba(23, 26, 74, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(245, 225, 206, 0.16)',
        boxShadow: '0 25px 60px rgba(0, 0, 32, 0.85), 0 0 1px rgba(245, 225, 206, 0.20)'
      }}>
        {/* Clean High-Contrast Header (Marfil + Arena sobre fondo navy) */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #171a4a, #2f2c79)',
              border: '1px solid rgba(232, 195, 158, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e8c39e',
              boxShadow: '0 0 12px rgba(232, 195, 158, 0.30)',
              flexShrink: 0
            }}>
              <Boxes size={16} color="#e8c39e" />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.35rem',
              fontWeight: 900,
              letterSpacing: '0.01em',
              margin: 0,
              color: '#f5e1ce',
              textTransform: 'uppercase'
            }}>
              {modo === 'registro' ? 'Crear Cuenta' : 'Acceder'}
            </h2>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#8892b0', margin: 0, lineHeight: 1.35 }}>
            {modo === 'registro'
              ? 'Ingresa tus credenciales para registrarte en el estudio CASE'
              : 'Ingresa tus credenciales para continuar al espacio de modelado'}
          </p>
        </div>

        {/* 🔔 Banner de Sala Activa Detectada para Conectar en 1 Clic */}
        {salaDetectada && (
          <div style={{
            background: 'rgba(232, 195, 158, 0.08)',
            border: '1px solid rgba(232, 195, 158, 0.28)',
            borderRadius: '9px',
            padding: '6px 10px',
            marginBottom: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Radio size={13} color="#8892b0" />
              <div>
                <div style={{ fontSize: '0.62rem', color: '#8892b0', textTransform: 'uppercase', fontWeight: 700 }}>
                  Sala Activa Detectada
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#e8c39e' }}>
                  {salaDetectada}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setTab('join');
                setRoomPin(salaDetectada);
              }}
              style={{
                background: '#e8c39e',
                color: '#000020',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 12px rgba(232, 195, 158, 0.35)'
              }}
            >
              Conectar
            </button>
          </div>
        )}

        {/* Mode Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '4px',
          background: 'rgba(0, 0, 32, 0.55)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid rgba(245, 225, 206, 0.10)',
          marginBottom: '12px'
        }}>
          <button
            type="button"
            onClick={() => setTab('host')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '6px 4px',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'host' ? '#e8c39e' : 'transparent',
              color: tab === 'host' ? '#000020' : '#8892b0',
              fontSize: '0.76rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Radio size={13} color="currentColor" /> Anfitrión
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '6px 4px',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'join' ? '#e8c39e' : 'transparent',
              color: tab === 'join' ? '#000020' : '#8892b0',
              fontSize: '0.76rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={13} color="currentColor" /> Unirse
          </button>
          <button
            type="button"
            onClick={() => setTab('solo')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '6px 4px',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'solo' ? '#e8c39e' : 'transparent',
              color: tab === 'solo' ? '#000020' : '#8892b0',
              fontSize: '0.76rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={13} color="currentColor" /> Modo Local
          </button>
        </div>

        {/* Selector Rápido de Perfil para Pruebas Simultáneas */}
        <div style={{ marginBottom: '11px' }}>
          <div style={{ fontSize: '0.66rem', color: '#8892b0', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Perfiles rápidos para pruebas:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
            <button
              type="button"
              onClick={() => {
                setName('Ing. Carlos Criado');
                setEmail('carlos.criado@archai.io');
                setRole('Arquitecto de Software');
                setSelectedColor('#e8c39e');
              }}
              style={{
                padding: '5px 6px',
                fontSize: '0.70rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: email === 'carlos.criado@archai.io' ? '1px solid #e8c39e' : '1px solid rgba(245, 225, 206, 0.10)',
                background: email === 'carlos.criado@archai.io' ? 'rgba(232, 195, 158, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                color: '#f5e1ce'
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e8c39e', flexShrink: 0 }} />
              <span>Carlos</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setName('Dra. Elena Ramos');
                setEmail('elena.ramos@archai.io');
                setRole('Ingeniero de Datos');
                setSelectedColor('#8892b0');
              }}
              style={{
                padding: '5px 6px',
                fontSize: '0.70rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: email === 'elena.ramos@archai.io' ? '1px solid #8892b0' : '1px solid rgba(245, 225, 206, 0.10)',
                background: email === 'elena.ramos@archai.io' ? 'rgba(136, 146, 176, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                color: '#f5e1ce'
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#8892b0', flexShrink: 0 }} />
              <span>Elena</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setName('Ing. Lucas Vaca');
                setEmail('lucas.vaca@archai.io');
                setRole('Desarrollador Backend');
                setSelectedColor('#2f2c79');
              }}
              style={{
                padding: '5px 6px',
                fontSize: '0.70rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: email === 'lucas.vaca@archai.io' ? '1px solid #2f2c79' : '1px solid rgba(245, 225, 206, 0.10)',
                background: email === 'lucas.vaca@archai.io' ? '#2f2c79' : 'rgba(255, 255, 255, 0.03)',
                color: '#f5e1ce'
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4a4891', flexShrink: 0 }} />
              <span>Lucas</span>
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, 'proyectos')} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* User Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '10px' }}>
            <GlassTextField
              label="Nombre / Usuario"
              required
              leadingIcon={<User size={14} color="#8892b0" />}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Ing. Carlos Criado"
            />
            <GlassTextField
              label="Correo Electrónico"
              required
              type="email"
              leadingIcon={<Mail size={14} color="#8892b0" />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="carlos.criado@archai.io"
            />
          </div>

          {/* Password */}
          <GlassTextField
            label="Contraseña de Acceso"
            required
            type="password"
            leadingIcon={<Lock size={14} color="#8892b0" />}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {/* Role Selection using GlassDropdown */}
          <GlassDropdown
            label="Rol en el Equipo de Examen"
            options={ROLE_OPTIONS}
            value={role}
            onChange={newRole => setRole(newRole)}
          />

          {/* Tab Specific Inputs */}
          {tab === 'host' && (
            <GlassTextField
              label="Nombre de la Sala Colaborativa"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              placeholder="Ej. Sistema Clínico - Grupo A"
            />
          )}

          {tab === 'join' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <GlassTextField
                label="Código PIN de Sala (6 dígitos)"
                required
                leadingIcon={<Key size={14} color="#8892b0" />}
                value={roomPin}
                onChange={e => setRoomPin(e.target.value.toUpperCase())}
                placeholder="ARC-894102 o ARC-GRUPO04"
                style={{ letterSpacing: '2px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
              />
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#8892b0' }}>Sugerencia rápida:</span>
                <button
                  type="button"
                  onClick={() => setRoomPin('ARC-GRUPO04')}
                  style={{
                    background: 'rgba(232, 195, 158, 0.10)',
                    border: '1px solid rgba(232, 195, 158, 0.35)',
                    color: '#e8c39e',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ARC-GRUPO04
                </button>
                {salaDetectada && salaDetectada !== 'ARC-GRUPO04' && (
                  <button
                    type="button"
                    onClick={() => setRoomPin(salaDetectada)}
                    style={{
                      background: 'rgba(232, 195, 158, 0.10)',
                      border: '1px solid rgba(232, 195, 158, 0.35)',
                      color: '#e8c39e',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {salaDetectada}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Avatar Color Picker (Paleta Midnight Navy & Warm Sand) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', color: '#8892b0', marginBottom: '6px', fontWeight: 600 }}>
              Color Distintivo del Cursor / Avatar
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: selectedColor === c ? '2px solid #f5e1ce' : '2px solid transparent',
                    boxShadow: selectedColor === c ? `0 0 8px ${c}` : 'none',
                    cursor: 'pointer',
                    transform: selectedColor === c ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Mensaje de error (CU-01 / CU-03) */}
          {errorLocal && (
            <div style={{
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#f43f5e',
              background: 'rgba(244, 63, 94, 0.10)',
              border: '1px solid rgba(244, 63, 94, 0.25)'
            }}>
              {errorLocal}
            </div>
          )}

          {/* Botones de Acceso (CU-01 / CU-02) — CTA en Arena Cálida con texto Azul Marino */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <button
              type="submit"
              style={{
                padding: '11px',
                fontSize: '0.88rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.01em',
                width: '100%',
                backgroundColor: '#e8c39e',
                color: '#000020',
                border: 'none',
                borderRadius: '7px',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '7px',
                boxShadow: '0 0 16px rgba(232, 195, 158, 0.35)',
                transition: 'all 0.15s ease',
                opacity: loading ? 0.75 : 1
              }}
              disabled={loading}
            >
              {loading ? (
                <span>{modo === 'registro' ? 'Creando cuenta...' : 'Conectando...'}</span>
              ) : modo === 'registro' ? (
                <>
                  <UserCheck size={16} /> Crear Cuenta y Acceder <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <FolderKanban size={16} /> Iniciar Sesión y Gestionar Proyectos <ArrowRight size={15} />
                </>
              )}
            </button>

            {modo === 'login' && (
              <button
                type="button"
                onClick={() => handleSubmit(undefined, 'estudio')}
                disabled={loading}
                style={{
                  padding: '9px',
                  fontSize: '0.80rem',
                  fontWeight: 800,
                  width: '100%',
                  backgroundColor: '#2f2c79',
                  color: '#e8c39e',
                  border: '1px solid rgba(232, 195, 158, 0.30)',
                  borderRadius: '7px',
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                title="Acceso directo al lienzo interactivo UML sin pasar por el gestor de proyectos"
              >
                <Sparkles size={14} color="#e8c39e" />
                <span>Acceso Rápido al Estudio UML</span>
              </button>
            )}
          </div>

        </form>

        {/* Footer info badge */}
        <div style={{
          marginTop: '12px',
          textAlign: 'center',
          fontSize: '0.72rem',
          color: '#8892b0'
        }}>
          <button
            type="button"
            onClick={() => {
              setModo(modo === 'login' ? 'registro' : 'login');
              setErrorLocal('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e8c39e',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.74rem'
            }}
          >
            {modo === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '← Ya tengo cuenta, iniciar sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};