/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService } from './minemeldapi';

export interface IMinemeldMetricsService {
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

export class MinemeldMetricsService implements IMinemeldMetricsService {
    $state: angular.ui.IStateService;
    MineMeldAPIService: IMineMeldAPIService;

    /** @ngInject */
    constructor($state: angular.ui.IStateService,
                MineMeldAPIService: IMineMeldAPIService) {
        this.$state = $state;
        this.MineMeldAPIService = MineMeldAPIService;
    }

    public getNodeType(nodetype: string, options?: IMetricsParams) {
        var params = <INTMetricsParams>{
            nodetype: nodetype
        };
        var metricsNodeType: angular.resource.IResourceClass<angular.resource.IResource<any>>;

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

        metricsNodeType = this.MineMeldAPIService.getAPIResource('/metrics/minemeld/:nodetype', {}, {
            get: {
                method: 'GET'
            }
        });

        return metricsNodeType.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return [];
        });
    }

    public getNode(nodename: string, options?: IMetricsParams) {
        var params: INodeMetricsParams = <INodeMetricsParams>{
            nodename: nodename
        };
        var metricsNode: angular.resource.IResourceClass<angular.resource.IResource<any>>;

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

        metricsNode = this.MineMeldAPIService.getAPIResource('/metrics/:nodename', {}, {
            get: {
                method: 'GET'
            }
        });

        return metricsNode.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return [];
        });
    }

    public getMinemeld(options?: IMetricsParams) {
        var params = <IMetricsParams>{};
        var metricsMinemeld: angular.resource.IResourceClass<angular.resource.IResource<any>>;

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

        metricsMinemeld = this.MineMeldAPIService.getAPIResource('/metrics/minemeld', {}, {
            get: {
                method: 'GET'
            }
        });

        return metricsMinemeld.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return [];
        });
    }
}
