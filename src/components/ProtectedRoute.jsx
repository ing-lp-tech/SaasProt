import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, role, loading } = useAuth();
    const { tenant } = useTenant();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div>Cargando...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
        // Optional: Redirect to a "Unauthorized" page or just home
        return <Navigate to={tenant ? `/?tenant=${tenant.subdomain}` : "/"} replace />;
    }

    return children;
}
