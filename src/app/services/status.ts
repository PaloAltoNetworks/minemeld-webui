/// <reference path="../../../.tmp/typings/tsd.d.ts" />

export interface IMinemeldStatus {
    NODE_STATES: string[];
    getSystem(): angular.IPromise<any>;
    getMinemeld(): angular.IPromise<any>;
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
    static $inject = ['$resource'];

    system: angular.resource.IResourceClass<angular.resource.IResource<any>>;
    minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

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

    constructor($resource: angular.resource.IResourceService) {
        this.system = $resource('/status/system');
        this.minemeld = $resource('/status/minemeld');
    }

    public getSystem(): angular.IPromise<any> {
        return this.system.get().$promise.then(function(result: any) {
            console.log(result);

            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    public getMinemeld(): angular.IPromise<any> {
        return this.minemeld.get().$promise.then(function(result: any) {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }
}
