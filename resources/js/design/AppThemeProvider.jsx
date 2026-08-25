import { useMemo, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './theme';
import { useThemeMode, applyMode } from './useThemeMode';

/**
 * Unico punto donde se instala el design system.
 *
 * Envuelve toda la app: al cambiar `mode` se aplica la clase .dark en <html>
 * (lo que reescribe las variables CSS que consumen Tailwind y shadcn) y se
 * reconstruye el tema de MUI leyendo esas mismas variables ya actualizadas.
 */
export default function AppThemeProvider({ children }) {
    const mode = useThemeMode((s) => s.mode);

    // Se aplica en el render, no en un efecto: el tema de abajo necesita que la
    // clase .dark ya este puesta para que getComputedStyle devuelva los valores
    // del modo correcto y no los del anterior.
    applyMode(mode);

    const theme = useMemo(() => createAppTheme(mode), [mode]);

    // Si el usuario nunca eligio modo, seguimos los cambios del sistema operativo
    useEffect(() => {
        const media = window.matchMedia?.('(prefers-color-scheme: dark)');
        if (!media) return;

        const onChange = (e) => {
            try {
                if (localStorage.getItem('infoshop-theme')) return; // eligio a mano: no lo pisamos
            } catch {
                return;
            }
            useThemeMode.setState({ mode: e.matches ? 'dark' : 'light' });
        };

        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}
