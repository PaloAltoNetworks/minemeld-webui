/// <reference path="../../../.tmp/typings/tsd.d.ts" />

export interface IMinemeldStatus {
    getSystem(): angular.IPromise<any>;
    getMinemeld(): angular.IPromise<any>;
}

export class MinemeldStatus implements IMinemeldStatus {
    static $inject = ['$resource'];

    system: angular.resource.IResourceClass<angular.resource.IResource<any>>;
    minemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

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
