import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Package, Globe, LayoutDashboard, Edit, Trash2, Save, ExternalLink, ArrowLeft, Info, X, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

const TenantManager = () => {
    const { user } = useAuth();
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    // Form states
    const [newName, setNewName] = useState('');
    const [newSubdomain, setNewSubdomain] = useState('');
    const [newOwnerEmail, setNewOwnerEmail] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#3b82f6'); // Default blue
    const [logoUrl, setLogoUrl] = useState('');

    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState(null); // ID if editing

    // Details Modal State
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        // En una implementación real, verificaríamos el rol de super_admin aquí o en el router
        // Por seguridad, asegúrate de tener una política RLS que solo permita a super_admin leer todos los tenants
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            // Fetch tenants and their associated owner profile
            // We assume user_profiles has a foreign key to tenants
            const { data, error } = await supabase
                .from('tenants')
                .select(`
                    *,
                    user_profiles (
                        email,
                        role,
                        full_name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTenants(data || []);
        } catch (error) {
            console.error('Error fetching tenants:', error);
            setMessage({ type: 'error', text: 'Error cargando las empresas.' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewName('');
        setNewSubdomain('');
        setNewOwnerEmail('');
        setPrimaryColor('#3b82f6');
        setLogoUrl('');
        setEditingId(null);
    };

    const handleStartEdit = (tenant) => {
        setEditingId(tenant.id);
        setNewName(tenant.name);
        setNewSubdomain(tenant.subdomain);
        // Config defaults
        setPrimaryColor(tenant.config?.primaryColor || '#3b82f6');
        setLogoUrl(tenant.config?.logoUrl || '');
        // Owner email is harder to get from just tenant row unless we join, 
        // for now we might skip editing owner or imply it works different.
        // Let's keep it simple: Update details only.
        setNewOwnerEmail('');
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta empresa? Se perderán todos sus datos.')) return;
        try {
            const { error } = await supabase.from('tenants').delete().eq('id', id);
            if (error) throw error;
            setMessage({ type: 'success', text: 'Empresa eliminada.' });
            fetchTenants();
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al eliminar: ' + error.message });
        }
    };

    const handleUpdatePlan = async (id, status) => {
        try {
            const { error } = await supabase
                .from('tenants')
                .update({ plan_status: status })
                .eq('id', id);

            if (error) throw error;
            setMessage({ type: 'success', text: `Plan actualizado a ${status}` });
            fetchTenants(); // Recargar
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error actualizando plan' });
        }
    };

    const handleExtendTrial = async (id) => {
        try {
            // Obtener fecha actual del tenant o usar now() + 7 days
            // Para simplicidad, seteamos trial_ends_at = now() + 7 days desde hoy
            // O podríamos sumar a la fecha actual si no ha vencido, pero start simple.
            const { error } = await supabase
                .from('tenants')
                .update({
                    plan_status: 'trial',
                    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Trial extendido 7 días desde hoy.' });
            fetchTenants();
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error extendiendo trial' });
        }
    };

    const handleToggleBot = async (tenant) => {
        try {
            const newStatus = !tenant.bot_enabled;
            const { error } = await supabase
                .from('tenants')
                .update({ bot_enabled: newStatus })
                .eq('id', tenant.id);

            if (error) throw error;
            setMessage({ type: 'success', text: `Bot ${newStatus ? 'ACTIVADO' : 'DESACTIVADO'} para ${tenant.name}` });
            fetchTenants();
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error actualizando estado del bot' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);
        setMessage(null);

        try {
            if (editingId) {
                // UPDATE MODE
                const { error } = await supabase
                    .from('tenants')
                    .update({
                        name: newName,
                        subdomain: newSubdomain,
                        config: {
                            primaryColor,
                            logoUrl
                        }
                    })
                    .eq('id', editingId);

                if (error) throw error;
                setMessage({ type: 'success', text: 'Empresa actualizada correctamente.' });
                resetForm();
                fetchTenants();

            } else {
                // CREATE MODE
                const { data, error } = await supabase.rpc('create_tenant_with_owner', {
                    tenant_name: newName,
                    tenant_subdomain: newSubdomain,
                    owner_email: newOwnerEmail,
                    owner_password: 'tempPassword123!'
                });

                if (error) throw error;

                // Update config explicitly after creation since RPC mainly handles structure
                // Or we could update RPC, but client side update is easier for now:
                // Wait for RPC to return ID (it returns jsonb)
                if (data && data.tenant_id) {
                    await supabase.from('tenants').update({
                        config: { primaryColor, logoUrl }
                    }).eq('id', data.tenant_id);
                }

                setMessage({ type: 'success', text: `Empresa "${newName}" creada y asignada a  ${newOwnerEmail}!` });
                resetForm();
                fetchTenants();
            }

        } catch (error) {
            console.error('Error saving tenant:', error);
            setMessage({ type: 'error', text: error.message || 'Error guardando la empresa.' });
        } finally {
            setCreating(false);
        }
    };

    const getOwnerName = (tenant) => {
        if (!tenant.user_profiles) return 'N/A';
        const owner = Array.isArray(tenant.user_profiles)
            ? tenant.user_profiles.find(p => p.role === 'tenant_owner') || tenant.user_profiles[0]
            : tenant.user_profiles;

        return owner?.full_name || 'Sin Nombre';
    };

    const getOwnerEmail = (tenant) => {
        if (!tenant.user_profiles) return 'N/A';
        // Find the profile with role 'tenant_owner' or just take the first one if we assume relation is correct
        const owner = Array.isArray(tenant.user_profiles)
            ? tenant.user_profiles.find(p => p.role === 'tenant_owner') || tenant.user_profiles[0]
            : tenant.user_profiles;

        return owner?.email || 'Sin Asignar';
    };

    const openDetails = (tenant) => {
        setSelectedTenant(tenant);
        setShowDetailsModal(true);
    };

    const closeDetails = () => {
        setShowDetailsModal(false);
        setSelectedTenant(null);
    };

    if (loading) return <div className="p-8 text-center text-white">Cargando empresas...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 border-b border-gray-700 pb-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link to="/admin/dashboard" className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors border border-gray-600">
                                <ArrowLeft size={20} className="text-gray-300" />
                            </Link>
                            <h1 className="text-3xl font-bold text-blue-500">Gestión de Empresas (Super Admin)</h1>
                        </div>
                        <p className="text-gray-400 mt-2 ml-12">Crea empresas y asigna sus dueños.</p>
                    </div>
                </header>

                {message && (
                    <div className={`p-4 mb-6 rounded ${message.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Formulario de Creación */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
                        <h2 className="text-xl font-semibold mb-4 text-white">
                            {editingId ? 'Editar Empresa' : 'Nueva Empresa'}
                        </h2>
                        {editingId && (
                            <button onClick={resetForm} className="text-sm text-gray-400 hover:text-white mb-4 underline">
                                Cancelar edición
                            </button>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre de la Empresa</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                    placeholder="Ej: Tienda de Ropa S.A."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Subdominio</label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        required
                                        value={newSubdomain}
                                        onChange={e => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-l p-2 text-white focus:border-blue-500 outline-none"
                                        placeholder="ej: tienda-ropa"
                                    />
                                    <span className="bg-gray-700 border border-gray-600 border-l-0 rounded-r p-2 text-gray-400 text-sm">
                                        .tudeploy.com
                                    </span>
                                </div>
                            </div>

                            {!editingId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Email del Dueño (Master)</label>
                                    <input
                                        type="email"
                                        required={!editingId}
                                        value={newOwnerEmail}
                                        onChange={e => setNewOwnerEmail(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-blue-500 outline-none"
                                        placeholder="usuario@ejemplo.com"
                                    />
                                    <p className="text-xs text-yellow-500 mt-1">⚠️ El usuario debe haberse registrado previamente.</p>
                                </div>
                            )}

                            {/* Branding Config */}
                            <div className="pt-4 border-t border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-300 mb-2">Personalización</h3>

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Color Principal</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={e => setPrimaryColor(e.target.value)}
                                            className="h-8 w-12 rounded cursor-pointer border-0 bg-transparent p-0"
                                        />
                                        <input
                                            type="text"
                                            value={primaryColor}
                                            onChange={e => setPrimaryColor(e.target.value)}
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded p-1 text-sm text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">URL del Logo</label>
                                    <input
                                        type="text"
                                        value={logoUrl}
                                        onChange={e => setLogoUrl(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-white"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className={`w-full text-white font-bold py-2 px-4 rounded transition-colors mt-4 ${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {creating ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Crear Empresa +')}
                            </button>
                        </form>
                    </div>

                    {/* Lista de Empresas */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-semibold mb-4 text-white">Empresas Activas ({tenants.length})</h2>

                        {tenants.length === 0 ? (
                            <p className="text-gray-500 italic">No hay empresas registradas.</p>
                        ) : (
                            <div className="grid gap-4">
                                {tenants.map(tenant => (
                                    <div
                                        key={tenant.id}
                                        onClick={() => openDetails(tenant)}
                                        className={`bg-gray-800 p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center group transition-colors gap-4 cursor-pointer hover:bg-gray-750 ${tenant.plan_status === 'expired' ? 'border-red-800 opacity-75' : 'border-gray-700 hover:border-gray-500'
                                            }`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{tenant.name}</h3>
                                                <button
                                                    onClick={() => openDetails(tenant)}
                                                    className="text-gray-400 hover:text-blue-300 transition-colors p-1"
                                                    title="Ver Detalles Completos"
                                                >
                                                    <Info size={16} />
                                                </button>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1 space-y-1">
                                                <p>Subdominio: <span className="text-gray-300 font-mono bg-gray-900 px-2 py-0.5 rounded">{tenant.subdomain}</span></p>
                                                <p className="text-xs text-gray-500">ID: {tenant.id}</p>
                                            </div>

                                            {/* PLAN INFO */}
                                            <div className="mt-3 space-y-1">
                                                <div className="text-xs text-gray-400">
                                                    <span className="font-semibold text-gray-300">Cliente:</span> {getOwnerName(tenant)}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-block px-2 py-0.5 text-xs rounded border ${tenant.plan_status === 'active' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                                        tenant.plan_status === 'expired' ? 'bg-red-900/30 text-red-400 border-red-800' :
                                                            'bg-yellow-900/30 text-yellow-400 border-yellow-800'
                                                        }`}>
                                                        {tenant.plan_status === 'active' ? 'PLAN ACTIVO' :
                                                            tenant.plan_status === 'expired' ? 'VENCIDO' : 'TRIAL'}
                                                    </span>
                                                    {tenant.plan_status === 'trial' && tenant.trial_ends_at && (
                                                        <span className="text-xs text-yellow-500">
                                                            Vence: {new Date(tenant.trial_ends_at).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                            {/* ACTION BUTTONS */}
                                            <div className="flex flex-wrap justify-end gap-2 mt-2">

                                                {/* Botones de Gestión de Plan */}
                                                {tenant.plan_status !== 'active' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdatePlan(tenant.id, 'active'); }}
                                                        className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs rounded font-bold shadow-sm"
                                                        title="Activar Servicio Completo"
                                                    >
                                                        ✅ Activar
                                                    </button>
                                                )}

                                                {(tenant.plan_status === 'trial' || tenant.plan_status === 'expired') && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleExtendTrial(tenant.id); }}
                                                        className="px-3 py-1.5 bg-yellow-700 hover:bg-yellow-600 text-white text-xs rounded font-bold shadow-sm"
                                                        title="Extender 7 días"
                                                    >
                                                        ⏳ +7 Días
                                                    </button>
                                                )}

                                                {/* Botón Ver Tienda */}
                                                <div onClick={e => e.stopPropagation()}>
                                                    <a
                                                        href={`/?tenant=${tenant.subdomain}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors shadow-sm"
                                                    >
                                                        <Globe size={14} /> Ver
                                                    </a>
                                                </div>

                                                {/* Botón Admin */}
                                                <div onClick={e => e.stopPropagation()}>
                                                    <a
                                                        href={`/admin/dashboard?tenant=${tenant.subdomain}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors shadow-sm"
                                                    >
                                                        <LayoutDashboard size={14} /> Admin
                                                    </a>
                                                </div>

                                                {/* Toggle Bot */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleToggleBot(tenant); }}
                                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded border transition-colors ${tenant.bot_enabled
                                                        ? 'bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-400 border-cyan-800'
                                                        : 'bg-gray-700 hover:bg-gray-600 text-gray-400 border-gray-600'
                                                        }`}
                                                    title={tenant.bot_enabled ? "Desactivar ChatBot" : "Activar ChatBot"}
                                                >
                                                    <Bot size={14} />
                                                    {tenant.bot_enabled ? 'Bot ON' : 'Bot OFF'}
                                                </button>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStartEdit(tenant); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded border border-gray-600 transition-colors"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(tenant.id); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 text-xs rounded border border-red-900/60 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DE DETALLES */}
            {showDetailsModal && selectedTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeDetails}>
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-700">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Package className="text-blue-500" />
                                Detalles de la Empresa
                            </h3>
                            <button onClick={closeDetails} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 text-gray-300 max-h-[70vh] overflow-y-auto">

                            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-500 mb-1">Nombre</p>
                                <p className="text-lg font-semibold text-white">{selectedTenant.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <p className="text-sm text-gray-500 mb-1">Nombre del Cliente</p>
                                    <p className="text-lg font-medium text-white">{getOwnerName(selectedTenant)}</p>
                                </div>
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <p className="text-sm text-gray-500 mb-1">Email del Cliente</p>
                                    <p className="text-lg font-medium text-blue-400 truncate" title={getOwnerEmail(selectedTenant)}>
                                        {getOwnerEmail(selectedTenant)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <p className="text-sm text-gray-500 mb-1">Subdominio</p>
                                    <p className="text-white font-mono">{selectedTenant.subdomain}</p>
                                </div>
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <p className="text-sm text-gray-500 mb-1">Estado Plan</p>
                                    <span className={`inline-block px-2 py-0.5 text-xs rounded mt-1 border ${selectedTenant.plan_status === 'active' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                                        {selectedTenant.plan_status?.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-500 mb-1">ID del Sistema</p>
                                <p className="text-xs font-mono text-gray-400 break-all">{selectedTenant.id}</p>
                            </div>

                            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-500 mb-1">Fecha de Creación</p>
                                <p className="text-white">{new Date(selectedTenant.created_at).toLocaleString()}</p>
                            </div>

                            {selectedTenant.plan_status === 'trial' && (
                                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                    <p className="text-sm text-gray-500 mb-1">Vencimiento Trial</p>
                                    <p className="text-yellow-400">{new Date(selectedTenant.trial_ends_at).toLocaleString()}</p>
                                </div>
                            )}

                            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-500 mb-2">Configuración Visual</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full border border-gray-600 shadow-sm" style={{ backgroundColor: selectedTenant.config?.primaryColor }}></div>
                                        <span className="text-xs">{selectedTenant.config?.primaryColor}</span>
                                    </div>
                                    {selectedTenant.config?.logoUrl && (
                                        <a href={selectedTenant.config.logoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate max-w-[150px]">
                                            Ver Logo
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-500 mb-2">Características Adicionales</p>
                                <div className="flex items-center gap-2">
                                    <Bot size={18} className={selectedTenant.bot_enabled ? "text-cyan-400" : "text-gray-600"} />
                                    <span className={selectedTenant.bot_enabled ? "text-white" : "text-gray-500"}>
                                        ChatBot IA: {selectedTenant.bot_enabled ? "ACTIVADO" : "DESACTIVADO"}
                                    </span>
                                </div>
                            </div>

                        </div>
                        <div className="p-4 border-t border-gray-700 flex justify-end">
                            <button
                                onClick={closeDetails}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-medium transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantManager;
