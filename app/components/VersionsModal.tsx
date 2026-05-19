'use client';
import { useEffect, useState } from 'react';
import { versionsApi } from '../lib/api';

interface Props {
  appId: string;
  appName: string;
  onClose: () => void;
  onRollback: () => void;
}

export default function VersionsModal({ appId, appName, onClose, onRollback }: Props) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState<number | null>(null);

  useEffect(() => {
    versionsApi.getVersions(appId)
      .then(res => setVersions(res.data.versions))
      .finally(() => setLoading(false));
  }, [appId]);

  async function handleRollback(versionId: number, version: string) {
    if (!confirm(`¿Revertir a la versión ${version}?`)) return;
    setRollingBack(versionId);
    try {
      await versionsApi.rollback(appId, versionId);
      onRollback();
      onClose();
    } catch {
      alert('Error al hacer rollback');
    } finally {
      setRollingBack(null);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 50,
      padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 20,
        width: '100%', maxWidth: 500,
        maxHeight: '80vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #eee',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Historial de versiones
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
              {appName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f5f5f5', border: 'none',
              borderRadius: 8, padding: '6px 12px',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            Cerrar
          </button>
        </div>

        {/* Lista de versiones */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
              Cargando versiones...
            </div>
          ) : versions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
              No hay versiones registradas aún.
              Las versiones se registran automáticamente con cada deploy via CI/CD.
            </div>
          ) : (
            versions.map((v, index) => (
              <div key={v.id} style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f5f5f5',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                {/* Indicador activo */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: v.is_active ? '#4CAF50' : '#ddd',
                  flexShrink: 0,
                }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      v{v.version}
                    </span>
                    {v.is_active && (
                      <span style={{
                        background: '#e8f5e9', color: '#2e7d32',
                        fontSize: 11, padding: '2px 8px',
                        borderRadius: 10, fontWeight: 500,
                      }}>
                        Activa
                      </span>
                    )}
                    {index === 0 && !v.is_active && (
                      <span style={{
                        background: '#fff3e0', color: '#e65100',
                        fontSize: 11, padding: '2px 8px',
                        borderRadius: 10, fontWeight: 500,
                      }}>
                        Más reciente
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {new Date(v.deployed_at).toLocaleString('es-CO')}
                    {v.deployed_by && ` · ${v.deployed_by}`}
                  </div>
                  {v.commit_sha && (
                    <div style={{
                      fontFamily: 'monospace', fontSize: 11,
                      color: '#aaa', marginTop: 2,
                    }}>
                      {v.commit_sha}
                    </div>
                  )}
                </div>

                {/* Botón rollback */}
                {!v.is_active && (
                  <button
                    onClick={() => handleRollback(v.id, v.version)}
                    disabled={rollingBack === v.id}
                    style={{
                      background: '#f0eeff', color: '#6C63FF',
                      border: 'none', borderRadius: 8,
                      padding: '6px 12px', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {rollingBack === v.id ? '...' : '↩ Revertir'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}