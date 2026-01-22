import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import saasLogo from '../../assets/logo_saas_custom.png';

export default function AdminHeader({ title, subtitle }) {
    const { user, role, roleError, signOut } = useAuth();
    const { tenant } = useTenant();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const logoSrc = tenant?.config?.navbar_logo_url || saasLogo;

    return (
        <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center mb-8 rounded-xl">
            <div className="flex items-center gap-4">
                <img
                    src={logoSrc}
                    alt={tenant?.name || "Saas Inge"}
                    className="h-12 w-auto object-contain"
                />
                <div className="border-l pl-4 border-gray-200">
                    <h1 className="text-xl font-bold text-gray-800">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                            {role === 'owner' ? 'Super Admin' : role}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    title="Cerrar Sesión"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}
