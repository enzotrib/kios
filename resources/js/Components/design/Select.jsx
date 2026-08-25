import { Autocomplete, TextField, createFilterOptions } from '@mui/material';
import { CONTROL_HEIGHT } from './PageToolbar';
import { t } from '@/i18n';

/**
 * Selector con busqueda del design system.
 *
 * Por FUERA mantiene la API de react-select (options, value, onChange(option),
 * placeholder, isClearable...). Por DENTRO usa MUI Autocomplete.
 *
 * El motivo: el proyecto tenia TRES widgets de seleccion conviviendo — MUI
 * TextField select para listas fijas (33 archivos), MUI Autocomplete (7) y
 * react-select (10). Los dos ultimos hacen exactamente lo mismo, pero
 * react-select no hereda el ThemeProvider y quedaba con otro alto, otro radio
 * y el foco azul de fabrica.
 *
 * Mantener la firma de react-select permite migrar las 10 pantallas sin tocar
 * su codigo: cambia el import y nada mas.
 *
 * Para listas cortas y fijas seguí usando <TextField select>: no necesitan
 * buscador y el desplegable simple es mas rapido de operar.
 */

/** react-select entrega la opcion elegida; Autocomplete entrega (evento, valor). */
function toReactSelectOnChange(onChange) {
    return (_event, newValue) => onChange?.(newValue ?? null);
}

const defaultGetOptionLabel = (option) =>
    typeof option === 'string' ? option : (option?.label ?? '');

function baseProps({
    options = [],
    value,
    onChange,
    placeholder,
    getOptionLabel,
    isClearable = false,
    isDisabled = false,
    isLoading = false,
    name,
    inputValue,
    onInputChange,
    className,
    autoFocus,
}) {
    return {
        options,
        // Autocomplete distingue null de undefined: con undefined pasa a
        // no-controlado y tira un warning al cambiar de valor.
        value: value ?? null,
        onChange: toReactSelectOnChange(onChange),
        getOptionLabel: getOptionLabel ?? defaultGetOptionLabel,
        isOptionEqualToValue: (option, val) =>
            (option?.value ?? option) === (val?.value ?? val),
        disableClearable: !isClearable,
        disabled: isDisabled,
        loading: isLoading,
        className,
        size: 'small',
        noOptionsText: t('No data available'),
        ...(inputValue !== undefined ? { inputValue } : {}),
        ...(onInputChange
            ? { onInputChange: (_e, val, reason) => onInputChange(val, { action: reason }) }
            : {}),
        renderInput: (params) => (
            <TextField
                {...params}
                name={name}
                placeholder={placeholder}
                autoFocus={autoFocus}
            />
        ),
        sx: {
            '& .MuiOutlinedInput-root': {
                minHeight: CONTROL_HEIGHT,
                paddingTop: '2px',
                paddingBottom: '2px',
            },
        },
    };
}

export default function Select(props) {
    // `styles` era la API de react-select: ya no aplica, el estilo sale del tema
    const { styles, ...rest } = props;
    return <Autocomplete {...baseProps(rest)} />;
}

const filter = createFilterOptions();

/**
 * Variante que permite escribir un valor que no esta en la lista.
 * Equivale al `react-select/creatable`.
 */
export function CreatableSelect(props) {
    const { styles, options = [], ...rest } = props;

    return (
        <Autocomplete
            {...baseProps({ ...rest, options })}
            freeSolo
            selectOnFocus
            handleHomeEndKeys
            filterOptions={(opts, params) => {
                const filtered = filter(opts, params);
                const input = params.inputValue.trim();
                const yaExiste = opts.some(
                    (o) => defaultGetOptionLabel(o).toLowerCase() === input.toLowerCase()
                );

                if (input && !yaExiste) {
                    filtered.push({ value: input, label: input, __nuevo: true });
                }
                return filtered;
            }}
            renderOption={(optionProps, option) => (
                <li {...optionProps} key={option.value ?? option}>
                    {option.__nuevo
                        ? `${t('Add')} "${option.label}"`
                        : defaultGetOptionLabel(option)}
                </li>
            )}
        />
    );
}
