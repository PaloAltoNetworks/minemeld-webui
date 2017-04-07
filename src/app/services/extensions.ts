/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService, IMineMeldAPIResource } from './minemeldapi';

export interface IMineMeldExtension {
    name: string;
    version: string;
    author: string;
    author_email: string;
    description: string;
    installed: boolean;
    activated: boolean;
    path: string;
    running_job: string;
    entry_points?: {[epgroup: string]: any};
}

export interface IMineMeldExtensionsService {
    list(cancellable?: boolean): angular.IPromise<IMineMeldExtension[]>;
    activate(name: string, version: string, path: string): angular.IPromise<any>;
    deactivate(name: string, version: string, path: string): angular.IPromise<any>;
    uninstall(name: string, version: string, path: string): angular.IPromise<any>;
    gitRefs(endpoint: string): angular.IPromise<string[]>;
    gitInstall(endpoint: string, ref: string): angular.IPromise<string>;
}

interface IMineMeldExtensionsResource extends IMineMeldAPIResource {
    put(params: any, nodeconfig: any);
    del(params: any);
    post(params: any, postdata: any);
}

export class MineMeldExtensionsService implements IMineMeldExtensionsService {
    MineMeldAPIService: IMineMeldAPIService;

    /* @ngInject */
    constructor($state: angular.ui.IStateService,
                MineMeldAPIService: IMineMeldAPIService) {
        this.MineMeldAPIService = MineMeldAPIService;
    }

    list(cancellable?: boolean): angular.IPromise<IMineMeldExtension[]> {
        var api: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (typeof cancellable === 'undefined') {
            cancellable = true;
        }

        api = this.MineMeldAPIService.getAPIResource(
            '/extensions', {},
            {
                get: {
                    method: 'GET'
                }
            },
            cancellable
        );

        return api.get().$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return new Array();
        });
    }

    activate(name: string, version: string, path: string): angular.IPromise<any> {
        var api: IMineMeldExtensionsResource;
        var params: any = {
            extension: name
        };
        var data: any = {
            version: version,
            path: path
        };

        api = <IMineMeldExtensionsResource>this.MineMeldAPIService.getAPIResource(
            '/extensions/:extension/activate', {},
            {
                post: {
                    method: 'POST'
                }
            },
            false
        );

        return api.post(params, JSON.stringify(data)).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return undefined;
        });
    }

    deactivate(name: string, version: string, path: string): angular.IPromise<any> {
        var api: IMineMeldExtensionsResource;
        var params: any = {
            extension: name
        };
        var data: any = {
            version: version,
            path: path
        };

        api = <IMineMeldExtensionsResource>this.MineMeldAPIService.getAPIResource(
            '/extensions/:extension/deactivate', {},
            {
                post: {
                    method: 'POST'
                }
            },
            false
        );

        return api.post(params, JSON.stringify(data)).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return undefined;
        });
    }

    uninstall(name: string, version: string, path: string): angular.IPromise<any> {
        var api: IMineMeldExtensionsResource;
        var params: any = {
            extension: name
        };
        var data: any = {
            version: version,
            path: path
        };

        api = <IMineMeldExtensionsResource>this.MineMeldAPIService.getAPIResource(
            '/extensions/:extension/uninstall', {},
            {
                post: {
                    method: 'POST'
                }
            },
            false
        );

        return api.post(params, JSON.stringify(data)).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return undefined;
        });
    }

    gitInstall(endpoint: string, ref: string): angular.IPromise<any> {
        var api: IMineMeldExtensionsResource;
        var data: any = {
            ep: endpoint,
            ref: ref
        };

        api = <IMineMeldExtensionsResource>this.MineMeldAPIService.getAPIResource(
            '/extensions/git-install', {},
            {
                post: {
                    method: 'POST'
                }
            },
            false
        );

        return api.post({}, JSON.stringify(data)).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return undefined;
        });
    }

    gitRefs(endpoint: string): angular.IPromise<string[]> {
        var api: IMineMeldExtensionsResource;

        api = <IMineMeldExtensionsResource>this.MineMeldAPIService.getAPIResource('/extensions/git-refs', {}, {
            get: {
                method: 'GET'
            }
        });

        return api.get({ep: endpoint}).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return [];
        });
    }
}
