import { forwardRef, useEffect, useRef } from 'react';

export default forwardRef(function TextInput({ type = 'text', className = '', isFocused = false, ...props }, ref) {
    const input = ref ? ref : useRef();

    useEffect(() => {
        if (isFocused) {
            input.current.focus();
        }
    }, []);

    return (
        <input
            {...props}
            type={type}
            className={
                'bg-[var(--surface-2)] text-[var(--foreground)] border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)] rounded-xl shadow-none p-3 border' +
                className
            }
            ref={input}
            onFocus={(e) => e.target.select()}
        />
    );
});
