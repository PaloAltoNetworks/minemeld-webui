/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService, IMineMeldAPIResource } from './minemeldapi';

export interface IMinemeldSupervisorService {
    getStatus(cancellable?: boolean): angular.IPromise<any>;
    startEngine(): angular.IPromise<any>;
    stopEngine(): angular.IPromise<any>;
    restartEngine(): angular.IPromise<any>;
    hupAPI(): angular.IPromise<any>;
}

export class MinemeldSupervisorService implements IMinemeldSupervisorService {
    $state: angular.ui.IStateService;
    MineMeldAPIService: IMineMeldAPIService;

    /** @ngInject */
    constructor($state: angular.ui.IStateService,
                MineMeldAPIService: IMineMeldAPIService) {
        this.$state = $state;
        this.MineMeldAPIService = MineMeldAPIService;
    }

    public getStatus(cancellable?: boolean): angular.IPromise<any> {
        var system: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (typeof cancellable === 'undefined') {
            cancellable = true;
        }

        system = this.MineMeldAPIService.getAPIResource('/supervisor', {}, {
            get: {
                method: 'GET'
            }
        }, cancellable);

        return system.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public startEngine(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        minemeld = this.MineMeldAPIService.getAPIResource('/supervisor/minemeld-engine/start', {}, {
            get: {
                method: 'GET'
            }
        }, false);

        return minemeld.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public stopEngine(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        minemeld = this.MineMeldAPIService.getAPIResource('/supervisor/minemeld-engine/stop', {}, {
            get: {
                method: 'GET'
            }
        }, false);

        return minemeld.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public restartEngine(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        minemeld = this.MineMeldAPIService.getAPIResource('/supervisor/minemeld-engine/restart', {}, {
            get: {
                method: 'GET'
            }
        }, false);

        return minemeld.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public hupAPI(): angular.IPromise<any> {
        var api: IMineMeldAPIResource;

        api = this.MineMeldAPIService.getAPIResource('/supervisor/minemeld-web/hup', {}, {
            get: {
                method: 'GET'
            }
        }, false);

        return api.get().$promise.then((result: any) => {
            if (result.result) {
                return result.result;
            }

            return undefined;
        });
    }
}
