// Servicio para obtener cotización del dólar
// Usa API gratuita dolarapi.com

const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares/oficial';
const CACHE_KEY = 'dolar_quote_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

export const dolarService = {
    // Obtener cotización del dólar
    async getCotizacion() {
        try {
            // Verificar cache primero
            const cached = this.getFromCache();
            if (cached) {
                return cached;
            }

            // Fetch desde API
            const response = await fetch(DOLAR_API_URL);

            if (!response.ok) {
                throw new Error('Error fetching dolar quote');
            }

            const data = await response.json();

            const quote = {
                compra: data.compra,
                venta: data.venta,
                fecha: data.fechaActualizacion,
                timestamp: Date.now()
            };

            // Guardar en cache
            this.saveToCache(quote);

            return quote;
        } catch (error) {
            console.error('Error getting dolar quote:', error);

            // Intentar retornar del cache aunque esté expirado
            const cached = this.getFromCache(true);
            if (cached) {
                return { ...cached, isStale: true };
            }

            // Si no hay cache, retornar null
            return null;
        }
    },

    // Obtener desde cache
    getFromCache(ignoreExpiry = false) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const data = JSON.parse(cached);
            const now = Date.now();

            // Verificar si expiró
            if (!ignoreExpiry && (now - data.timestamp) > CACHE_DURATION) {
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    },

    // Guardar en cache
    saveToCache(quote) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(quote));
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    },

    // Limpiar cache
    clearCache() {
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
};
