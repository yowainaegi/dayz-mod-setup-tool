export function setItem(key: string, value: any) {
    return window.localStorage.setItem(key, JSON.stringify(value));
}

export function getItem(key: string) {
    const value = window.localStorage.getItem(key);
    if(value) {
        return JSON.parse(value);
    } else {
        return value;
    }
}

export function clear() {
    window.localStorage.clear();
}