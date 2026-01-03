

export interface OTTPlugin {
    name: string,
    locationContainer: (container : HTMLElement) => (() => void) | void;
    isWatchPage: (url: string) => boolean;
}

export enum OTTType {
    NETFLIX = 'NETFLIX',
    UNKNOWN = 'UNKNOWN',
}