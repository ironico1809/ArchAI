import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Database, 
  Send, 
  Layers,
  Code2,
  FileText
} from 'lucide-react';
import { ModeloDiagrama } from '../../types/uml';
import { GenerationTab, GeneratedProject } from '../../types/generation';
import { buildGeneratedProject } from '../../services/codeGenerator';

interface CodePreviewModalProps {
  diagram: ModeloDiagrama;
  onClose: () => void;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  diagram,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<GenerationTab>('springboot');
  const [selectedJavaFileIdx, setSelectedJavaFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const project: GeneratedProject = buildGeneratedProject(diagram);

  const getCurrentContent = (): { content: string; filename: string; language: string } => {
    if (activeTab === 'springboot') {
      const file = project.files[selectedJavaFileIdx] || project.files[0];
      return {
        content: file ? file.content : '// No hay clases generadas',
        filename: file ? file.filename : 'Entity.java',
        language: 'java'
      };
    } else if (activeTab === 'postgres') {
      return {
        content: project.ddlSql,
        filename: 'schema_postgresql.sql',
        language: 'sql'
      };
    } else if (activeTab === 'postman') {
      return {
        content: project.postmanJson,
        filename: `${project.projectName}_postman_collection.json`,
        language: 'json'
      };
    } else {
      return {
        content: project.xmiXml,
        filename: `${project.projectName}_architec.xmi`,
        language: 'xml'
      };
    }
  };

  const current = getCurrentContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([current.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = current.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--glass-modal-overlay)',
      backdropFilter: 'var(--glass-blur-lg)',
      WebkitBackdropFilter: 'var(--glass-blur-lg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 2000
    }}>
      <div className="glass-card" style={{
        maxWidth: '1020px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-2xl)',
        overflow: 'hidden',
        border: '1px solid var(--glass-border-color)',
        boxShadow: 'var(--shadow-glass-elevated)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 26px',
          borderBottom: '1px solid var(--glass-border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--glass-surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--glass-accent), var(--glass-success))',
              padding: '8px',
              borderRadius: '10px',
              boxShadow: 'var(--glow-accent)',
              color: '#FFFFFF'
            }}>
              <Code2 size={22} />
            </div>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}>
                Motor de Generación de Código ArchAI
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Spring Boot 3 + PostgreSQL DDL + Postman Collection + XMI OMG UML 2.5
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="glass-button-secondary"
            style={{
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--glass-border-color)',
          background: 'var(--glass-surface)',
          padding: '0 16px'
        }}>
          <button
            onClick={() => setActiveTab('springboot')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'springboot' ? '2px solid var(--glass-accent)' : '2px solid transparent',
              color: activeTab === 'springboot' ? 'var(--glass-accent)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <FileCode size={16} color="var(--glass-accent)" />
            Spring Boot 3 ({project.files.length} archivos Java)
          </button>

          <button
            onClick={() => setActiveTab('postgres')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'postgres' ? '2px solid var(--glass-success)' : '2px solid transparent',
              color: activeTab === 'postgres' ? 'var(--glass-success)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Database size={16} color="var(--glass-success)" />
            PostgreSQL DDL (.sql)
          </button>

          <button
            onClick={() => setActiveTab('postman')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'postman' ? '2px solid var(--glass-warning)' : '2px solid transparent',
              color: activeTab === 'postman' ? 'var(--glass-warning)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} color="var(--glass-warning)" />
            Postman Collection (JSON)
          </button>

          <button
            onClick={() => setActiveTab('xmi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'xmi' ? '2px solid var(--glass-accent-secondary)' : '2px solid transparent',
              color: activeTab === 'xmi' ? 'var(--glass-accent-secondary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              fontFamily: 'var(--font-heading)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={16} color="var(--glass-accent-secondary)" />
            XMI / Architec (OMG UML)
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: '400px', maxHeight: '520px', overflow: 'hidden' }}>
          {/* Spring Boot File Sub-tree */}
          {activeTab === 'springboot' && (
            <div style={{
              width: '260px',
              borderRight: '1px solid var(--glass-border-color)',
              background: 'var(--glass-surface)',
              overflowY: 'auto',
              padding: '14px 10px'
            }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>
                Archivos del Backend
              </div>
              {project.files.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedJavaFileIdx(idx)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid ' + (selectedJavaFileIdx === idx ? 'var(--glass-accent)' : 'transparent'),
                    background: selectedJavaFileIdx === idx ? 'rgba(108, 99, 255, 0.15)' : 'transparent',
                    color: selectedJavaFileIdx === idx ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: selectedJavaFileIdx === idx ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.2s'
                  }}
                >
                  <FileText size={14} color="var(--glass-accent)" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.filename}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Code Viewer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>
            <div style={{
              padding: '10px 18px',
              background: 'var(--glass-surface)',
              borderBottom: '1px solid var(--glass-border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)'
            }}>
              <span>{current.filename}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopy}
                  className="glass-button-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                >
                  {copied ? <Check size={13} color="var(--glass-success)" /> : <Copy size={13} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <button
                  onClick={handleDownload}
                  className="glass-button-pill"
                  style={{ padding: '5px 14px', fontSize: '0.75rem' }}
                >
                  <Download size={13} /> Descargar Archivo
                </button>
              </div>
            </div>
            <pre style={{
              flex: 1,
              margin: 0,
              padding: '18px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              background: 'transparent'
            }}>
              <code>{current.content}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 26px',
          borderTop: '1px solid var(--glass-border-color)',
          background: 'var(--glass-surface-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <span>✅ Compatible con Spring Boot 3.2+, PostgreSQL 15+ y Postman REST Client</span>
          <button className="glass-button-secondary" onClick={onClose} style={{ padding: '6px 16px' }}>
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
