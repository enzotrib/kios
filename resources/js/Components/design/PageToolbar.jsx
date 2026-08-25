import { Box } from '@mui/material';

/**
 * Barra de acciones de una pantalla de listado.
 *
 * Existe para resolver el problema de que cada pagina armaba esta fila a mano
 * con anchos arbitrarios (sm={2} md={3}, sm={8}, sm={3}...). El resultado eran
 * controles de distinta altura, mal alineados, sin ritmo.
 *
 * Reglas que impone:
 *   - Un solo alto de control (CONTROL_HEIGHT) para inputs y botones, para que
 *     los bordes superiores e inferiores coincidan siempre.
 *   - Separacion fija de Space/400 = 16px.
 *   - El buscador es el que se estira; el resto conserva su ancho natural.
 *
 * Uso:
 *   <PageToolbar>
 *     <StatPill label="Saldo" value={0} />
 *     <SearchField value={q} onChange={setQ} />
 *     <Button variant="contained">Agregar</Button>
 *   </PageToolbar>
 */

/** Alto unico de los controles de la barra (Figma: entre button/Small 32 y Large 48) */
export const CONTROL_HEIGHT = 40;

export default function PageToolbar({ children, sx }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 2, // 16px = Space/400
                width: '100%',
                mb: 3,

                // Todo control directo de la barra comparte alto. Asi no importa
                // que un hijo sea un TextField y otro un Button: se alinean.
                '& > *': {
                    minHeight: CONTROL_HEIGHT,
                },
                '& > .MuiButton-root': {
                    height: CONTROL_HEIGHT,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                },
                // El buscador absorbe el espacio sobrante
                '& > [data-toolbar-grow="true"]': {
                    flexGrow: 1,
                    minWidth: { md: 240 },
                },
                ...sx,
            }}
        >
            {children}
        </Box>
    );
}
