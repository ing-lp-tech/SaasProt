import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

export default function CheckoutPending() {
    const [searchParams] = useSearchParams();
    const { tenant } = useTenant();

    const orderId = searchParams.get('order_id');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-10 h-10 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Pago Pendiente
                </h1>

                <p className="text-gray-600 mb-6">
                    Tu pago está siendo procesado. Te notificaremos cuando se confirme.
                </p>

                {orderId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">Pedido:</span> #{orderId.substring(0, 8)}
                        </p>
                    </div>
                )}

                <p className="text-sm text-gray-600 mb-6">
                    El pago puede tardar unos minutos en acreditarse. Te contactaremos por WhatsApp cuando esté confirmado.
                </p>

                <Link
                    to={tenant ? `/?tenant=${tenant.subdomain}` : "/"}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                    Volver a la tienda
                </Link>
            </div>
        </div>
    );
}
