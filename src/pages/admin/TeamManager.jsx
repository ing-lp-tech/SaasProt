import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

const TeamManager = () => {
    const { user } = useAuth();
    const { tenant } = useTenant();
    const [team, setTeam] = useState([]);
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    // Form
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('staff');
    const [department, setDepartment] = useState('');
    const [inviting, setInviting] = useState(false);

    const departments = ['Ventas', 'Taller', 'Administración', 'Logística', 'Diseño'];

    useEffect(() => {
        if (tenant?.id) {
            fetchTeamAndInvites();
        }
    }, [tenant?.id]);

    const fetchTeamAndInvites = async () => {
        try {
            // 1. Fetch Active Team Members (Profiles linked to this tenant)
            const { data: teamData, error: teamError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('tenant_id', tenant.id);

            if (teamError) throw teamError;
            setTeam(teamData || []);

            // 2. Fetch Pending Invites
            const { data: invitesData, error: invitesError } = await supabase
                .from('tenant_invites')
                .select('*')
                .eq('tenant_id', tenant.id)
                .eq('status', 'pending');

            if (invitesError && invitesError.code !== '42P01') { // Ignore if table doesn't exist yet but it should
                console.error('Error fetching invites:', invitesError);
            }
            setInvites(invitesData || []);

        } catch (error) {
            console.error('Error loading team:', error);
            setMessage({ type: 'error', text: 'Error cargando el equipo.' });
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviting(true);
        setMessage(null);

        try {
            // Insert into tenant_invites
            const { error } = await supabase
                .from('tenant_invites')
                .insert({
                    tenant_id: tenant.id,
                    email: email,
                    role: role,
                    department: department,
                    invited_by: user.id
                });

            if (error) throw error;

            setMessage({ type: 'success', text: `Invitación enviada a ${email}!` });
            setEmail('');
            setDepartment('');

            fetchTeamAndInvites();

        } catch (error) {
            console.error('Error inviting:', error);
            setMessage({ type: 'error', text: 'Error al invitar: ' + error.message });
        } finally {
            setInviting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Cargando equipo...</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-3xl font-bold text-orange-500">Gestión de Equipo - {tenant?.name}</h1>
                    <p className="text-gray-400 mt-2">Administra los accesos y roles de tus colaboradores.</p>
                </header>

                {message && (
                    <div className={`p-4 mb-6 rounded ${message.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Formulario Invitación */}
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
                        <h2 className="text-xl font-semibold mb-4 text-white">Agregar Colaborador</h2>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-orange-500 outline-none"
                                    placeholder="colaborador@empresa.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Rol</label>
                                <select
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-orange-500 outline-none"
                                >
                                    <option value="staff">Staff (Vendedor/Operario)</option>
                                    <option value="tenant_owner">Administrador (Acceso Total)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Departamento (Opcional)</label>
                                <input
                                    list="departments-list"
                                    value={department}
                                    onChange={e => setDepartment(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-orange-500 outline-none"
                                    placeholder="Ej: Ventas"
                                />
                                <datalist id="departments-list">
                                    {departments.map(d => <option key={d} value={d} />)}
                                </datalist>
                            </div>

                            <button
                                type="submit"
                                disabled={inviting}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white font-bold py-2 px-4 rounded transition-colors mt-4"
                            >
                                {inviting ? 'Enviando...' : 'Invitar Usuario +'}
                            </button>
                        </form>
                    </div>

                    {/* Lista de Miembros */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Miembros Activos */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                                Miembros Activos
                                <span className="bg-gray-700 text-sm py-0.5 px-2 rounded-full">{team.length}</span>
                            </h2>
                            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-900/50 text-gray-400 text-sm uppercase">
                                        <tr>
                                            <th className="p-4 font-medium">Usuario</th>
                                            <th className="p-4 font-medium">Rol</th>
                                            <th className="p-4 font-medium">Dpto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {team.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="p-8 text-center text-gray-500 italic">No hay miembros en el equipo aún.</td>
                                            </tr>
                                        ) : (
                                            team.map(member => (
                                                <tr key={member.id} className="hover:bg-gray-700/30 transition-colors">
                                                    <td className="p-4">
                                                        <div className="text-white font-medium">{member.email}</div>
                                                        <div className="text-xs text-gray-500">ID: {member.id.substring(0, 8)}...</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${member.role === 'tenant_owner' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'
                                                            }`}>
                                                            {member.role === 'tenant_owner' ? 'ADMIN' : 'STAFF'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-300">
                                                        {member.department || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Invitaciones Pendientes */}
                        {invites.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                                    Invitaciones Pendientes
                                    <span className="bg-yellow-900/50 text-yellow-500 text-sm py-0.5 px-2 rounded-full">{invites.length}</span>
                                </h2>
                                <div className="space-y-3">
                                    {invites.map(invite => (
                                        <div key={invite.id} className="bg-gray-800/50 border border-gray-700 border-dashed rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                                <div className="text-gray-300">{invite.email}</div>
                                                <div className="text-xs text-gray-500">Rol: {invite.role} • Dpto: {invite.department || 'N/A'}</div>
                                            </div>
                                            <span className="text-xs text-yellow-500 italic">Pendiente de registro</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamManager;
