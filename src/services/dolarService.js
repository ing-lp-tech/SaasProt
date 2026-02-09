// Servicio para obtener cotización del dólar
// Usa API gratuita dolarapi.com

const DOLAR_OFICIAL_URL = 'https://dolarapi.com/v1/dolares/oficial';
const DOLAR_BLUE_URL = 'https://dolarapi.com/v1/dolares/blue';
const CACHE_KEY_OFICIAL = 'dolar_oficial_cache';
const CACHE_KEY_BLUE = 'dolar_blue_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

export const dolarService = {
    // Obtener cotización del dólar oficial y blue
    async getCotizacion() {
        try {
            const [oficial, blue] = await Promise.all([
                this.getOficial(),
                this.getBlue()
            ]);

            return {
                oficial,
                blue
            };
        } catch (error) {
            console.error('Error getting dolar quotes:', error);
            return {
                oficial: null,
                blue: null
            };
        }
    },

    // Obtener dólar oficial
    async getOficial() {
        return this.fetchQuote(DOLAR_OFICIAL_URL, CACHE_KEY_OFICIAL);
    },

    // Obtener dólar blue
    async getBlue() {
        return this.fetchQuote(DOLAR_BLUE_URL, CACHE_KEY_BLUE);
    },

    // Método genérico para fetch
    async fetchQuote(url, cacheKey) {
        try {
            // Verificar cache primero
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }

            // Fetch desde API
            const response = await fetch(url);

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
            this.saveToCache(cacheKey, quote);

            return quote;
        } catch (error) {
            console.error('Error getting quote:', error);

            // Intentar retornar del cache aunque esté expirado
            const cached = this.getFromCache(cacheKey, true);
            if (cached) {
                return { ...cached, isStale: true };
            }

            // Si no hay cache, retornar null
            return null;
        }
    },

    // Obtener desde cache
    getFromCache(cacheKey, ignoreExpiry = false) {
        try {
            const cached = localStorage.getItem(cacheKey);
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
    saveToCache(cacheKey, quote) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(quote));
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    },

    // Limpiar cache
    clearCache() {
        try {
            localStorage.removeItem(CACHE_KEY_OFICIAL);
            localStorage.removeItem(CACHE_KEY_BLUE);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
};
