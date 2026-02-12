import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import mercadopagoService from '../../services/mercadopagoService';
import AdminHeader from '../../components/admin/AdminHeader';

export default function MercadoPagoSettings() {
    const navigate = useNavigate();
    const { tenant } = useTenant();
    const [loading, setLoading] = useState(false);
    const [hasExistingToken, setHasExistingToken] = useState(false);
    const [config, setConfig] = useState({
        accessToken: '',
        publicKey: '',
        isSandbox: true,
        enabled: false
    });
    const [paymentMethods, setPaymentMethods] = useState([
        { type: 'cash', label: 'Efectivo en local', enabled: true, depositPercentage: null },
        { type: 'mercadopago_full', label: 'MercadoPago (pago completo)', enabled: false, depositPercentage: null },
        { type: 'mercadopago_deposit', label: 'Seña por MercadoPago + resto en efectivo', enabled: false, depositPercentage: 30 }
    ]);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (tenant?.id) {
            loadConfig();
        }
    }, [tenant]);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const mpConfig = await mercadopagoService.getConfig(tenant.id);

            if (mpConfig && mpConfig.enabled !== undefined) {
                // Si tiene ID, significa que ya existe configuración (incluyendo token)
                setHasExistingToken(!!mpConfig.id);
                setConfig({
                    accessToken: '', // No mostramos el token por seguridad
                    publicKey: mpConfig.public_key || '',
                    isSandbox: mpConfig.is_sandbox,
                    enabled: mpConfig.enabled
                });
            }

            const methods = await mercadopagoService.getPaymentMethods(tenant.id);
            if (methods.length > 0) {
                setPaymentMethods(prev => prev.map(pm => {
                    const found = methods.find(m => m.method_type === pm.type);
                    return found ? {
                        ...pm,
                        enabled: found.enabled,
                        depositPercentage: found.deposit_percentage
                    } : pm;
                }));
            }
        } catch (error) {
            console.error('Error cargando config:', error);
            setError('Error al cargar configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setSaved(false);
        setError('');

        try {
            // Validaciones
            if (config.enabled && !config.publicKey) {
                setError('La Public Key es obligatoria para habilitar MercadoPago');
                return;
            }

            // Solo requerimos el Access Token si:
            // 1. No existe uno guardado previamente (primera vez)
            // 2. O el usuario está ingresando uno nuevo para actualizarlo
            if (config.enabled && !config.accessToken && !hasExistingToken) {
                setError('El Access Token es obligatorio para habilitar MercadoPago por primera vez');
                return;
            }

            // Solo enviamos el token si el usuario ingresó uno nuevo
            const configToSave = { ...config };
            if (!config.accessToken && hasExistingToken) {
                // Si no hay token nuevo pero ya existe uno, no lo enviamos (se mantiene el actual)
                delete configToSave.accessToken;
            }

            await mercadopagoService.saveConfig(tenant.id, configToSave);
            await mercadopagoService.updatePaymentMethods(tenant.id, paymentMethods);

            // Si guardamos un nuevo token, actualizamos el estado
            if (config.accessToken) {
                setHasExistingToken(true);
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error guardando:', error);
            setError('Error al guardar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!tenant) {
        return <div className="p-6">Cargando...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <AdminHeader
                title="Configuración de MercadoPago"
                subtitle="Gestiona tus credenciales y métodos de pago"
            />

            <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver al Dashboard</span>
            </button>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Credenciales MercadoPago */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Credenciales</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-900 leading-relaxed">
                        <strong className="text-blue-950">¿Dónde obtengo mis credenciales?</strong><br />
                        1. Ingresa a <a href="https://www.mercadopago.com.ar/developers/panel" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-blue-700 hover:text-blue-900">MercadoPago Developers</a><br />
                        2. Ve a "Credenciales" en el menú lateral<br />
                        3. Copia tu <strong>Access Token</strong> y <strong>Public Key</strong>
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Access Token {!hasExistingToken && <span className="text-red-500">*</span>}
                            {hasExistingToken && <span className="text-green-600 text-xs ml-2">✓ Ya configurado</span>}
                        </label>
                        <input
                            type="text"
                            value={config.accessToken}
                            onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                            onPaste={(e) => {
                                e.preventDefault();
                                const pastedText = e.clipboardData.getData('text');
                                setConfig(prev => ({ ...prev, accessToken: pastedText }));
                            }}
                            className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={hasExistingToken ? "Dejar vacío para mantener el actual" : "APP_USR-..."}
                            autoComplete="off"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            {hasExistingToken
                                ? 'Ya tienes un token guardado. Solo completa este campo si deseas actualizarlo.'
                                : 'Mantén este token seguro. No lo compartas con nadie.'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Public Key <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={config.publicKey}
                            onChange={(e) => setConfig({ ...config, publicKey: e.target.value })}
                            onPaste={(e) => {
                                e.preventDefault();
                                const pastedText = e.clipboardData.getData('text');
                                setConfig(prev => ({ ...prev, publicKey: pastedText }));
                            }}
                            className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="APP_USR-..."
                            autoComplete="off"
                        />
                    </div>

                    <div className="flex items-center space-x-6 pt-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={config.isSandbox}
                                onChange={(e) => setConfig({ ...config, isSandbox: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm text-gray-700">
                                Modo Prueba (Sandbox)
                                {config.isSandbox && <span className="ml-2 text-xs text-orange-700 font-semibold bg-orange-50 px-2 py-1 rounded">⚠️ NO SE COBRARÁN PAGOS REALES</span>}
                            </span>
                        </label>

                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm font-semibold text-gray-700">Habilitar MercadoPago</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Métodos de Pago */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Métodos de Pago Disponibles</h2>
                <p className="text-sm text-gray-700 mb-4">
                    Selecciona qué opciones de pago estarán disponibles para tus clientes
                </p>

                <div className="space-y-3">
                    {paymentMethods.map((method, idx) => (
                        <div key={method.type} className="border rounded p-4">
                            <div className="flex items-start justify-between">
                                <label className="flex items-start space-x-3 flex-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={method.enabled}
                                        onChange={(e) => {
                                            const updated = [...paymentMethods];
                                            updated[idx].enabled = e.target.checked;
                                            setPaymentMethods(updated);
                                        }}
                                        className="mt-1 rounded"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-800">{method.label}</div>
                                        <div className="text-xs text-gray-600 mt-1">
                                            {method.type === 'cash' && 'El cliente paga cuando retira su pedido en tu local'}
                                            {method.type === 'mercadopago_full' && 'El cliente paga el 100% del pedido online antes de retirarlo'}
                                            {method.type === 'mercadopago_deposit' && 'El cliente paga una seña online y el resto en efectivo cuando retira'}
                                        </div>
                                    </div>
                                </label>

                                {method.type === 'mercadopago_deposit' && method.enabled && (
                                    <div className="ml-4 w-32">
                                        <label className="block text-xs text-gray-700 font-medium mb-1">% Seña</label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="100"
                                            value={method.depositPercentage}
                                            onChange={(e) => {
                                                const updated = [...paymentMethods];
                                                updated[idx].depositPercentage = parseFloat(e.target.value);
                                                setPaymentMethods(updated);
                                            }}
                                            className="w-full border rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-900">
                        <strong className="text-yellow-950">💡 Tip:</strong> Puedes habilitar múltiples métodos. Tus clientes elegirán al finalizar la compra.
                    </p>
                </div>
            </div>

            {/* Información adicional */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3 text-gray-800">ℹ️ Información importante</h3>
                <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                    <li>MercadoPago cobra una comisión por cada transacción</li>
                    <li>Los pagos se acreditan en tu cuenta de MercadoPago</li>
                    <li>Puedes usar el modo Sandbox para probar sin cobros reales</li>
                    <li>Recuerda desactivar Sandbox cuando quieras recibir pagos reales</li>
                </ul>
            </div>

            {/* Botón Guardar */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold disabled:opacity-50 transition"
                >
                    {loading ? 'Guardando...' : 'Guardar Configuración'}
                </button>

                {saved && (
                    <span className="text-green-600 font-medium flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Configuración guardada exitosamente
                    </span>
                )}
            </div>
        </div>
    );
}
