import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';

export default function CheckoutSuccess() {
    const [searchParams] = useSearchParams();
    const { tenant } = useTenant();
    const [orderInfo, setOrderInfo] = useState(null);

    const orderId = searchParams.get('order_id');
    const paymentId = searchParams.get('payment_id');
    const status = searchParams.get('status');

    useEffect(() => {
        // Aquí podrías consultar la info de la orden si es necesario
        console.log('Payment successful:', { orderId, paymentId, status });
    }, [orderId, paymentId, status]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-10 h-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Pago Exitoso!
                </h1>

                <p className="text-gray-600 mb-6">
                    Tu pago ha sido procesado correctamente.
                </p>

                {orderId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">Pedido:</span> #{orderId.substring(0, 8)}
                        </p>
                        {paymentId && (
                            <p className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">ID Pago:</span> {paymentId}
                            </p>
                        )}
                    </div>
                )}

                <p className="text-sm text-gray-600 mb-6">
                    Te contactaremos pronto por WhatsApp para coordinar la entrega de tu pedido.
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
