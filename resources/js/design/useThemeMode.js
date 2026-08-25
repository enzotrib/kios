import { create } from 'zustand';

const STORAGE_KEY = 'infoshop-theme';

/** Lee la preferencia guardada; si no hay, sigue la del sistema operativo. */
function initialMode() {
    if (typeof window === 'undefined') return 'light';
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
    } catch {
        // localStorage puede fallar en modo incognito o con cookies bloqueadas
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Aplica el modo al <html>. Tiene que correr ANTES de crear el tema de MUI,
 * porque theme.js lee las variables CSS y estas dependen de la clase .dark.
 */
export function applyMode(mode) {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
}

export const useThemeMode = create((set, get) => ({
    mode: initialMode(),

    setMode: (mode) => {
        applyMode(mode);
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        } catch {
            // Si no se puede persistir, el modo igual funciona en esta sesion
        }
        set({ mode });
    },

    toggle: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),
}));
