/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldAuth } from './auth';

export interface IMinemeldSupervisor {
    getStatus(): angular.IPromise<any>;
    startEngine(): angular.IPromise<any>;
    stopEngine(): angular.IPromise<any>;
    restartEngine(): angular.IPromise<any>;
}

export class MinemeldSupervisor implements IMinemeldSupervisor {
    static $inject = ['$resource', '$state', 'MinemeldAuth'];

    $resource: angular.resource.IResourceService;
    $state: angular.ui.IStateService;
    MinemeldAuth: IMinemeldAuth;

    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService,
                MinemeldAuth: IMinemeldAuth) {
        this.$resource = $resource;
        this.$state = $state;
        this.MinemeldAuth = MinemeldAuth;
    }

    public getStatus(): angular.IPromise<any> {
        var system: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        system = this.$resource('/supervisor', {}, {
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

    public startEngine(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        minemeld = this.$resource('/supervisor/minemeld-engine/start', {}, {
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

    public stopEngine(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        minemeld = this.$resource('/supervisor/minemeld-engine/stop', {}, {
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

    public restartEngine(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        minemeld = this.$resource('/supervisor/minemeld-engine/restart', {}, {
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
}
