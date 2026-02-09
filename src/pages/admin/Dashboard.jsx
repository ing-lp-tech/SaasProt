import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, FileText, BarChart3, Folder, Users, Globe } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import './Dashboard.css';

import { useTenant } from '../../contexts/TenantContext'; // Importar TenantContext

export default function Dashboard() {
    const { user, role, roleError, signOut } = useAuth();
    const { tenant } = useTenant(); // Obtener tenant actual
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <AdminHeader
                title="Panel de Administración"
                subtitle={`Bienvenido al sistema`}
            />

            <div className="dashboard-grid">
                {/* VISTA PARA ADMINISTRADOR DE TIENDA (CLIENTE) O SUPER ADMIN (GOD MODE) */}
                {/* Solo mostrar si NO es Super Admin, O si es Super Admin PERO está dentro de un tenant (God Mode activo) */}
                {(role === 'admin' || role === 'tenant_owner' || (role === 'owner' && tenant)) && (
                    <>
                        <div
                            className="dashboard-card bg-blue-50 hover:bg-blue-100"
                            onClick={() => {
                                const url = tenant ? `/?tenant=${tenant.subdomain}` : '/';
                                window.open(url, '_blank');
                            }}
                        >
                            <Globe size={32} className="text-blue-600" />
                            <h2 className="text-blue-900">Ver Mi Tienda</h2>
                            <p className="text-blue-700">Ir a la página principal pública</p>
                        </div>

                        <div className="dashboard-card" onClick={() => navigate('/admin/products')}>
                            <Package size={32} />
                            <h2>Gestionar Productos</h2>
                            <p>Agregar, editar y administrar productos</p>
                        </div>

                        <div className="dashboard-card bg-green-50 hover:bg-green-100" onClick={() => navigate('/admin/purchases')}>
                            <Package size={32} className="text-green-600" />
                            <h2 className="text-green-900">Planificar Compras</h2>
                            <p className="text-green-700">Calculadora de costos y lista de posibles compras</p>
                        </div>

                        <div className="dashboard-card" onClick={() => navigate('/admin/categories')}>
                            <Folder size={32} />
                            <h2>Gestionar Categorías</h2>
                            <p>Crear y organizar categorías de productos</p>
                        </div>



                        <div className="dashboard-card" onClick={() => navigate('/admin/site-config')}>
                            <Folder size={32} />
                            <h2>Gestionar Contenido</h2>
                            <p>Editar imágenes de inicio, logos y "Sobre Mí"</p>
                        </div>

                        <div className="dashboard-card" onClick={() => navigate('/admin/leads')}>
                            <Users size={32} />
                            <h2>Clientes Potenciales</h2>
                            <p>Ver contactos capturados (CRM)</p>
                        </div>

                        <div className="dashboard-card" onClick={() => navigate('/admin/team')}>
                            <Users size={32} />
                            <h2>Gestionar Equipo</h2>
                            <p>Asignar roles y permisos (Vendedores)</p>
                        </div>
                    </>
                )}

                {/* VISTA PARA SUPER ADMIN (DUEÑO SAAS) */}
                {role === 'owner' && !tenant && (
                    <>
                        <div className="dashboard-card bg-purple-50 hover:bg-purple-100" onClick={() => navigate('/admin/tenants')}>
                            <Folder size={32} className="text-purple-600" />
                            <h2 className="text-purple-900">Gestionar Clientes (SaaS)</h2>
                            <p className="text-purple-700">Crear nuevas tiendas, gestionar subdominios y planes</p>
                        </div>

                        <div className="dashboard-card" onClick={() => navigate('/admin/leads')}>
                            <Users size={32} />
                            <h2>Leads Globales</h2>
                            <p>Ver todos los leads de la plataforma</p>
                        </div>
                    </>
                )}



                <div className="dashboard-card">
                    <BarChart3 size={32} />
                    <h2>Estadísticas</h2>
                    <p>Próximamente</p>
                </div>
            </div>
        </div>
    );
}
