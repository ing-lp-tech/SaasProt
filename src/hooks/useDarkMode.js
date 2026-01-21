import { useState, useEffect } from 'react';

export const useDarkMode = () => {
    // Detectar preferencia inicial
    const getInitialMode = () => {
        // Primero verificar localStorage
        const savedMode = localStorage.getItem('darkMode');
        if (savedMode !== null) {
            return JSON.parse(savedMode);
        }

        // Si no hay guardado, usar preferencia del sistema
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    const [darkMode, setDarkMode] = useState(getInitialMode);

    // Aplicar clase dark al HTML element
    useEffect(() => {
        const root = document.documentElement;

        if (darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Guardar en localStorage
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    // Escuchar cambios en preferencia del sistema
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            // Solo actualizar si no hay preferencia guardada
            if (localStorage.getItem('darkMode') === null) {
                setDarkMode(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    return { darkMode, toggleDarkMode, setDarkMode };
};
