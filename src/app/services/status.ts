/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldAuth } from './auth';

export interface IMinemeldStatus {
    NODE_STATES: string[];
    getSystem(): angular.IPromise<any>;
    getMinemeld(): angular.IPromise<any>;
    getConfig(): angular.IPromise<any>;
}

export interface IMinemeldStatusNode {
    name: string;
    length: number;
    class: string;
    inputs: string[];
    output: boolean;
    state: number;
    statistics: {
        [key: string]: number;
    };
}

export class MinemeldStatus implements IMinemeldStatus {
    static $inject = ['$resource', '$state', 'MinemeldAuth'];

    authorizationSet: boolean = false;
    authorizationString: string;

    $resource: angular.resource.IResourceService;
    $state: angular.ui.IStateService;
    MinemeldAuth: IMinemeldAuth;

    NODE_STATES: string[] = [
        'READY',
        'CONNECTED',
        'REBUILDING',
        'RESET',
        'INIT',
        'STARTED',
        'CHECKPOINT',
        'IDLE',
        'STOPPED'
    ];

    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService,
                MinemeldAuth: IMinemeldAuth) {
        console.log('MinemeldStatus');

        this.$resource = $resource;
        this.$state = $state;
        this.MinemeldAuth = MinemeldAuth;
    }

    public getSystem(): angular.IPromise<any> {
        var system: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        system = this.$resource('/status/system', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return system.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        }, (error: any) => {
            if (error.status === 401) {
                this.$state.go('login');
            }

            return error;
        });
    }

    public getMinemeld(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        minemeld = this.$resource('/status/minemeld', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return minemeld.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        }, (error: any) => {
            if (error.status === 401) {
                this.$state.go('login');
            }

            return error;
        });
    }

    public getConfig(): angular.IPromise<any> {
        var config: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        config = this.$resource('/status/config', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return config.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        }, (error: any) => {
            if (error.status === 401) {
                this.$state.go('login');
            }

            return error;
        });
    }
}
