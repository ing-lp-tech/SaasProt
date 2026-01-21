import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const TenantContext = createContext({});

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};

export const TenantProvider = ({ children }) => {
    const { user, profile } = useAuth(); // Acceder al usuario autenticado
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadTenant = async () => {
            try {
                // 1. Detectar Tenant (por Subdominio o Usuario Logueado/Fallback)
                const hostname = window.location.hostname;
                let subdomain = null;
                let tenantData = null;

                // A) Detección por Subdominio
                const IGNORED_SUBDOMAINS = ['www', 'saas-prot', 'ingenieroemprendedor']; // Agrega aquí tus dominios principales

                if (hostname.includes('localhost')) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const tenantParam = urlParams.get('tenant');
                    if (tenantParam) subdomain = tenantParam;
                } else {
                    const urlParams = new URLSearchParams(window.location.search);
                    const tenantParam = urlParams.get('tenant');
                    if (tenantParam) {
                        subdomain = tenantParam;
                    } else {
                        const parts = hostname.split('.');
                        // Estrategia básica: toma el primer elemento si hay más de 2 partes
                        if (parts.length > 2) {
                            const candidate = parts[0];
                            if (!IGNORED_SUBDOMAINS.includes(candidate)) {
                                subdomain = candidate;
                            }
                        }
                    }
                }

                console.log('🔍 Detectando Tenant para subdominio:', subdomain);

                if (subdomain) {
                    const { data, error } = await supabase
                        .from('tenants')
                        .select('*')
                        .eq('subdomain', subdomain)
                        .single();

                    if (error) {
                        console.error('❌ Error cargando tenant por subdominio:', error);
                        setError('Cliente no encontrado');
                        throw error;
                    }
                    tenantData = data;
                }
                // B) Fallback: Usuario Logueado (si no hay subdominio)
                else if (profile && profile.tenant_id) {
                    console.log('👤 Usuario logueado detectado. Cargando tenant del perfil:', profile.tenant_id);
                    const { data, error } = await supabase
                        .from('tenants')
                        .select('*')
                        .eq('id', profile.tenant_id)
                        .single();

                    if (error) console.error('Error cargando tenant del usuario:', error);
                    else tenantData = data;
                }

                // 2. Procesar Tenant encontrado
                if (tenantData) {
                    // console.log('✅ Tenant bases cargado:', tenantData.name);

                    // 2.1 Cargar configuración detallada desde 'site_config'
                    const { data: configData, error: configError } = await supabase
                        .from('site_config')
                        .select('*')
                        .eq('tenant_id', tenantData.id)
                        .single();

                    if (configError && configError.code !== 'PGRST116') {
                        console.error('Error loading site_config:', configError);
                    }

                    // Fusionar configs: 'site_config' tiene prioridad sobre 'tenants.config'
                    const finalConfig = {
                        ...(tenantData.config || {}), // Legacy
                        ...(configData || {})         // Nueva tabla
                    };

                    const tenantWithConfig = {
                        ...tenantData,
                        config: finalConfig
                    };

                    setTenant(tenantWithConfig);
                    console.log('🎨 Tenant Final Config Loaded:', finalConfig);

                    // 3. Aplicar Whitelabel (CSS Variables)
                    if (finalConfig) {
                        const root = document.documentElement;
                        const primaryColor = finalConfig.primaryColor || finalConfig.primary_color;
                        if (primaryColor) root.style.setProperty('--color-primary', primaryColor);
                    }

                    // 4. Validar Plan (Trial/Expired)
                    if (tenantData.plan_status === 'trial' || tenantData.plan_status === 'expired') {
                        const now = new Date();
                        const trialEnd = new Date(tenantData.trial_ends_at);

                        if (now > trialEnd || tenantData.plan_status === 'expired') {
                            console.warn('⛔ PLAN VENCIDO');
                            setError('PLAN_EXPIRED');
                        }
                    }
                } else {
                    setTenant(null);
                    // Si no encontramos tenant y no es localhost base, podría ser error
                    if (subdomain) setError('Cliente no encontrado');
                }

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadTenant();
    }, [profile]); // Recargar si cambia el perfil del usuario

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {loading ? (
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error === 'PLAN_EXPIRED' ? (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4 text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Servicio Suspendido</h1>
                        <p className="text-gray-600 mb-6">
                            El periodo de prueba de esta tienda ha finalizado o el servicio está suspendido.
                        </p>
                        <p className="text-sm text-gray-500">
                            Si eres el dueño, por favor contacta a soporte para reactivar tu cuenta.
                        </p>
                        <a href="https://wa.me/5491162021005" target="_blank" rel="noreferrer" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                            Contactar Soporte
                        </a>
                    </div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-screen text-red-500">
                    <h1 className="text-2xl font-bold">Error de Configuración</h1>
                    <p>No se pudo cargar la información del cliente.</p>
                </div>
            ) : (
                children
            )
            }
        </TenantContext.Provider >
    );
};
