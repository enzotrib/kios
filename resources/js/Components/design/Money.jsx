import { Box } from '@mui/material';
import { useCurrencyFormatter } from '@/lib/currencyFormatter';

/**
 * Importe monetario con los decimales atenuados.
 *
 * Es el detalle de jerarquia que hace legible una grilla de cifras: el ojo
 * engancha la parte entera (que es la que importa) y los centavos quedan como
 * informacion secundaria. Ademas usa cifras tabulares para que los numeros no
 * cambien de ancho al actualizarse y las columnas queden alineadas.
 */
export default function Money({ value, variant = 'h3', dimDecimals = true, sx, ...props }) {
    const formatCurrency = useCurrencyFormatter();
    const formatted = formatCurrency(value ?? 0);

    // Separa los decimales buscando el ultimo separador seguido solo de digitos
    const match = dimDecimals ? formatted.match(/^(.*)([.,]\d+)(\D*)$/) : null;

    return (
        <Box
            component="span"
            sx={{
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                typography: variant,
                ...sx,
            }}
            {...props}
        >
            {match ? (
                <>
                    {match[1]}
                    <Box component="span" sx={{ color: 'text.secondary' }}>
                        {match[2]}
                    </Box>
                    {match[3]}
                </>
            ) : (
                formatted
            )}
        </Box>
    );
}
