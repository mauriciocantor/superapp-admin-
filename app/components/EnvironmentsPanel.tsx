'use client';
import { useEffect, useState } from 'react';
import { environmentsApi, Environment } from '../lib/api';

const ENV_COLORS = {
  development: { bg: '#E3F2FD', text: '#1565C0', label: 'Development' },
  sandbox:     { bg: '#FFF3E0', text: '#E65100', label: 'Sandbox' },
  production:  { bg: '#E8F5E9', text: '#2E7D32', label: 'Production' },
};

const STATUS_COLORS = {
  inactive: { bg: '#F5F5F5', text: '#888', dot: '#CCC' },
  building: { bg: '#FFF8E1', text: '#F57F17', dot: '#FFB300' },
  ready:    { bg: '#E8F5E9', text: '#2E7D32', dot: '#4CAF50' },
  failed:   { bg: '#FFEBEE', text: '#C62828', dot: '#F44336' },
};

interface Props {
  appId: string;
  appName: string;
  onClose: () => void;
}

export default function EnvironmentsPanel({ appId, appName, onClose }: Props) {
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, [appId]);

  async function load() {
    try {
      const res = await environmentsApi.getEnvironments(appId);
      setEnvs(res.data.environments);
    } finally {
      setLoading(false);
    }
  }

  async function handlePromote(from: string, to: string) {
    if (!confirm(`¿Promover de ${from} a ${to}?`)) return;
    setPromoting(to);
    try {
      await environmentsApi.promote(appId, from, to);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al promover');
    } finally {
      setPromoting(null);
    }
  }

  async function handleGenerateQR(environment: string) {
    setGeneratingQR(environment);
    try {
      const res = await environmentsApi.generateQR(appId, environment);
      setQrUrls(prev => ({ ...prev, [environment]: res.data.qr_url }));
      await load();
    } finally {
      setGeneratingQR(null);
    }
  }

  const cdnBase = 'https://pub-c13c03b06eb04ba584a460bb1e118eb5.r2.dev';

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 50, padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 20,
        width: '100%', maxWidth: 680,
        maxHeight: '90vh', overflow: 'hidden',
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
            <div style={{ fontWeight: 700, fontSize: 16 }}>Ambientes de deploy</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{appName}</div>
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

        {/* Flujo visual */}
        <div style={{
          padding: '12px 20px',
          background: '#f8f9fa',
          borderBottom: '1px solid #eee',
          display: 'flex', alignItems: 'center',
          gap: 8, fontSize: 12, color: '#666',
        }}>
          <span style={{ background: '#E3F2FD', color: '#1565C0', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Development</span>
          <span>→ probar →</span>
          <span style={{ background: '#FFF3E0', color: '#E65100', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Sandbox</span>
          <span>→ aprobar →</span>
          <span style={{ background: '#E8F5E9', color: '#2E7D32', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>Production</span>
          <span style={{ marginLeft: 'auto', color: '#999' }}>Los usuarios ven Production</span>
        </div>

        {/* Ambientes */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Cargando...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {envs.map((env, index) => {
                const envColor = ENV_COLORS[env.environment];
                const statusColor = STATUS_COLORS[env.status];
                const canPromote = env.status === 'ready' && index < envs.length - 1;
                const targetEnv = index === 0 ? 'sandbox' : 'production';
                const qrUrl = qrUrls[env.environment] ||
                  (env.qr_token
                    ? `https://superapp-backend-grtx.onrender.com/environments/qr/${env.qr_token}`
                    : null);

                return (
                  <div key={env.id} style={{
                    border: '1px solid #eee', borderRadius: 14,
                    overflow: 'hidden',
                  }}>
                    {/* Header del ambiente */}
                    <div style={{
                      background: envColor.bg,
                      padding: '12px 16px',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontWeight: 700, fontSize: 14,
                          color: envColor.text,
                        }}>
                          {envColor.label}
                        </span>
                        <span style={{
                          background: statusColor.bg,
                          color: statusColor.text,
                          fontSize: 11, padding: '2px 8px',
                          borderRadius: 20, fontWeight: 500,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{
                            width: 6, height: 6,
                            borderRadius: '50%',
                            background: statusColor.dot,
                            display: 'inline-block',
                          }} />
                          {env.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {/* Botón QR */}
                        <button
                          onClick={() => handleGenerateQR(env.environment)}
                          disabled={generatingQR === env.environment}
                          style={{
                            background: 'white', border: `1px solid ${envColor.text}`,
                            color: envColor.text, borderRadius: 8,
                            padding: '4px 10px', fontSize: 12,
                            cursor: 'pointer', fontWeight: 500,
                          }}
                        >
                          {generatingQR === env.environment ? '...' : '🔲 QR'}
                        </button>
                        {/* Botón promover */}
                        {canPromote && (
                          <button
                            onClick={() => handlePromote(env.environment, targetEnv)}
                            disabled={promoting === targetEnv}
                            style={{
                              background: envColor.text, border: 'none',
                              color: 'white', borderRadius: 8,
                              padding: '4px 12px', fontSize: 12,
                              cursor: 'pointer', fontWeight: 600,
                            }}
                          >
                            {promoting === targetEnv ? '...' : `Promover a ${targetEnv} →`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Info del ambiente */}
                    <div style={{ padding: '12px 16px' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8, marginBottom: 10,
                      }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#888' }}>Versión</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
                            {env.version || '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#888' }}>Commit</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
                            {env.commit_sha?.substring(0, 7) || '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#888' }}>Desplegado por</div>
                          <div style={{ fontSize: 13 }}>{env.deployed_by || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#888' }}>Fecha</div>
                          <div style={{ fontSize: 13 }}>
                            {env.deployed_at
                              ? new Date(env.deployed_at).toLocaleString('es-CO')
                              : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Bundle URL */}
                      {env.bundle_url && (
                        <div style={{
                          background: '#f5f5f5', borderRadius: 8,
                          padding: '6px 10px', marginBottom: 8,
                        }}>
                          <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Bundle URL</div>
                          <div style={{
                            fontFamily: 'monospace', fontSize: 11,
                            color: '#333', wordBreak: 'break-all',
                          }}>
                            {env.bundle_url}
                          </div>
                        </div>
                      )}

                      {/* QR URL */}
                      {qrUrl && (
                        <div style={{
                          background: '#f0f7ff', borderRadius: 8,
                          padding: '8px 10px',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <div>
                            <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>
                              QR de pruebas (permanente)
                            </div>
                            <div style={{
                              fontFamily: 'monospace', fontSize: 11,
                              color: '#1565C0',
                            }}>
                              {qrUrl}
                            </div>
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(qrUrl)}
                            style={{
                              background: '#1565C0', color: 'white',
                              border: 'none', borderRadius: 6,
                              padding: '4px 10px', fontSize: 11,
                              cursor: 'pointer', marginLeft: 8,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Copiar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}