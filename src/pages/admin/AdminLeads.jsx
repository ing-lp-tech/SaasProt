
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useTenant } from '../../contexts/TenantContext';
import { UserPlus, Save, X, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminLeads() {
    const { tenant } = useTenant();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tenant Creation Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [creating, setCreating] = useState(false);
    const [createMessage, setCreateMessage] = useState(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newSubdomain, setNewSubdomain] = useState('');
    const [newOwnerEmail, setNewOwnerEmail] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#3b82f6');
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        fetchLeads();
    }, [tenant]);

    const fetchLeads = async () => {
        try {
            console.log('Fetching leads...');
            let query = supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            // Si hay tenant activo, filtramos. Si no, mostramos todo (Super Admin)
            if (tenant?.id) {
                query = query.eq('tenant_id', tenant.id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase error fetching leads:', error);
                throw error;
            }

            console.log('Leads data received:', data);
            setLeads(data || []);
        } catch (error) {
            console.error('Error fetching leads:', error);
            alert(`Error al cargar leads: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (lead) => {
        setSelectedLead(lead);
        setNewName(lead.nombre || '');
        setNewOwnerEmail(lead.email || ''); // Assuming 'email' column exists now
        setNewSubdomain('');
        setCreateMessage(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedLead(null);
        setCreateMessage(null);
        setCreating(false);
    };

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        setCreating(true);
        setCreateMessage(null);

        try {
            const { data, error } = await supabase.rpc('create_tenant_with_owner', {
                tenant_name: newName,
                tenant_subdomain: newSubdomain,
                owner_email: newOwnerEmail,
                owner_password: 'tempPassword123!'
            });

            if (error) throw error;

            // Update config explicitly after creation
            if (data && data.tenant_id) {
                await supabase.from('tenants').update({
                    config: { primaryColor, logoUrl }
                }).eq('id', data.tenant_id);
            }

            setCreateMessage({ type: 'success', text: `✅ Empresa paso a producción exitosamente! Usuario asignado: ${newOwnerEmail}` });

            // Opcional: Marcar lead como convertido si existiera ese campo

        } catch (error) {
            console.error('Error creating tenant:', error);
            setCreateMessage({ type: 'error', text: `❌ Error: ${error.message}` });
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/admin/dashboard" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold">CRM - Clientes Potenciales</h1>
            </div>

            {loading ? (
                <p>Cargando...</p>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono / Social</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensaje</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leads.map((lead) => (
                                <tr key={lead.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(lead.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {lead.nombre}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {lead.email || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            <a href={`https://wa.me/${lead.telefono}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline flex items-center gap-1 font-bold">
                                                📱 {lead.telefono}
                                            </a>
                                            {lead.social_link && (
                                                <a href={lead.social_link.startsWith('http') ? lead.social_link : `https://${lead.social_link}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs">
                                                    🔗 Social
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={lead.mensaje}>
                                        {lead.mensaje || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {lead.origen}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button
                                            onClick={() => handleOpenModal(lead)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                                        >
                                            <UserPlus size={16} /> Dar de Alta
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL DE ALTAS */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
                        <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <UserPlus size={20} className="text-indigo-600" />
                                Dar de Alta Nueva Tienda
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {createMessage ? (
                                <div className={`p-4 rounded mb-4 ${createMessage.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                    {createMessage.text}
                                    {createMessage.type === 'success' && (
                                        <div className="mt-3 flex justify-end">
                                            <button onClick={handleCloseModal} className="text-sm underline font-semibold">Cerrar</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={handleCreateTenant} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                                        <input
                                            type="text"
                                            required
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subdominio Único</label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                required
                                                value={newSubdomain}
                                                onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                placeholder="ej: mi-tienda"
                                                className="flex-1 border border-gray-300 rounded-l-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="bg-gray-100 border border-l-0 border-gray-300 text-gray-500 px-3 py-2.5 rounded-r-lg text-sm">
                                                .tudeploy.com
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email del Dueño (Admin)</label>
                                        <input
                                            type="email"
                                            required
                                            value={newOwnerEmail}
                                            onChange={(e) => setNewOwnerEmail(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <p className="text-xs text-orange-600 mt-1">⚠️ El usuario debe estar registrado en Supabase Auth.</p>
                                    </div>

                                    <div className="pt-4 border-t flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creating}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                                        >
                                            {creating ? 'Creando...' : (
                                                <>
                                                    <Check size={18} /> Confirmar Alta
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
