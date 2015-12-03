/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldAuth } from './auth';

export interface IMinemeldPrototypeLibrary {
    description?: string;
    url?: string;
    prototypes?: {
        [key: string]: IMinemeldPrototype;
    };
}

export interface IMinemeldPrototype {
    class: string;
    description?: string;
    config?: any;
}

export interface IMinemeldPrototypeLibraryDictionary {
    [key: string]: IMinemeldPrototypeLibrary;
}

export interface IMinemeldPrototypeService {
    getPrototypeLibraries(): angular.IPromise<any>;
    getPrototypeLibrary(library: string): angular.IPromise<any>;
    getPrototype(protofqdn: string): angular.IPromise<any>;
}

export class MinemeldPrototype implements IMinemeldPrototypeService {
    static $inject = ['$resource', '$state', '$q', 'MinemeldAuth'];

    $resource: angular.resource.IResourceService;
    $state: angular.ui.IStateService;
    $q: angular.IQService;
    MinemeldAuth: IMinemeldAuth;

    prototypesDict: IMinemeldPrototypeLibraryDictionary;

    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService,
                $q: angular.IQService,
                MinemeldAuth: IMinemeldAuth) {
        this.$resource = $resource;
        this.$state = $state;
        this.$q = $q;
        this.MinemeldAuth = MinemeldAuth;
    }

    public getPrototypeLibraries(): angular.IPromise<any> {
        var defer: any;

        if (this.prototypesDict) {
            defer = this.$q.defer();
            defer.resolve(this.prototypesDict);
            return defer.promise;
        }

        return this.getPrototypes().then((result: any) => {
            return this.prototypesDict;
        });
    }

    public getPrototypeLibrary(library: string): angular.IPromise<any> {
        var defer: any;

        if (this.prototypesDict) {
            defer = this.$q.defer();
            defer.resolve(this.prototypesDict[library]);
            return defer.promise;
        }

        return this.getPrototypes().then((result: any) => {
            return this.prototypesDict[library];
        });
    }

    public getPrototype(protofqdn: string): angular.IPromise<any> {
        var defer: any;
        var toks: string[];

        toks = protofqdn.split('.');

        if (this.prototypesDict) {
            defer = this.$q.defer();

            if (this.prototypesDict[toks[0]]) {
                defer.resolve(this.prototypesDict[toks[0]][toks[1]]);
            } else {
                defer.resolve(undefined);
            }

            return defer.promise;
        }

        return this.getPrototypes().then((result: any) => {
            if (this.prototypesDict[toks[0]]) {
                return this.prototypesDict[toks[0]][toks[1]];
            }

            return undefined;
        });
    }

    private getPrototypes() {
        var prototypes: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        prototypes = this.$resource('/prototype', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return prototypes.get().$promise
            .then((result: any) => {
                this.prototypesDict = result.result;

                console.log(this.prototypesDict);

                return this.prototypesDict;
            });
    }
}
