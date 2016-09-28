/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService } from './minemeldapi';

export interface IMinemeldStatusService {
    NODE_STATES: string[];
    getSystem(): angular.IPromise<any>;
    getMinemeld(): angular.IPromise<any>;
    getConfig(): angular.IPromise<any>;
    hup(nodename: string): angular.IPromise<any>;
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

export class MinemeldStatusService implements IMinemeldStatusService {
    authorizationSet: boolean = false;
    authorizationString: string;

    $state: angular.ui.IStateService;
    MineMeldAPIService: IMineMeldAPIService;

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

    /** @ngInject */
    constructor($state: angular.ui.IStateService,
                MineMeldAPIService: IMineMeldAPIService) {
        this.$state = $state;
        this.MineMeldAPIService = MineMeldAPIService;
    }

    public getSystem(): angular.IPromise<any> {
        var system: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        system = this.MineMeldAPIService.getAPIResource('/status/system', {}, {
            get: {
                method: 'GET'
            }
        });

        return system.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public getMinemeld(): angular.IPromise<any> {
        var minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        minemeld = this.MineMeldAPIService.getAPIResource('/status/minemeld', {}, {
            get: {
                method: 'GET'
            }
        });

        return minemeld.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public getConfig(): angular.IPromise<any> {
        var config: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        config = this.MineMeldAPIService.getAPIResource('/status/config', {}, {
            get: {
                method: 'GET'
            }
        });

        return config.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public hup(nodename: string) {
        var hupresult: angular.resource.IResourceClass<angular.resource.IResource<any>>;
        var params: any = {
            nodename: nodename
        };

        hupresult = this.MineMeldAPIService.getAPIResource('/status/:nodename/hup', {}, {
            get: {
                method: 'GET'
            }
        }, false);

        return hupresult.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }
}
