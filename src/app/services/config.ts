/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldAuth } from './auth';

export interface IMinemeldConfigInfo {
    fabric: boolean;
    mgmtbus: boolean;
    next_node_id: number;
    version: string;
    changed: boolean;
}

export interface IMinemeldConfigNode {
    name: string;
    properties: any;
    version: string;
    deleted?: boolean;
}

export interface IMinemeldConfigService {
    configInfo: IMinemeldConfigInfo;
    nodesConfig: IMinemeldConfigNode[];
    changed: boolean;

    refresh(): angular.IPromise<any>;
    reload(config?: string): angular.IPromise<any>;
    saveNodeConfig(noden: number): angular.IPromise<any>;
    deleteNode(noden: number): angular.IPromise<any>;
    commit(): angular.IPromise<any>;
    addNode(name: string, properties: any): angular.IPromise<any>;
    getDataFile(datafilename: string): angular.IPromise<any>;
    saveDataFile(datafilename: string, data: any, hup?: string): angular.IPromise<any>;
    appendDataFile(datafilename: string, data: any, hup?: string): angular.IPromise<any>;
}

interface IMinemeldConfigResource extends angular.resource.IResourceClass<angular.resource.IResource<any>> {
    put(params: any, nodeconfig: any);
    del(params: any);
    post(params: any, postdata: any);
}

export class MinemeldConfig implements IMinemeldConfigService {
    static $inject = ['$resource', '$state', '$q', 'MinemeldAuth'];

    deletedNode: IMinemeldConfigNode = {
        'name': '',
        'properties': {},
        'deleted': true,
        'version': ''
    };

    configInfo: IMinemeldConfigInfo;
    nodesConfig: IMinemeldConfigNode[];
    changed: boolean;

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
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = this.$resource('/config/full', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return r.get().$promise.then((result: any) => {
            var nodesConfig: IMinemeldConfigNode[];

            nodesConfig = result.result.nodes.map((x: IMinemeldConfigNode) => {
                if (x === null) {
                    return this.deletedNode;
                }

                return x;
            });
            delete result.result.nodes;

            this.configInfo = result.result;
            this.changed = this.configInfo.changed;
            this.nodesConfig = nodesConfig;

            return this.nodesConfig;
        }, (error: any) => {
            if (error.status === 500) {
                return this.reload();
            }

            this.configInfo = undefined;
            this.changed = false;
            this.nodesConfig = [];

            throw error;
        });
    }

    reload(config?: string) {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;
        var params: any = {};

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = this.$resource('/config/reload', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        if (config) {
            params.c = config;
        }

        return r.get(params).$promise.then((result: any) => {
            return this.refresh();
        });
    }

    commit() {
        var r: IMinemeldConfigResource;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = <IMinemeldConfigResource>(this.$resource('/config/commit', {}, {
            post: {
                method: 'POST',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        }));

        return r.post({}, JSON.stringify({ version: this.configInfo.version })).$promise;
    }

    saveNodeConfig(noden: number): angular.IPromise<any> {
        var r: IMinemeldConfigResource;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = <IMinemeldConfigResource>(this.$resource('/config/node/:noden', {
            noden: noden
        }, {
            put: {
                method: 'PUT',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        }));

        return r.put({}, JSON.stringify(this.nodesConfig[noden])).$promise.then((result: any) => {
            return result.result;
        }).then((result: any) => {
            this.nodesConfig[noden].version = result;
            this.changed = true;
        });
    }

    addNode(name: string, properties: any): angular.IPromise<any> {
        var r: IMinemeldConfigResource;
        var config: IMinemeldConfigNode;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
             return;
        }

        config = {
            name: name,
            properties: properties,
            version: this.configInfo.version
        };

        r = <IMinemeldConfigResource>(this.$resource('/config/node', {}, {
            post: {
                method: 'POST',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        }));

        return r.post({}, JSON.stringify(config)).$promise.then((result: any) => {
            return result.result;
        });
    }

    deleteNode(noden: number): angular.IPromise<any> {
        var r: IMinemeldConfigResource;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = <IMinemeldConfigResource>(this.$resource('/config/node/:noden', {
            noden: noden
        }, {
            del: {
                method: 'DELETE',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        }));

        return r.del({ version: this.nodesConfig[noden].version }).$promise
        .then((result: any) => {
            return result.result;
        }).then((result: any) => {
            this.changed = true;
        });
    }

    getDataFile(datafilename: string): angular.IPromise<any> {
        var r: IMinemeldConfigResource;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = <IMinemeldConfigResource>(this.$resource('/config/data/:datafilename', {
            datafilename: datafilename
        }, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        }));

        return r.get().$promise
        .then((result: any) => {
            return result.result;
        }, (error: any) => {
            if (error.status === 400) {
                return null;
            }

            throw error;
        });
    }

    saveDataFile(datafilename: string, data: any, hup?: string): angular.IPromise<any> {
        var r: IMinemeldConfigResource;
        var params: any = {};

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = <IMinemeldConfigResource>(this.$resource('/config/data/:datafilename', {
            datafilename: datafilename
        }, {
                put: {
                    method: 'PUT',
                    headers: this.MinemeldAuth.getAuthorizationHeaders()
                }
        }));

        if (hup) {
            params.h = hup;
        }

        return r.put(params, JSON.stringify(data)).$promise
        .then((result: any) => {
            return result.result;
        });
    }

    appendDataFile(datafilename: string, data: any, hup?: string): angular.IPromise<any> {
        var r: IMinemeldConfigResource;
        var params: any = {};

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = <IMinemeldConfigResource>(this.$resource('/config/data/:datafilename/append', {
            datafilename: datafilename
        }, {
                post: {
                    method: 'POST',
                    headers: this.MinemeldAuth.getAuthorizationHeaders()
                }
        }));

        if (hup) {
            params.h = hup;
        }

        return r.post(params, JSON.stringify(data)).$promise
            .then((result: any) => {
                return result.result;
            });
    }
}
