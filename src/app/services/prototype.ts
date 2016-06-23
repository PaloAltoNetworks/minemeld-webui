/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldAuth } from './auth';

export interface IMinemeldPrototypeLibrary {
    description?: string;
    url?: string;
    prototypes?: {
        [key: string]: IMinemeldPrototype;
    };
}

export interface IMinemeldPrototypeMetadata {
    description?: string;
    nodeType?: string;
    developmentStatus?: string;
    author?: string;
}

export interface IMinemeldPrototype extends IMinemeldPrototypeMetadata {
    class: string;
    config?: any;
}

export interface IMinemeldPrototypeLibraryDictionary {
    [key: string]: IMinemeldPrototypeLibrary;
}

export interface IMinemeldPrototypeService {
    getPrototypeLibraries(): angular.IPromise<any>;
    getPrototypeLibrary(library: string): angular.IPromise<any>;
    getPrototype(protofqdn: string): angular.IPromise<any>;
    getPrototypeYaml(prototypename: string): angular.IPromise<any>;
    setPrototypeYaml(prototypename: string, pclass: string, config: string,
                     optionalParams?: IMinemeldPrototypeMetadata): angular.IPromise<any>;
    invalidateCache(): void;
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


    public getPrototypeYaml(prototypename: string) {
        var params: any;
        var prototypeYaml: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        prototypeYaml = this.$resource('/prototype/:prototypename', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        params = {
            prototypename: prototypename
        };

        return prototypeYaml.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return {};
        });
    }

    public setPrototypeYaml(prototypename: string, pclass: string, config: string,
                            optionalParams?: IMinemeldPrototypeMetadata) {
        var prototypeYaml: any;
        var prototype: any;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        prototypeYaml = this.$resource('/prototype/:prototypename', {
            prototypename: prototypename
        }, {
            post: {
                method: 'POST',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        if (optionalParams) {
            prototype = angular.copy(optionalParams);
        } else {
            prototype = {};
        }
        prototype.class = pclass;
        prototype.config = config;

        return prototypeYaml.post({}, JSON.stringify(prototype)).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return {};
        });
    }

    public invalidateCache(): void {
        this.prototypesDict = undefined;
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

                return this.prototypesDict;
            });
    }
}
