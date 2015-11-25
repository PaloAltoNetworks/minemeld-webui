/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldAuth } from './auth';

export interface IMinemeldConfigInfo {
    fabric: boolean;
    mgmtbus: boolean;
    num_nodes: number;
    version: string;
}

export interface IMinemeldConfigNode {
    name: string;
    properties: any;
    version: string;
}

export interface IMinemeldConfigService {
    configInfo: IMinemeldConfigInfo;
    nodesConfig: IMinemeldConfigNode[];
    refresh(): angular.IPromise<any>;
    reload(): angular.IPromise<any>;
}

export class MinemeldConfig implements IMinemeldConfigService {
    static $inject = ['$resource', '$state', '$q', 'MinemeldAuth'];

    configInfo: IMinemeldConfigInfo;
    nodesConfig: IMinemeldConfigNode[];

    $resource: angular.resource.IResourceService;
    MinemeldAuth: IMinemeldAuth;
    $state: angular.ui.IStateService;
    $q: angular.IQService;

    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService,
                $q: angular.IQService,
                MinemeldAuth: IMinemeldAuth) {
        this.$resource = $resource;
        this.MinemeldAuth = MinemeldAuth;
        this.$state = $state;
        this.$q = $q;
    }

    refresh() {
        return this.getConfigInfo().then((result: any) => {
            var nps: angular.IPromise<any>[] = new Array();
            var j: number;

            for (j = 0; j < this.configInfo.num_nodes; j++) {
                nps.push(this.getNodeConfig(j));
            }

            return this.$q.all(nps);
        })
        .then((nodes: any) => {
            return this.nodesConfig = nodes;
        });
    }

    reload() {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if(!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = this.$resource('/config/reload', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return r.get().$promise.then((result: any) => {
            return this.refresh();
        });        
    }

    private getNodeConfig(noden: number): angular.IPromise<any> {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if(!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r  = this.$resource('/config/node/:noden', {
                noden: noden
            }, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return r.get().$promise.then((result: any) => {
            return result.result;
        });        
    }

    private getConfigInfo(): angular.IPromise<any> {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if(!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = this.$resource('/config/info', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return r.get().$promise.then((result: any) => {
            this.configInfo = result.result;
        }, (error: any) => {
            this.configInfo = undefined;

            throw error;
        });
    }
}
