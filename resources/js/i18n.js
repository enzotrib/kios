import es from './lang/es.json';

const dictionaries = { es };

// Idioma activo. Se setea desde app.jsx con el locale que comparte Laravel.
let locale = 'en';

export function setLocale(newLocale) {
    locale = newLocale || 'en';
}

export function getLocale() {
    return locale;
}

/**
 * Traduce un texto. La clave ES el texto en ingles, asi que cualquier string
 * que todavia no este en el diccionario se muestra en ingles en lugar de romper.
 *
 *   t('Start Date')                       -> 'Fecha de inicio'
 *   t('Showing :count items', {count: 5}) -> 'Mostrando 5 items'
 */
export function t(key, replacements) {
    let text = dictionaries[locale]?.[key] ?? key;

    if (replacements) {
        for (const [name, value] of Object.entries(replacements)) {
            text = text.split(`:${name}`).join(value);
        }
    }

    return text;
}

export default t;
