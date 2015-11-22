/// <reference path="../../../.tmp/typings/tsd.d.ts" />

export interface IMinemeldStatus {
    NODE_STATES: string[];
    getSystem(): angular.IPromise<any>;
    getMinemeld(): angular.IPromise<any>;
    setAuthorization(username: string, password: string): void;
    authorizationSet: boolean;
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
    static $inject = ['$resource', '$state'];

    authorizationSet: boolean = false;

    system: angular.resource.IResourceClass<angular.resource.IResource<any>>;
    minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;
    $resource: angular.resource.IResourceService;
    $state: angular.ui.IStateService;

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
                $state: angular.ui.IStateService) {
        this.system = $resource('/status/system');
        this.minemeld = $resource('/status/minemeld');
        this.$resource = $resource;
        this.$state = $state;
    }

    public setAuthorization(username: string, password: string) {
        this.system = this.$resource('/status/system', {}, {
            get: {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + window.btoa(username + ':' + password)
                }
            }
        });

        this.minemeld = this.$resource('/status/minemeld', {}, {
            get: {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + window.btoa(username + ':' + password)
                }
            }
        });

        this.authorizationSet = true;
    }

    public getSystem(): angular.IPromise<any> {
        return this.system.get().$promise.then((result: any) => {
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
        return this.minemeld.get().$promise.then((result: any) => {
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
