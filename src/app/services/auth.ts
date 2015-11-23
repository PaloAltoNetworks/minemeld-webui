/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldMetrics } from './metrics';
import { IMinemeldStatus } from './status';
import { IMinemeldPrototypeService } from './prototype';

export interface IMinemeldAuth {
    authorizationSet: boolean;
    setAuthorization(username: string, password: string): void;
    getAuthorizationHeaders(): any;
}

export class MinemeldAuth implements IMinemeldAuth {
    static $inject = ['$cookies', 'MinemeldStatus', 'MinemeldMetrics', 'MinemeldPrototype'];

    authorizationSet: boolean = false;
    authorizationString: string;

    $cookies: angular.cookies.ICookiesService;
    MinemeldStatus: IMinemeldStatus;
    MinemeldMetrics: IMinemeldMetrics;
    MinemeldPrototype: IMinemeldPrototypeService;

    constructor($cookies: angular.cookies.ICookiesService,
                MinemeldStatus: IMinemeldStatus,
                MinemeldMetrics: IMinemeldMetrics,
                MinemeldPrototype: IMinemeldPrototypeService) {
        this.$cookies = $cookies;
        this.MinemeldMetrics = MinemeldMetrics;
        this.MinemeldStatus = MinemeldStatus;
        this.MinemeldPrototype = MinemeldPrototype;

        this.authorizationString = $cookies.get('mmar');
        if (this.authorizationString) {
            this.authorizationSet = true;

            this.MinemeldStatus.setAuthorizationHeaders(
                this.getAuthorizationHeaders()
            );
            this.MinemeldMetrics.setAuthorizationHeaders(
                this.getAuthorizationHeaders()
            );
            this.MinemeldPrototype.setAuthorizationHeaders(
                this.getAuthorizationHeaders()
            );
        }
    }

    setAuthorization(username: string, password: string) {
        this.authorizationString = btoa(username + ':' + password);
        this.$cookies.put('mmar', this.authorizationString);
        this.authorizationSet = true;

        this.MinemeldStatus.setAuthorizationHeaders(
            this.getAuthorizationHeaders()
        );
        this.MinemeldMetrics.setAuthorizationHeaders(
            this.getAuthorizationHeaders()
        );
        this.MinemeldPrototype.setAuthorizationHeaders(
            this.getAuthorizationHeaders()
        );
    }

    getAuthorizationHeaders() {
        return {
            'Authorization': 'Basic ' + this.authorizationString
        };
    }
}
