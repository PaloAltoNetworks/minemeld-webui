/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService } from './minemeldapi';

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
    node_type?: string;  // XXX this should disappear
    indicatorTypes?: string[];
    tags?: string[];
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
    getPrototypeLibraries(cancellable?: boolean): angular.IPromise<any>;
    getPrototypeLibrary(library: string): angular.IPromise<any>;
    getPrototype(protofqdn: string): angular.IPromise<any>;
    getPrototypeYaml(prototypename: string): angular.IPromise<any>;
    setPrototypeYaml(prototypename: string, pclass: string, config: string,
                     optionalParams?: IMinemeldPrototypeMetadata): angular.IPromise<any>;
    deletePrototype(prototypename: string): angular.IPromise<any>;
    invalidateCache(): void;
}

export class MinemeldPrototypeService implements IMinemeldPrototypeService {
    $state: angular.ui.IStateService;
    $q: angular.IQService;
    MineMeldAPIService: IMineMeldAPIService;

    prototypesDict: IMinemeldPrototypeLibraryDictionary;

    /** @ngInject */
    constructor($state: angular.ui.IStateService,
                $q: angular.IQService,
                MineMeldAPIService: IMineMeldAPIService) {
        this.$state = $state;
        this.$q = $q;
        this.MineMeldAPIService = MineMeldAPIService;

        this.MineMeldAPIService.onLogin(this.fillCache.bind(this));
        if (this.MineMeldAPIService.isLoggedIn()) {
            this.fillCache();
        }
        this.MineMeldAPIService.onLogout(this.emptyCache.bind(this));
    }

    public getPrototypeLibraries(cancellable?: boolean): angular.IPromise<any> {
        var defer: any;

        if (typeof cancellable === 'undefined') {
            cancellable = true;
        }

        if (this.prototypesDict) {
            defer = this.$q.defer();
            defer.resolve(this.prototypesDict);
            return defer.promise;
        }

        return this.getPrototypes(cancellable).then((result: any) => {
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
                if (this.prototypesDict[toks[0]].prototypes[toks[1]]) {
                    defer.resolve(this.prototypesDict[toks[0]].prototypes[toks[1]]);
                } else {
                    defer.resolve(undefined);
                }
            } else {
                defer.resolve(undefined);
            }

            return defer.promise;
        }

        return this.getPrototypes().then((result: any) => {
            if (this.prototypesDict[toks[0]]) {
                if (this.prototypesDict[toks[0]].prototypes[toks[1]]) {
                    defer.resolve(this.prototypesDict[toks[0]].prototypes[toks[1]]);
                } else {
                    defer.resolve(undefined);
                }
            } else {
                defer.resolve(undefined);
            }

            return undefined;
        });
    }


    public getPrototypeYaml(prototypename: string) {
        var params: any;
        var prototypeYaml: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        prototypeYaml = this.MineMeldAPIService.getAPIResource('/prototype/:prototypename', {}, {
            get: {
                method: 'GET'
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

        prototypeYaml = this.MineMeldAPIService.getAPIResource('/prototype/:prototypename', {
            prototypename: prototypename
        }, {
            post: {
                method: 'POST'
            }
        }, false);

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

    public deletePrototype(prototypename: string): angular.IPromise<any> {
        var apiResource: any;

        apiResource = this.MineMeldAPIService.getAPIResource('/prototype/:prototypename', {
            prototypename: prototypename
        }, {
            delete: {
                method: 'DELETE'
            }
        }, false);

        return apiResource.delete({}).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return {};
        });
    }

    public invalidateCache(): void {
        this.prototypesDict = undefined;
    }

    private getPrototypes(cancellable?: boolean) {
        var prototypes: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (typeof cancellable === 'undefined') {
            cancellable = true;
        }

        prototypes = this.MineMeldAPIService.getAPIResource('/prototype', {}, {
            get: {
                method: 'GET'
            }
        }, cancellable);

        return prototypes.get().$promise
            .then((result: any) => {
                this.prototypesDict = result.result;

                return this.prototypesDict;
            });
    }

    private fillCache() {
        this.getPrototypes(false);
    }

    private emptyCache() {
        this.prototypesDict = undefined;
    }
}
