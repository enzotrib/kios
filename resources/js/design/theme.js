import { createTheme } from '@mui/material/styles';
import { esES as dataGridEsES } from '@mui/x-data-grid/locales';
import { esES as coreEsES } from '@mui/material/locale';

/**
 * Tema de MUI construido a partir de los design tokens de resources/css/app.css.
 *
 * La fuente de verdad son las variables CSS: este archivo las LEE, no las
 * redefine. Asi los 107 archivos que usan MUI y los que usan Tailwind/shadcn
 * no pueden divergir — se cambia el token en el CSS y cambian los dos.
 *
 * Importante: createAppTheme() debe llamarse DESPUES de aplicar (o sacar) la
 * clase .dark en <html>, porque getComputedStyle resuelve segun el modo activo.
 */

/** Lee una variable CSS del documento, con fallback por si el CSS todavia no cargo. */
function readToken(name, fallback) {
    if (typeof window === 'undefined' || !document?.documentElement) return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name);
    return value?.trim() || fallback;
}

/** Valores de respaldo: solo se usan si el CSS no esta disponible al montar. */
const FALLBACK = {
    dark: {
        '--background': '#0A0D11', '--foreground': '#EDF0F2', '--card': '#181D25',
        '--surface-2': '#1F2633', '--primary': '#70FC8E', '--primary-foreground': '#0A0D11',
        '--success': '#70FC8E', '--warning': '#FF902E', '--destructive': '#FF6B5C',
        '--border': '#2F3B4C', '--muted-foreground': '#929FB1', '--chart-5': '#F02BA7',
    },
    light: {
        '--background': '#F5F7FA', '--foreground': '#0A0D11', '--card': '#FFFFFF',
        '--surface-2': '#EEF1F5', '--primary': '#0A7A55', '--primary-foreground': '#FFFFFF',
        '--success': '#0A7A55', '--warning': '#B35F00', '--destructive': '#D92D20',
        '--border': '#DCE3EC', '--muted-foreground': '#5A6779', '--chart-5': '#C4238A',
    },
};

export function createAppTheme(mode = 'light') {
    const fb = FALLBACK[mode] ?? FALLBACK.light;
    const token = (name) => readToken(name, fb[name]);

    const background = token('--background');
    const surface = token('--card');
    const surface2 = token('--surface-2');
    const foreground = token('--foreground');
    const mutedForeground = token('--muted-foreground');
    const border = token('--border');
    const primary = token('--primary');

    // Figma: Radius/Card/Inside 24, component/card/Radius 12, component/button/Radius 24
    const radiusCard = 24;
    const radiusControl = 12;
    const radiusButton = 24;

    return createTheme({
        cssVariables: true,

        palette: {
            mode,
            primary: { main: primary, contrastText: token('--primary-foreground') },
            secondary: { main: token('--chart-5') },
            success: { main: token('--success') },
            warning: { main: token('--warning') },
            error: { main: token('--destructive') },
            background: { default: background, paper: surface },
            text: { primary: foreground, secondary: mutedForeground },
            divider: border,
        },

        shape: { borderRadius: radiusControl },

        // NO tocar la base de spacing (8px por defecto). Bajarla a 4 parece mas
        // fino, pero divide a la mitad todos los p/m/gap/spacing que ya existen
        // en las 107 pantallas y rompe cada layout. El ritmo de 4px se expresa
        // con medios pasos (0.5 = 4px, 1 = 8px, 3 = 24px) donde haga falta.

        // Escala tipografica de Rayum Lite. Los tamanos, pesos, interlineados y
        // letter-spacing salen de las variables heading/*, subheading/*, body/*,
        // caption/* y component/button/* del archivo de Figma.
        typography: {
            fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',

            // heading/Size Medium 32 - weight 600 - letterSpacing -1.2
            h1: { fontSize: '2rem', fontWeight: 600, letterSpacing: '-1.2px', lineHeight: 1.1 },
            // heading/Size Small 28
            h2: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-1.2px', lineHeight: 1.15 },
            // subheading/Size Large 24 - weight 500 - letterSpacing -0.8
            h3: { fontSize: '1.5rem', fontWeight: 500, letterSpacing: '-0.8px', lineHeight: 1.2 },
            // subheading/Size Medium 20
            h4: { fontSize: '1.25rem', fontWeight: 500, letterSpacing: '-0.8px', lineHeight: 1.25 },
            // subheading/Size Small 18
            h5: { fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.8px', lineHeight: 1.3 },
            h6: { fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.2px', lineHeight: 1.35 },

            // body/Size Medium 16 - lineHeight 1.4 - letterSpacing -0.2
            body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.4, letterSpacing: '-0.2px' },
            // body/Size Small 14 - lineHeight 1.5
            body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5, letterSpacing: '-0.2px' },

            subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.2px' },
            subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.2px', color: mutedForeground },

            // caption/Size Small 12 - lineHeight 1.3 - letterSpacing 0
            caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.3, color: mutedForeground },

            // component/button/Size Base 16 - weight 600
            button: { fontSize: '1rem', fontWeight: 600, textTransform: 'none', letterSpacing: '-0.2px' },
        },

        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: background,
                        color: foreground,
                        // Evita el salto de layout al abrir modales
                        scrollbarGutter: 'stable',
                    },
                    // Las cifras monetarias no deben cambiar de ancho al variar
                    '.tabular': { fontVariantNumeric: 'tabular-nums' },
                },
            },

            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        borderRadius: radiusCard,
                    },
                    // En oscuro la elevacion se lee por contraste de superficie, no por sombra
                    elevation1: { boxShadow: 'var(--shadow-card)' },
                },
            },

            MuiCard: {
                defaultProps: { elevation: 0 },
                styleOverrides: {
                    root: {
                        backgroundColor: surface,
                        border: `1px solid ${border}`,
                        borderRadius: radiusCard,
                        boxShadow: 'var(--shadow-card)',
                    },
                },
            },

            MuiCardContent: {
                styleOverrides: {
                    root: { padding: 20, '&:last-child': { paddingBottom: 20 } },
                },
            },

            // Jerarquia de acciones de Rayum. Los tres niveles existen para que
            // en una pantalla haya UNA sola accion principal: si todos los
            // botones son `contained`, ninguno destaca.
            //
            //   contained -> action/background/primary   (acento, la accion clave)
            //   outlined  -> action/background/secondary (transparente + borde)
            //   text      -> action/background/tertiary  (transparente, sin borde)
            MuiButton: {
                defaultProps: { disableElevation: true },
                styleOverrides: {
                    root: {
                        // component/button: Radius 24, Padding LG 20, Large 48 / Small 32
                        borderRadius: radiusButton,
                        paddingInline: 20,
                        minHeight: 40,
                    },
                    sizeSmall: { paddingInline: 14, minHeight: 32, fontSize: '0.875rem' },
                    sizeLarge: { minHeight: 48 },

                    outlined: {
                        // action/border/secondary/default (#404B5A en oscuro)
                        borderColor: 'var(--input)',
                        color: 'var(--foreground)',
                        backgroundColor: 'transparent',
                        '&:hover': {
                            borderColor: 'var(--input)',
                            backgroundColor: 'var(--surface-2)',
                        },
                    },

                    text: {
                        color: 'var(--foreground)',
                        '&:hover': { backgroundColor: 'var(--surface-2)' },
                    },
                },
            },

            MuiIconButton: {
                styleOverrides: {
                    root: {
                        borderRadius: radiusControl,
                        '&:hover': { backgroundColor: surface2 },
                    },
                },
            },

            MuiChip: {
                styleOverrides: {
                    root: { borderRadius: 'var(--radius-pill)', fontWeight: 600 },
                    outlined: { borderColor: border },
                },
            },

            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        backgroundColor: surface2,
                        borderRadius: radiusControl,
                        '& fieldset': { borderColor: border },
                        '&:hover fieldset': { borderColor: border },
                        '&.Mui-focused fieldset': { borderColor: primary, borderWidth: 1 },
                    },
                },
            },

            MuiTextField: { defaultProps: { size: 'small' } },

            MuiAppBar: {
                defaultProps: { elevation: 0 },
                styleOverrides: {
                    root: {
                        backgroundColor: background,
                        color: foreground,
                        borderBottom: `1px solid ${border}`,
                        backgroundImage: 'none',
                    },
                },
            },

            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: 'var(--sidebar)',
                        borderRight: `1px solid ${border}`,
                        borderRadius: 0,
                    },
                },
            },

            // Item activo del menu: pastilla con fondo suave, sin el azul de fabrica
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: radiusControl,
                        marginInline: 8,
                        '&.Mui-selected': {
                            backgroundColor: 'var(--primary-soft)',
                            color: primary,
                            '& .MuiListItemIcon-root': { color: primary },
                            '&:hover': { backgroundColor: 'var(--primary-soft)' },
                        },
                    },
                },
            },

            MuiListItemIcon: {
                styleOverrides: { root: { minWidth: 40, color: mutedForeground } },
            },

            MuiTableCell: {
                styleOverrides: {
                    root: { borderBottomColor: border, fontSize: '0.8125rem' },
                    head: {
                        color: mutedForeground,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        backgroundColor: 'transparent',
                    },
                },
            },

            MuiAlert: {
                styleOverrides: {
                    root: { borderRadius: radiusControl, border: `1px solid ${border}` },
                },
            },

            MuiDialog: {
                styleOverrides: { paper: { borderRadius: radiusCard } },
            },

            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        backgroundColor: surface2,
                        color: foreground,
                        border: `1px solid ${border}`,
                        borderRadius: 8,
                        fontSize: '0.75rem',
                    },
                },
            },

            MuiTabs: {
                styleOverrides: {
                    indicator: { height: 3, borderRadius: 3 },
                },
            },

            MuiDivider: { styleOverrides: { root: { borderColor: border } } },
        },
    },
    // Textos internos de MUI y del DataGrid en espanol ("No rows",
    // "Rows per page", filtros, menus de columna). No se traducen con t()
    // porque los genera la libreria, no nuestro codigo.
    dataGridEsES,
    coreEsES,
    );
}
