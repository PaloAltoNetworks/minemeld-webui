/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldAuth } from './auth';

export interface IMinemeldMetrics {
    getNodeType(nodetype: string, options?: IMetricsParams): angular.IPromise<any>;
    getMinemeld(options?: IMetricsParams): angular.IPromise<any>;
    getNode(nodename: string, options?: IMetricsParams);
}

interface IMetricsParams {
    cf?: string;
    r?: number;
    dt?: number;
}

interface INTMetricsParams extends IMetricsParams {
    nodetype: string;
}

interface INodeMetricsParams extends IMetricsParams {
    nodename: string;
}

export class MinemeldMetrics implements IMinemeldMetrics {
    static $inject = ['$resource', '$state', 'MinemeldAuth'];

    $resource: angular.resource.IResourceService;
    $state: angular.ui.IStateService;
    MinemeldAuth: IMinemeldAuth;

    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService,
                MinemeldAuth: IMinemeldAuth) {
        this.$resource = $resource;
        this.$state = $state;
        this.MinemeldAuth = MinemeldAuth;
    }

    public getNodeType(nodetype: string, options?: IMetricsParams) {
        var params = <INTMetricsParams>{
            nodetype: nodetype
        };
        var metricsNodeType: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        if (options) {
            if (options.cf) {
                params.cf = options.cf;
            }
            if (options.dt) {
                params.dt = options.dt;
            }
            if (options.r) {
                params.r = options.r;
            }
        }

        metricsNodeType = this.$resource('/metrics/minemeld/:nodetype', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return metricsNodeType.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return [];
        }, (error: any) => {
            if (error.status === 401) {
                this.$state.go('login');
            }

            return error;
        });
    }

    public getNode(nodename: string, options?: IMetricsParams) {
        var params: INodeMetricsParams = <INodeMetricsParams>{
            nodename: nodename
        };
        var metricsNode: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        if (options) {
            if (options.cf) {
                params.cf = options.cf;
            }
            if (options.dt) {
                params.dt = options.dt;
            }
            if (options.r) {
                params.r = options.r;
            }
        }

        metricsNode = this.$resource('/metrics/:nodename', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return metricsNode.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return [];
        }, (error: any) => {
            if (error.status === 401) {
                this.$state.go('login');
            }

            return error;
        });
    }

    public getMinemeld(options?: IMetricsParams) {
        var params = <IMetricsParams>{};
        var metricsMinemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        if (options) {
            if (options.cf) {
                params.cf = options.cf;
            }
            if (options.dt) {
                params.dt = options.dt;
            }
            if (options.r) {
                params.r = options.r;
            }
        }

        metricsMinemeld = this.$resource('/metrics/minemeld', {}, {
            get: {
                method: 'GET',
                headers: this.MinemeldAuth.getAuthorizationHeaders()
            }
        });

        return metricsMinemeld.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return [];
        }, (error: any) => {
            if (error.status === 401) {
                this.$state.go('login');
            }

            return error;
        });
    }
}
