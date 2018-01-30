export function stringify(token: any): string {
    if (typeof token === 'string') {
        return token;
    }
    
    if (token instanceof Array) {
        return '[' + token.map(stringify).join(', ') + ']';
    }
    
    if (token === null) {
        return '' + token;
    }
    
    if (token.name) {
        return `${token.name}`;
    }
    
    const res = token.toString();

    if (res === null) {
        return '' + res;
    }
    
    const newLine = res.indexOf('\n');
    return newLine === -1 ? res : res.substring(0, newLine);
}