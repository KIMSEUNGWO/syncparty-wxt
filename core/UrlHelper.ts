import {OTTPlugin, OTTType} from "@/types";
import {netflix} from "@/otts/Netflix";

class UrlHelper {

    isNetflix(url:string):boolean {
        return url.startsWith('https://www.netflix.com');
    }

    toOTTType(url:string):OTTType {
        if (this.isNetflix(url)) {
            return OTTType.NETFLIX;
        }

        return OTTType.UNKNOWN;
    }

    toPlugin(url:string): OTTPlugin | null {
        const ottType = this.toOTTType(url);
        if (ottType === OTTType.NETFLIX) {
            return netflix;
        }
        return null;
    }

}

export const urlHelper = new UrlHelper();