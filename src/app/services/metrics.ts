/// <reference path="../../../.tmp/typings/tsd.d.ts" />

export interface IMinemeldMetrics {
    getNodeType(nodetype: string, options?: IMetricsParams): angular.IPromise<any>;
    getMinemeld(options?: IMetricsParams): angular.IPromise<any>;
    getNode(nodename: string, options?: IMetricsParams);
    setAuthorizationHeaders(headers: any): void;
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
    static $inject = ['$resource', '$state'];

    metricsNodeType: angular.resource.IResourceClass<angular.resource.IResource<any>>;
    metricsMinemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;
    metricsNode: angular.resource.IResourceClass<angular.resource.IResource<any>>;

    $resource: angular.resource.IResourceService;
    $state: angular.ui.IStateService;

    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService) {
        this.$resource = $resource;
        this.$state = $state;
    }

    public setAuthorizationHeaders(headers: any) {
        this.metricsNodeType = this.$resource('/metrics/minemeld/:nodetype', {}, {
            get: {
                method: 'GET',
                headers: headers
            }
        });

        this.metricsMinemeld = this.$resource('/metrics/minemeld', {}, {
            get: {
                method: 'GET',
                headers: headers
            }
        });

        this.metricsNode = this.$resource('/metrics/:nodename', {}, {
            get: {
                method: 'GET',
                headers: headers
            }
        });
    }

    public getNodeType(nodetype: string, options?: IMetricsParams) {
        var params = <INTMetricsParams>{
            nodetype: nodetype
        };

        if (!this.metricsNodeType) {
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

        return this.metricsNodeType.get(params).$promise.then((result: any) => {
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

        if (!this.metricsNode) {
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

        return this.metricsNode.get(params).$promise.then((result: any) => {
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
        
        if (!this.metricsMinemeld) {
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

        return this.metricsMinemeld.get(params).$promise.then((result: any) => {
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
