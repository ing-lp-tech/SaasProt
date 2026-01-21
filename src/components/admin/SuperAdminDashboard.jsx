import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Shield, Plus, Trash2, ExternalLink, RefreshCw, Edit, X } from 'lucide-react';
import AdminHeader from './AdminHeader';

const SuperAdminDashboard = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTenantName, setNewTenantName] = useState('');
    const [newTenantSubdomain, setNewTenantSubdomain] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#2563eb');
    const [logoUrl, setLogoUrl] = useState('');
    const [creating, setCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTenants(data || []);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNewTenantName('');
        setNewTenantSubdomain('');
        setPrimaryColor('#2563eb');
        setLogoUrl('');
        setEditingId(null);
    };

    const handleCreateOrUpdateTenant = async (e) => {
        e.preventDefault();
        if (!newTenantName || !newTenantSubdomain) return;

        setCreating(true);
        try {
            const tenantData = {
                name: newTenantName,
                subdomain: newTenantSubdomain.toLowerCase(),
                config: {
                    primaryColor,
                    logoUrl
                }
            };

            let result;

            if (editingId) {
                // Update
                const { data, error } = await supabase
                    .from('tenants')
                    .update(tenantData)
                    .eq('id', editingId)
                    .select()
                    .single();

                if (error) throw error;
                setTenants(tenants.map(t => t.id === editingId ? data : t));
                alert('¡Cliente actualizado exitosamente!');
            } else {
                // Create
                const { data, error } = await supabase
                    .from('tenants')
                    .insert(tenantData)
                    .select()
                    .single();

                if (error) throw error;
                setTenants([data, ...tenants]);
                alert('¡Cliente creado exitosamente!');
            }

            resetForm();

        } catch (error) {
            console.error('Error saving tenant:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setCreating(false);
        }
    };

    const startEditing = (tenant) => {
        setEditingId(tenant.id);
        setNewTenantName(tenant.name);
        setNewTenantSubdomain(tenant.subdomain);
        setPrimaryColor(tenant.config?.primaryColor || '#2563eb');
        setLogoUrl(tenant.config?.logoUrl || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteTenant = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer y borrará todos sus datos.')) return;

        try {
            const { error } = await supabase
                .from('tenants')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setTenants(tenants.filter(t => t.id !== id));
            alert('Cliente eliminado correctamente');
        } catch (error) {
            console.error('Error deleting tenant:', error);
            alert('Error al eliminar: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <AdminHeader
                    title="Panel Super Admin"
                    subtitle="Gestión centralizada de SaaS"
                />

                <div className="flex justify-end mb-4">
                    <button
                        onClick={fetchTenants}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition"
                        title="Recargar datos"
                    >
                        <RefreshCw size={16} /> Recargar lista
                    </button>
                </div>

                {/* Create Tenant Form */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            {editingId ? <Edit size={20} className="text-orange-600" /> : <Plus size={20} className="text-purple-600" />}
                            {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </span>
                        {editingId && (
                            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                                <X size={16} /> Cancelar edición
                            </button>
                        )}
                    </h2>
                    <form onSubmit={handleCreateOrUpdateTenant} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Empresa</label>
                            <input
                                type="text"
                                value={newTenantName}
                                onChange={(e) => setNewTenantName(e.target.value)}
                                placeholder="Ej: Nike Store"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subdominio</label>
                            <input
                                type="text"
                                value={newTenantSubdomain}
                                onChange={(e) => setNewTenantSubdomain(e.target.value)}
                                placeholder="ej: nike"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color Principal</label>
                            <div className="flex bg-white border border-gray-300 rounded-lg p-1 items-center">
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="h-8 w-8 rounded cursor-pointer border-none p-0 mr-2"
                                />
                                <span className="text-xs text-gray-500 font-mono">{primaryColor}</span>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                            <input
                                type="text"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-xs"
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <button
                                type="submit"
                                disabled={creating || !newTenantName || !newTenantSubdomain}
                                className={`w-full text-white p-2 rounded-lg font-medium transition shadow-md ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                            >
                                {creating ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Cliente')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tenants List */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-semibold">Clientes Activos ({tenants.length})</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Cargando clientes...</div>
                    ) : tenants.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No hay clientes registrados aún.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                                    <tr>
                                        <th className="p-4">Empresa</th>
                                        <th className="p-4">Subdominio</th>
                                        <th className="p-4">ID</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-medium text-gray-900">{tenant.name}</td>
                                            <td className="p-4 text-blue-600">
                                                <a href={`http://localhost:5173/?tenant=${tenant.subdomain}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                                                    {tenant.subdomain}
                                                    <ExternalLink size={14} />
                                                </a>
                                            </td>
                                            <td className="p-4 text-xs text-gray-400 font-mono">{tenant.id}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Activo</span>
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => startEditing(tenant)}
                                                    className="text-gray-400 hover:text-orange-500 transition"
                                                    title="Editar Cliente"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTenant(tenant.id)}
                                                    className="text-gray-400 hover:text-red-500 transition"
                                                    title="Eliminar Cliente"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SuperAdminDashboard;
