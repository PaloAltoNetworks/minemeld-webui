/// <reference path="../../../.tmp/typings/tsd.d.ts" />

export interface IMinemeldStatus {
    NODE_STATES: string[];
    getSystem(): angular.IPromise<any>;
    getMinemeld(): angular.IPromise<any>;
    getConfig(): angular.IPromise<any>;
    setAuthorizationHeaders(headers: any): void;
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
    authorizationString: string;

    system: angular.resource.IResourceClass<angular.resource.IResource<any>>;
    minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;
    config: angular.resource.IResourceClass<angular.resource.IResource<any>>;

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
        console.log('MinemeldStatus');

        this.$resource = $resource;
        this.$state = $state;
    }

    public setAuthorizationHeaders(headers: any) {
        this.system = this.$resource('/status/system', {}, {
            get: {
                method: 'GET',
                headers: headers
            }
        });

        this.minemeld = this.$resource('/status/minemeld', {}, {
            get: {
                method: 'GET',
                headers: headers
            }
        });

        this.config = this.$resource('/status/config', {}, {
            get: {
                method: 'GET',
                headers: headers
            }
        });

        this.authorizationSet = true;
    }

    public getSystem(): angular.IPromise<any> {
        if (!this.system) {
            this.$state.go('login');
            return;
        }

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
        if (!this.minemeld) {
            this.$state.go('login');
            return;
        }

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

    public getConfig(): angular.IPromise<any> {
        if (!this.config) {
            this.$state.go('login');
            return;
        }

        return this.config.get().$promise.then((result: any) => {
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
