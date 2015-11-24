/// <reference path="../../../.tmp/typings/tsd.d.ts" />

export interface IMinemeldAuth {
    authorizationSet: boolean;
    setAuthorization(username: string, password: string): void;
    getAuthorizationHeaders(): any;
    logOut(): void;
}

export class MinemeldAuth implements IMinemeldAuth {
    static $inject = ['$cookies'];

    authorizationSet: boolean = false;
    authorizationString: string;

    $cookies: angular.cookies.ICookiesService;

    constructor($cookies: angular.cookies.ICookiesService) {
        this.$cookies = $cookies;

        this.authorizationString = $cookies.get('mmar');
        if (this.authorizationString) {
            this.authorizationSet = true;
        }
    }

    setAuthorization(username: string, password: string) {
        this.authorizationString = btoa(username + ':' + password);
        this.$cookies.put('mmar', this.authorizationString);
        this.authorizationSet = true;
    }

    getAuthorizationHeaders() {
        return {
            'Authorization': 'Basic ' + this.authorizationString
        };
    }

    logOut() {
        this.$cookies.remove('mmar');
        this.authorizationString = undefined;
        this.authorizationSet = false;
    }
}
