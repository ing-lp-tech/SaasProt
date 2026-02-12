import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

export default function CheckoutFailure() {
    const [searchParams] = useSearchParams();
    const { tenant } = useTenant();

    const orderId = searchParams.get('order_id');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-10 h-10 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Pago Cancelado
                </h1>

                <p className="text-gray-600 mb-6">
                    El pago no pudo ser procesado o fue cancelado.
                </p>

                {orderId && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">Pedido:</span> #{orderId.substring(0, 8)}
                        </p>
                    </div>
                )}

                <p className="text-sm text-gray-600 mb-6">
                    Puedes intentarlo nuevamente o elegir otro método de pago.
                </p>

                <div className="flex flex-col space-y-3">
                    <Link
                        to="/cart"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
                    >
                        Volver al carrito
                    </Link>

                    <Link
                        to={tenant ? `/?tenant=${tenant.subdomain}` : "/"}
                        className="inline-block text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Continuar comprando
                    </Link>
                </div>
            </div>
        </div>
    );
}
