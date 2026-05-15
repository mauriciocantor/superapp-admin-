'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { registryApi, MiniApp } from '../lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700',
  finance: 'bg-green-100 text-green-700',
  shopping: 'bg-blue-100 text-blue-700',
  health: 'bg-pink-100 text-pink-700',
  transport: 'bg-teal-100 text-teal-700',
};

export default function DashboardPage() {
  const router = useRouter();
  const [apps, setApps] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [newApp, setNewApp] = useState({
    id: '', name: '', description: '',
    category: 'other', permissions: '',
    color: '6C63FF', version: '1.0.0',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/'); return; }
    if (userData) setUser(JSON.parse(userData));
    loadApps();
  }, []);

  async function loadApps() {
    try {
      const res = await registryApi.getApps();
      setApps(res.data.apps);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string) {
    await registryApi.toggle(id);
    setApps(prev =>
      prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const colorInt = parseInt(newApp.color, 16);
    await registryApi.create({
      id: newApp.id,
      name: newApp.name,
      description: newApp.description,
      category: newApp.category,
      color: colorInt,
      permissions: newApp.permissions.split(',').map(p => p.trim()).filter(Boolean),
      version: newApp.version,
      icon_url: '',
      bundle_url: '',
    });
    setShowForm(false);
    loadApps();
  }

  function handleLogout() {
    localStorage.clear();
    router.push('/');
  }

  const activeCount = apps.filter(a => a.enabled).length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white">⚡</span>
            </div>
            <h1 className="font-bold text-gray-900">SuperApp Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="text-3xl font-bold text-gray-900">{apps.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total mini-apps</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="text-3xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-gray-500 mt-1">Activas</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="text-3xl font-bold text-red-500">{apps.length - activeCount}</div>
            <div className="text-sm text-gray-500 mt-1">Inactivas</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Mini-apps registradas</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              + Nueva mini-app
            </button>
          </div>

          {/* Formulario nueva mini-app */}
          {showForm && (
            <form onSubmit={handleCreate} className="p-6 bg-indigo-50 border-b border-indigo-100">
              <h3 className="font-semibold text-gray-900 mb-4">Registrar nueva mini-app</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">ID único</label>
                  <input
                    required
                    placeholder="com.empresa.appname"
                    value={newApp.id}
                    onChange={e => setNewApp({...newApp, id: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Nombre</label>
                  <input
                    required
                    placeholder="Mi App"
                    value={newApp.name}
                    onChange={e => setNewApp({...newApp, name: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Descripción</label>
                  <input
                    required
                    placeholder="Descripción corta"
                    value={newApp.description}
                    onChange={e => setNewApp({...newApp, description: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Categoría</label>
                  <select
                    value={newApp.category}
                    onChange={e => setNewApp({...newApp, category: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="food">Comida</option>
                    <option value="finance">Finanzas</option>
                    <option value="shopping">Compras</option>
                    <option value="health">Salud</option>
                    <option value="transport">Transporte</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Color (hex sin #)</label>
                  <input
                    placeholder="6C63FF"
                    value={newApp.color}
                    onChange={e => setNewApp({...newApp, color: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Permisos (separados por coma)</label>
                  <input
                    placeholder="location, payments"
                    value={newApp.permissions}
                    onChange={e => setNewApp({...newApp, permissions: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white text-sm font-medium px-6 py-2 rounded-xl"
                >
                  Registrar
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500 px-4 py-2"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Lista de apps */}
          {loading ? (
            <div className="p-12 text-center text-gray-400">Cargando...</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {apps.map(app => (
                <div key={app.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `#${(app.color & 0xFFFFFF).toString(16).padStart(6, '0')}22` }}
                  >
                    <span
                      className="text-lg"
                      style={{ color: `#${(app.color & 0xFFFFFF).toString(16).padStart(6, '0')}` }}
                    >
                      ⚡
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{app.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[app.category] || 'bg-gray-100 text-gray-600'}`}>
                        {app.category}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{app.id} · v{app.version}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {app.permissions.length > 0 ? app.permissions.join(', ') : 'sin permisos'}
                  </div>
                  <button
                    onClick={() => handleToggle(app.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${app.enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${app.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}