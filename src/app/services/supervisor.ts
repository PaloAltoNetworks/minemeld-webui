/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldAuth } from './auth';

export interface IMinemeldSupervisor {
    getStatus(): angular.IPromise<any>;
    startCore(): angular.IPromise<any>;
    stopCore(): angular.IPromise<any>;
    restartCore(): angular.IPromise<any>;
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

    public startCore(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        minemeld = this.$resource('/supervisor/minemeld-core/start', {}, {
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

    public stopCore(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        minemeld = this.$resource('/supervisor/minemeld-core/stop', {}, {
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

    public restartCore(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        minemeld = this.$resource('/supervisor/minemeld-core/restart', {}, {
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
