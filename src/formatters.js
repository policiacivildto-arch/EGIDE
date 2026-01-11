export const normalizeName = (name) => !name ? '' : name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const formatMatricula = (matricula) => !matricula ? '' : matricula.toUpperCase().replace(/[^0-9X]/g, '').substring(0, 8);

export const displayMatricula = (matricula) => !matricula ? '' : matricula.padStart(8, '0').replace(/(\d{3})(\d{3})(\d{1})(\d{1})/, '$1.$2-$3-$4');

export const formatPlaca = (value) => {
    let v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 3) v = v.slice(0, 3) + '-' + v.slice(3);
    return v.slice(0, 8);
};

export const formatTelefone = (value) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, '').substring(0, 11);
    if (digits.length > 10) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (digits.length > 6) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (digits.length > 2) {
        return digits.replace(/(\d{2})(\d+)/, '($1) $2');
    } else {
        return digits.replace(/(\d*)/, '($1');
    }
};

export const formatProcedimento = (value) => value.toUpperCase().replace(/[^0-9/]/g, '').replace(/^(\d{3})/, '$1-').substring(0, 12);