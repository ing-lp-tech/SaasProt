import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { dolarService } from '../services/dolarService';

export default function DolarQuote() {
    const [quotes, setQuotes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchQuote = async () => {
        try {
            const data = await dolarService.getCotizacion();
            if (data && (data.oficial || data.blue)) {
                setQuotes(data);
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
            <div className="py-4 px-4 md:px-8 bg-slate-900 border-y border-slate-800">
                <div className="max-w-7xl mx-auto flex items-center justify-center">
                    <RefreshCw className="animate-spin text-blue-400" size={24} />
                    <span className="ml-2 text-gray-300">Cargando cotización...</span>
                </div>
            </div>
        );
    }

    if (error || !quotes) {
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
        <div className="py-6 px-4 md:px-8 bg-slate-900 border-y border-slate-800">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-6">
                    {/* Dólar Oficial */}
                    {quotes.oficial && (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 pb-4 border-b border-slate-700">
                            <div className="flex items-center gap-2">
                                <DollarSign className="text-green-400" size={28} strokeWidth={2.5} />
                                <h3 className="text-xl font-bold text-gray-100">
                                    Dólar Oficial
                                </h3>
                            </div>

                            <div className="flex gap-8">
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 font-medium mb-1">Compra</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        {formatPrice(quotes.oficial.compra)}
                                    </p>
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-gray-400 font-medium mb-1">Venta</p>
                                    <p className="text-2xl font-bold text-blue-400">
                                        {formatPrice(quotes.oficial.venta)}
                                    </p>
                                </div>
                            </div>

                            {quotes.oficial.fecha && (
                                <div className="text-xs text-gray-400">
                                    {quotes.oficial.isStale && <span className="text-orange-400">⚠️ </span>}
                                    Actualizado: {new Date(quotes.oficial.fecha).toLocaleString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dólar Blue */}
                    {quotes.blue && (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                            <div className="flex items-center gap-2">
                                <DollarSign className="text-blue-400" size={28} strokeWidth={2.5} />
                                <h3 className="text-xl font-bold text-gray-100">
                                    Dólar Blue
                                </h3>
                            </div>

                            <div className="flex gap-8">
                                <div className="text-center">
                                    <p className="text-sm text-gray-400 font-medium mb-1">Compra</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        {formatPrice(quotes.blue.compra)}
                                    </p>
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-gray-400 font-medium mb-1">Venta</p>
                                    <p className="text-2xl font-bold text-blue-400">
                                        {formatPrice(quotes.blue.venta)}
                                    </p>
                                </div>
                            </div>

                            {quotes.blue.fecha && (
                                <div className="text-xs text-gray-400">
                                    {quotes.blue.isStale && <span className="text-orange-400">⚠️ </span>}
                                    Actualizado: {new Date(quotes.blue.fecha).toLocaleString('es-AR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
