export interface Humanized {
    displayName: string;
}

export function humanize<T extends {[key: string]: any}>(obj: T, getName: (o: T) => string): (T & Humanized) {
    obj.displayName = getName(obj)
        .replace(/(?=[A-Z])/g, (x, v) => {
            return ' ';
        })
        .replace('_', ' ');

    obj.displayName = obj.displayName.charAt(0).toUpperCase() + obj.displayName.slice(1);

    return obj as (T & Humanized);
}
