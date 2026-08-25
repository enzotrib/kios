import { useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';

/**
 * Tabla del design system.
 *
 * Resuelve dos problemas que tenian todas las grillas de la app:
 *
 * 1. ANCHO. Las columnas se declaraban con `width` fijo, que en el DataGrid
 *    NO se estira: si la suma de los anchos es menor que el contenedor, queda
 *    un hueco vacio a la derecha y la tabla se ve corrida hacia la izquierda.
 *    Aca cada `width` se convierte en `minWidth` + `flex` proporcional, asi
 *    las columnas conservan su tamano relativo pero reparten el sobrante.
 *
 * 2. ALINEACION. Muchas columnas declaraban `headerAlign` sin `align` (o al
 *    reves), y el titulo quedaba desalineado respecto de su contenido. Aca se
 *    espeja: si se define uno solo, el otro lo acompana.
 *
 * Una columna puede quedarse con ancho fijo declarando `flex: 0` (util para
 * la columna de acciones, que no gana nada al estirarse).
 */
export default function DataTable({ columns = [], sx, ...props }) {
    const normalizedColumns = useMemo(
        () =>
            columns.map((col) => {
                const out = { ...col };

                // width -> minWidth + flex proporcional (100px = 1 unidad de peso)
                if (out.flex === undefined && out.width) {
                    out.minWidth = out.minWidth ?? out.width;
                    out.flex = Math.max(1, Math.round(out.width / 100));
                    delete out.width;
                }

                // flex: 0 explicito = la columna se queda fija con su ancho
                if (out.flex === 0) {
                    out.width = out.width ?? out.minWidth;
                    delete out.flex;
                }

                // El titulo acompana la alineacion del contenido
                if (out.headerAlign && !out.align) out.align = out.headerAlign;
                if (out.align && !out.headerAlign) out.headerAlign = out.align;

                return out;
            }),
        [columns]
    );

    return (
        <DataGrid
            columns={normalizedColumns}
            disableRowSelectionOnClick
            sx={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                bgcolor: 'var(--card)',

                '& .MuiDataGrid-columnHeaders': {
                    bgcolor: 'var(--surface-2)',
                    borderBottom: '1px solid var(--border)',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    color: 'var(--muted-foreground)',
                },
                '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid var(--border)',
                },
                '& .MuiDataGrid-row:hover': {
                    bgcolor: 'var(--surface-2)',
                },
                '& .MuiDataGrid-footerContainer': {
                    borderTop: '1px solid var(--border)',
                },
                // Las separaciones verticales entre encabezados sobran cuando
                // las columnas ya estan alineadas con su contenido
                '& .MuiDataGrid-columnSeparator': {
                    color: 'var(--border)',
                },
                '& .MuiDataGrid-overlay': {
                    bgcolor: 'transparent',
                    color: 'var(--muted-foreground)',
                },
                ...sx,
            }}
            {...props}
        />
    );
}
