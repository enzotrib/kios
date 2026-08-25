import { TextField, InputAdornment } from '@mui/material';
import { Search } from 'lucide-react';
import { CONTROL_HEIGHT } from './PageToolbar';
import { t } from '@/i18n';

/**
 * Campo de busqueda del sistema.
 *
 * Usa PLACEHOLDER, no label flotante. El label flotante de MUI se apoya sobre
 * el borde del campo y necesita el "notch" del contorno; cuando el campo tiene
 * fondo propio (como en este design system) queda desprolijo, y peor todavia
 * si se fuerza shrink: true, que lo deja colgado arriba aunque este vacio.
 *
 * Tampoco lleva `required`: un buscador nunca es obligatorio, y ponerlo dibuja
 * un asterisco que confunde ("Buscar *").
 *
 * `onChange` recibe el evento nativo, igual que cualquier input de MUI, para
 * que siga funcionando con los handlers que ya leen e.target.name/value.
 */
export default function SearchField({
    value,
    onChange,
    placeholder,
    onKeyDown,
    autoFocus = false,
    ...props
}) {
    return (
        <TextField
            data-toolbar-grow="true"
            value={value ?? ''}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder ?? t('Search...')}
            autoFocus={autoFocus}
            fullWidth
            onFocus={(event) => event.target.select()}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search size={18} />
                        </InputAdornment>
                    ),
                },
            }}
            sx={{
                '& .MuiOutlinedInput-root': { height: CONTROL_HEIGHT },
                '& .MuiInputAdornment-root': { color: 'text.secondary' },
            }}
            {...props}
        />
    );
}
