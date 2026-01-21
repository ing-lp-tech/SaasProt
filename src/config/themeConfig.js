// Configuración de temas para diferentes tipos de tienda
// Cada tipo tiene colores, fuentes, iconos y estilos únicos

export const STORE_TYPES = {
    mujer: {
        name: 'Moda Mujer',
        colors: {
            primary: '#EC4899',    // Pink-500
            secondary: '#F472B6',  // Pink-400
            accent: '#FDF2F8',     // Pink-50
            dark: '#BE185D'        // Pink-700
        },
        fonts: {
            headings: "'Playfair Display', serif",
            body: "'Lato', sans-serif"
        },
        icons: {
            hero: '👗',
            category: '💄',
            cart: '👜',
            favorites: '💅',
            feature1: '✨',
            feature2: '💐',
            feature3: '👠'
        },
        styles: {
            shapes: 'rounded-3xl',           // Muy redondeado
            buttonStyle: 'soft-shadow',      // Sombras suaves
            cardStyle: 'elegant-border',     // Bordes decorativos
            decorations: 'flowers'           // Patrones florales
        },
        gradient: 'from-pink-100 via-purple-50 to-pink-100'
    },

    hombre: {
        name: 'Moda Hombre',
        colors: {
            primary: '#1E40AF',    // Blue-800
            secondary: '#3B82F6',  // Blue-500
            accent: '#DBEAFE',     // Blue-50
            dark: '#1E3A8A'        // Blue-900
        },
        fonts: {
            headings: "'Oswald', sans-serif",
            body: "'Roboto', sans-serif"
        },
        icons: {
            hero: '👔',
            category: '⌚',
            cart: '🎒',
            favorites: '🏋️',
            feature1: '💼',
            feature2: '🎯',
            feature3: '⚡'
        },
        styles: {
            shapes: 'rounded-lg',            // Rectángulos suaves
            buttonStyle: 'minimal-flat',     // Botones planos
            cardStyle: 'sharp-corners',      // Esquinas definidas
            decorations: 'geometric'         // Líneas rectas
        },
        gradient: 'from-blue-100 via-slate-50 to-blue-100'
    },

    ninos: {
        name: 'Moda Niños',
        colors: {
            primary: '#FBBF24',    // Yellow-400
            secondary: '#FCD34D',  // Yellow-300
            accent: '#FEF3C7',     // Yellow-50
            dark: '#F59E0B'        // Yellow-500
        },
        fonts: {
            headings: "'Fredoka One', cursive",
            body: "'Comic Neue', cursive"
        },
        icons: {
            hero: '🧸',
            category: '🎨',
            cart: '🎈',
            favorites: '⭐',
            feature1: '🌈',
            feature2: '🎪',
            feature3: '🎉'
        },
        styles: {
            shapes: 'rounded-full',          // Muy redondeado
            buttonStyle: 'colorful-3d',      // Botones 3D
            cardStyle: 'fun-wobble',         // Animaciones juguetones
            decorations: 'playful'           // Estrellas, nubes
        },
        gradient: 'from-yellow-100 via-orange-50 to-yellow-100'
    },

    unisex: {
        name: 'Moda Unisex',
        colors: {
            primary: '#8B5CF6',    // Purple-500
            secondary: '#A78BFA',  // Purple-400
            accent: '#F5F3FF',     // Purple-50
            dark: '#7C3AED'        // Purple-600
        },
        fonts: {
            headings: "'Montserrat', sans-serif",
            body: "'Inter', sans-serif"
        },
        icons: {
            hero: '👕',
            category: '🎯',
            cart: '🛍️',
            favorites: '✨',
            feature1: '🎨',
            feature2: '⚡',
            feature3: '🌟'
        },
        styles: {
            shapes: 'rounded-xl',            // Balance
            buttonStyle: 'modern-flat',      // Flat moderno
            cardStyle: 'neutral-clean',      // Simple y limpio
            decorations: 'minimal'           // Clean
        },
        gradient: 'from-purple-100 via-indigo-50 to-purple-100'
    }
};

// Función helper para obtener tema
export const getTheme = (storeType = 'unisex') => {
    return STORE_TYPES[storeType] || STORE_TYPES.unisex;
};

// CSS Classes dinámicas según tipo
export const getThemeClasses = (storeType = 'unisex') => {
    const theme = getTheme(storeType);

    return {
        // Botones
        primaryButton: `${theme.styles.shapes} ${theme.styles.buttonStyle} transition-all duration-300`,
        secondaryButton: `${theme.styles.shapes} border-2 transition-all duration-300`,

        // Cards
        card: `${theme.styles.shapes} ${theme.styles.cardStyle} transition-all duration-300`,

        // Backgrounds
        gradient: `bg-gradient-to-r ${theme.gradient}`,

        // Text
        heading: theme.fonts.headings,
        body: theme.fonts.body
    };
};
