

export interface OTTPlugin {
    name: string,
    locationContainer: (container : HTMLElement) => void;
}

export enum OTTType {
    NETFLIX = 'NETFLIX',
    UNKNOWN = 'UNKNOWN',
}