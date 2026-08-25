import ReactSelect from 'react-select';
import ReactCreatable from 'react-select/creatable';
import { CONTROL_HEIGHT } from './PageToolbar';

/**
 * react-select con los tokens del design system.
 *
 * react-select no es MUI: trae su propio sistema de estilos y NO hereda el
 * ThemeProvider. Por eso en 11 pantallas aparecia un control blanco, con otro
 * alto, otro radio y el anillo de foco azul de fabrica, al lado de inputs que
 * ya seguian el sistema.
 *
 * Es un reemplazo directo: mismos props que react-select. Si una pantalla pasa
 * su propio `styles`, se fusiona encima del base.
 */

const baseStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: CONTROL_HEIGHT,
        height: CONTROL_HEIGHT,
        backgroundColor: 'var(--surface-2)',
        borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: state.isFocused
            ? '0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent)'
            : 'none',
        '&:hover': { borderColor: state.isFocused ? 'var(--primary)' : 'var(--border)' },
        fontSize: '0.875rem',
    }),

    valueContainer: (base) => ({ ...base, padding: '0 12px' }),
    input: (base) => ({ ...base, color: 'var(--foreground)', margin: 0, padding: 0 }),
    singleValue: (base) => ({ ...base, color: 'var(--foreground)' }),
    placeholder: (base) => ({ ...base, color: 'var(--muted-foreground)' }),

    indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--border)' }),
    dropdownIndicator: (base) => ({
        ...base,
        color: 'var(--muted-foreground)',
        padding: '0 8px',
        '&:hover': { color: 'var(--foreground)' },
    }),
    clearIndicator: (base) => ({ ...base, color: 'var(--muted-foreground)', padding: '0 4px' }),

    menu: (base) => ({
        ...base,
        backgroundColor: 'var(--popover)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-raised)',
        overflow: 'hidden',
        zIndex: 1300, // por encima de los dialogos de MUI
    }),
    menuPortal: (base) => ({ ...base, zIndex: 1300 }),

    option: (base, state) => ({
        ...base,
        fontSize: '0.875rem',
        backgroundColor: state.isSelected
            ? 'var(--primary-soft)'
            : state.isFocused
              ? 'var(--surface-2)'
              : 'transparent',
        color: state.isSelected ? 'var(--primary)' : 'var(--foreground)',
        fontWeight: state.isSelected ? 600 : 400,
        cursor: 'pointer',
        '&:active': { backgroundColor: 'var(--primary-soft)' },
    }),

    noOptionsMessage: (base) => ({ ...base, color: 'var(--muted-foreground)', fontSize: '0.875rem' }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: 'var(--primary-soft)',
        borderRadius: 'var(--radius-pill)',
    }),
    multiValueLabel: (base) => ({ ...base, color: 'var(--primary)', fontWeight: 500 }),
    multiValueRemove: (base) => ({
        ...base,
        color: 'var(--primary)',
        borderRadius: 'var(--radius-pill)',
        '&:hover': { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' },
    }),
};

/** Fusiona los estilos de la pantalla encima de los del sistema. */
function mergeStyles(custom) {
    if (!custom) return baseStyles;

    const merged = { ...baseStyles };
    for (const [key, fn] of Object.entries(custom)) {
        const base = baseStyles[key];
        merged[key] = base ? (b, s) => fn(base(b, s), s) : fn;
    }
    return merged;
}

export default function Select({ styles, ...props }) {
    return <ReactSelect styles={mergeStyles(styles)} {...props} />;
}

export function CreatableSelect({ styles, ...props }) {
    return <ReactCreatable styles={mergeStyles(styles)} {...props} />;
}
