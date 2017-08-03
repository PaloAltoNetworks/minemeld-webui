/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService } from './minemeldapi';

export interface IMinemeldCandidateConfigInfo {
    fabric: boolean;
    mgmtbus: boolean;
    next_node_id: number;
    version: string;
    changed: boolean;
}

export interface IMinemeldCandidateConfigNode {
    name: string;
    properties: any;
    version: string;
    deleted?: boolean;
}

export interface IMinemeldConfigNode {
    prototype?: string;
    inputs?: string[];
    output?: boolean;
    config?: Object;
}

export interface IMinemeldConfig {
    nodes: { [id: string]: IMinemeldConfigNode };
}

export interface IMinemeldConfigService {
    configInfo: IMinemeldCandidateConfigInfo;
    nodesConfig: IMinemeldCandidateConfigNode[];
    changed: boolean;

    runningConfig(cancellable?: boolean): angular.IPromise<IMinemeldConfig>;
    committedConfig(): angular.IPromise<IMinemeldConfig>;
    candidateConfig(): angular.IPromise<IMinemeldCandidateConfigNode[]>;
    refresh(): angular.IPromise<any>;
    reload(config?: string): angular.IPromise<any>;
    saveNodeConfig(noden: number): angular.IPromise<any>;
    deleteNode(noden: number): angular.IPromise<any>;
    commit(): angular.IPromise<any>;
    addNode(name: string, properties: any): angular.IPromise<any>;
    getDataFile(datafilename: string, dtype?: string): angular.IPromise<any>;
    saveDataFile(datafilename: string, data: any, hup?: string, dtype?: string): angular.IPromise<any>;
    appendDataFile(datafilename: string, data: any, hup?: string, dtype?: string): angular.IPromise<any>;
}

interface IMinemeldConfigResource extends angular.resource.IResourceClass<angular.resource.IResource<any>> {
    put(params: any, nodeconfig: any);
    del(params: any);
    post(params: any, postdata: any);
}

export class MinemeldConfigService implements IMinemeldConfigService {
    deletedNode: IMinemeldCandidateConfigNode = {
        'name': '',
        'properties': {},
        'deleted': true,
        'version': ''
    };

    configInfo: IMinemeldCandidateConfigInfo;
    nodesConfig: IMinemeldCandidateConfigNode[];
    changed: boolean;

    $state: angular.ui.IStateService;
    $q: angular.IQService;
    MineMeldAPIService: IMineMeldAPIService;

    /** @ngInject */
    constructor($state: angular.ui.IStateService,
                $q: angular.IQService,
                MineMeldAPIService: IMineMeldAPIService) {
        this.$state = $state;
        this.$q = $q;
        this.MineMeldAPIService = MineMeldAPIService;

        this.MineMeldAPIService.onLogout(this.emptyCache.bind(this));
    }

    runningConfig(cancellable?: boolean): angular.IPromise<IMinemeldConfig> {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (typeof cancellable === 'undefined') {
            cancellable = true;
        }

        r = this.MineMeldAPIService.getAPIResource('/config/running', {}, {
            get: {
                method: 'GET'
            }
        }, cancellable);

        return r.get().$promise.then((result: any) => {
            return result.result;
        });
    }

    committedConfig(): angular.IPromise<IMinemeldConfig> {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        r = this.MineMeldAPIService.getAPIResource('/config/committed', {}, {
            get: {
                method: 'GET'
            }
        });

        return r.get().$promise.then((result: any) => {
            return result.result;
        });
    }

    candidateConfig(): angular.IPromise<IMinemeldCandidateConfigNode[]> {
        if (this.nodesConfig) {
            return this.$q.when(this.nodesConfig);
        }

        return this.refresh();
    }

    refresh() {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        r = this.MineMeldAPIService.getAPIResource('/config/full', {}, {
            get: {
                method: 'GET'
            }
        });

        return r.get().$promise.then((result: any) => {
            var nodesConfig: IMinemeldCandidateConfigNode[];

            nodesConfig = result.result.nodes.map((x: IMinemeldCandidateConfigNode) => {
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
        });
    }

    reload(config?: string) {
        var r: angular.resource.IResourceClass<angular.resource.IResource<any>>;
        var params: any = {};

        r = this.MineMeldAPIService.getAPIResource('/config/reload', {}, {
            get: {
                method: 'GET'
            }
        }, false);

        if (config) {
            params.c = config;
        }

        return r.get(params).$promise.then((result: any) => {
            return this.refresh();
        });
    }

    commit() {
        var r: IMinemeldConfigResource;

        r = <IMinemeldConfigResource>(this.MineMeldAPIService.getAPIResource('/config/commit', {}, {
            post: {
                method: 'POST'
            }
        }, false));

        return r.post({}, JSON.stringify({ version: this.configInfo.version })).$promise;
    }

    saveNodeConfig(noden: number): angular.IPromise<any> {
        var r: IMinemeldConfigResource;

        r = <IMinemeldConfigResource>(this.MineMeldAPIService.getAPIResource('/config/node/:noden', {
            noden: noden
        }, {
            put: {
                method: 'PUT'
            }
        }, false));

        return r.put({}, JSON.stringify(this.nodesConfig[noden])).$promise.then((result: any) => {
            return result.result;
        }).then((result: any) => {
            this.nodesConfig[noden].version = result;
            this.changed = true;
        });
    }

    addNode(name: string, properties: any): angular.IPromise<any> {
        var r: IMinemeldConfigResource;
        var config: IMinemeldCandidateConfigNode;

        config = {
            name: name,
            properties: properties,
            version: this.configInfo.version
        };

        r = <IMinemeldConfigResource>(this.MineMeldAPIService.getAPIResource('/config/node', {}, {
            post: {
                method: 'POST'
            }
        }, false));

        return r.post({}, JSON.stringify(config)).$promise.then((result: any) => {
            return result.result;
        });
    }

    deleteNode(noden: number): angular.IPromise<any> {
        var r: IMinemeldConfigResource;

        r = <IMinemeldConfigResource>(this.MineMeldAPIService.getAPIResource('/config/node/:noden', {
            noden: noden
        }, {
            del: {
                method: 'DELETE'
            }
        }, false));

        return r.del({ version: this.nodesConfig[noden].version }).$promise
        .then((result: any) => {
            return result.result;
        }).then((result: any) => {
            this.changed = true;
        });
    }

    getDataFile(datafilename: string, dtype?: string): angular.IPromise<any> {
        var r: IMinemeldConfigResource;
        var params: any = {};

        r = <IMinemeldConfigResource>(this.MineMeldAPIService.getAPIResource('/config/data/:datafilename', {
            datafilename: datafilename
        }, {
            get: {
                method: 'GET'
            }
        }));

        if (dtype) {
            params.t = dtype;
        }

        return r.get(params).$promise
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

        r = <IMinemeldConfigResource>(this.MineMeldAPIService.getAPIResource('/config/data/:datafilename', {
            datafilename: datafilename
        }, {
                put: {
                    method: 'PUT'
                }
        }, false));

        if (hup) {
            params.h = hup;
        }

        return r.put(params, JSON.stringify(data)).$promise
        .then((result: any) => {
            return result.result;
        });
    }

    appendDataFile(datafilename: string, data: any, hup?: string, dtype?: string): angular.IPromise<any> {
        var r: IMinemeldConfigResource;
        var params: any = {};

        r = <IMinemeldConfigResource>(this.MineMeldAPIService.getAPIResource('/config/data/:datafilename/append', {
            datafilename: datafilename
        }, {
                post: {
                    method: 'POST'
                }
        }, false));

        if (hup) {
            params.h = hup;
        }
        if (dtype) {
            params.t = dtype;
        }

        return r.post(params, JSON.stringify(data)).$promise
            .then((result: any) => {
                return result.result;
            });
    }

    private emptyCache(): void {
        this.nodesConfig = undefined;
        this.configInfo = undefined;
        this.changed = undefined;
    }
}
