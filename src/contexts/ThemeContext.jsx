import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, STORE_TYPES } from '../config/themeConfig';
import { useTenant } from './TenantContext';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const { tenant } = useTenant();
    const [storeType, setStoreType] = useState('unisex');
    const [customColors, setCustomColors] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar configuración de tema desde TenantContext
    useEffect(() => {
        if (!tenant || !tenant.config) return;

        const config = tenant.config;

        if (config.store_type) {
            setStoreType(config.store_type);
        }

        // Colores personalizados opcionales
        // Support snake_case (DB) and camelCase (Legacy)
        const primary = config.theme_primary_color || config.themePrimaryColor;
        const secondary = config.theme_secondary_color || config.themeSecondaryColor;
        const accent = config.theme_accent_color || config.themeAccentColor;

        if (primary || secondary || accent) {
            setCustomColors({
                primary,
                secondary,
                accent
            });
        }

        setLoading(false);
    }, [tenant]);

    const theme = getTheme(storeType);

    // Merge custom colors if provided
    const activeTheme = customColors ? {
        ...theme,
        colors: {
            ...theme.colors,
            ...(customColors.primary && { primary: customColors.primary }),
            ...(customColors.secondary && { secondary: customColors.secondary }),
            ...(customColors.accent && { accent: customColors.accent })
        }
    } : theme;

    // Inyectar CSS variables en el DOM
    useEffect(() => {
        if (!activeTheme) return;

        const root = document.documentElement;

        // Colores
        root.style.setProperty('--color-primary', activeTheme.colors.primary);
        root.style.setProperty('--color-secondary', activeTheme.colors.secondary);
        root.style.setProperty('--color-accent', activeTheme.colors.accent);
        root.style.setProperty('--color-dark', activeTheme.colors.dark);

        // Fuentes
        root.style.setProperty('--font-heading', activeTheme.fonts.headings);
        root.style.setProperty('--font-body', activeTheme.fonts.body);

        // Cargar fuentes de Google Fonts
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(activeTheme.fonts.headings.replace(/'/g, ''))}&family=${encodeURIComponent(activeTheme.fonts.body.replace(/'/g, ''))}&display=swap`;
        link.rel = 'stylesheet';

        // Solo agregar si no existe
        if (!document.querySelector(`link[href="${link.href}"]`)) {
            document.head.appendChild(link);
        }

        return () => {
            // Cleanup no necesario ya que las variables persisten
        };
    }, [activeTheme]);

    const value = {
        storeType,
        theme: activeTheme,
        setStoreType,
        customColors,
        setCustomColors,
        loading,
        availableTypes: Object.keys(STORE_TYPES)
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
