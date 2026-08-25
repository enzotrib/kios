export default function PrimaryButton({ className = '', disabled, children, ...props }) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center px-4 py-2 bg-[var(--primary)] border border-transparent rounded-full font-semibold text-xs text-[var(--primary-foreground)] uppercase tracking-widest hover:opacity-90 focus:opacity-90 active:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 transition ease-in-out duration-150 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
