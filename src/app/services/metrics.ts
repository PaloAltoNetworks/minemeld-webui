/// <reference path="../../../.tmp/typings/tsd.d.ts" />

export interface IMinemeldMetrics {
    getNodeType(nodetype: string, options?: IMetricsParams): angular.IPromise<any>;
    getMinemeld(options?: IMetricsParams): angular.IPromise<any>;
    getNode(nodename: string, options?: IMetricsParams);
    setAuthorization(username: string, password: string): void;
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
        this.metricsNodeType = $resource('/metrics/minemeld/:nodetype');
        this.metricsMinemeld = $resource('/metrics/minemeld');
        this.metricsNode = $resource('/metrics/:nodename');

        this.$resource = $resource;
        this.$state = $state;
    }

    public setAuthorization(username: string, password: string) {
        this.metricsNodeType = this.$resource('/metrics/minemeld/:nodetype', {}, {
            get: {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + window.btoa(username + ':' + password)
                }
            }
        });

        this.metricsMinemeld = this.$resource('/metrics/minemeld', {}, {
            get: {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + window.btoa(username + ':' + password)
                }
            }
        });

        this.metricsNode = this.$resource('/metrics/:nodename', {}, {
            get: {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + window.btoa(username + ':' + password)
                }
            }
        });
    }

    public getNodeType(nodetype: string, options?: IMetricsParams) {
        var params = <INTMetricsParams>{
            nodetype: nodetype
        };

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
