import { IconButton, Tooltip } from '@mui/material';
import { Sun, Moon } from 'lucide-react';
import { useThemeMode } from '@/design/useThemeMode';
import { t } from '@/i18n';

/** Cambia entre modo claro y oscuro. La preferencia queda guardada por navegador. */
export default function ThemeToggle({ size = 20 }) {
    const mode = useThemeMode((s) => s.mode);
    const toggle = useThemeMode((s) => s.toggle);
    const isDark = mode === 'dark';

    return (
        <Tooltip title={isDark ? t('Light mode') : t('Dark mode')}>
            <IconButton onClick={toggle} color="inherit" aria-label={t('Toggle theme')}>
                {isDark ? <Sun size={size} /> : <Moon size={size} />}
            </IconButton>
        </Tooltip>
    );
}
