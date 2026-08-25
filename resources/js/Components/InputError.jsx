export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p {...props} className={'text-sm text-[var(--destructive)] ' + className}>
            {message}
        </p>
    ) : null;
}
