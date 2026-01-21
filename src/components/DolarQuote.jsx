import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { dolarService } from '../services/dolarService';

export default function DolarQuote() {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchQuote = async () => {
        try {
            const data = await dolarService.getCotizacion();
            if (data) {
                setQuote(data);
                setError(false);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('Error fetching quote:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuote();

        // Actualizar cada 15 minutos
        const interval = setInterval(fetchQuote, 15 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="py-4 px-4 md:px-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
                <div className="max-w-7xl mx-auto flex items-center justify-center">
                    <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Cargando cotización...</span>
                </div>
            </div>
        );
    }

    if (error || !quote) {
        return null; // No mostrar nada si hay error
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(price);
    };

    return (
        <div className="py-6 px-4 md:px-8 bg-gradient-to-r from-green-50 via-blue-50 to-green-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-y border-green-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                    {/* Título */}
                    <div className="flex items-center gap-2">
                        <DollarSign className="text-green-600 dark:text-green-400" size={28} strokeWidth={2.5} />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            Cotización Dólar Oficial (Banco Nación)
                        </h3>
                    </div>

                    {/* Valores */}
                    <div className="flex gap-8">
                        {/* Compra */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Compra</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatPrice(quote.compra)}
                            </p>
                        </div>

                        {/* Venta */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Venta</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {formatPrice(quote.venta)}
                            </p>
                        </div>
                    </div>

                    {/* Última actualización */}
                    {quote.fecha && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {quote.isStale && <span className="text-orange-500">⚠️ </span>}
                            Actualizado: {new Date(quote.fecha).toLocaleString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
