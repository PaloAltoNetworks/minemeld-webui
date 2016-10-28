/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService, IMinemeldStatus } from  '../../app/services/status';

export interface INodeDetailResolverService {
    registerClass(classname: string, classdetails: INodeDetailClass);
    resolveNode(nodename: string);
}

export interface INodeDetailTab {
    icon: string;
    tooltip: string;
    state: string;
    active: boolean;
}

export interface INodeDetailClass {
    tabs: INodeDetailTab[];
}

export class NodeDetailResolver implements INodeDetailResolverService {
    mmstatus: IMinemeldStatusService;
    $resource: angular.resource.IResourceService;
    $q: angular.IQService;
    $rootScope: angular.IRootScopeService;

    nodeClasses: any = {};

    defaultClass: INodeDetailClass = {
        tabs: [
            {
                icon: 'fa fa-circle-o',
                tooltip: 'INFO',
                state: 'nodedetail.info',
                active: false
            },
            {
                icon: 'fa fa-area-chart',
                tooltip: 'STATS',
                state: 'nodedetail.stats',
                active: false
            },
            {
                icon: 'fa fa-asterisk',
                tooltip: 'GRAPH',
                state: 'nodedetail.graph',
                active: false
            }
        ]
    };

    /** @ngInject */
    constructor(MinemeldStatusService: IMinemeldStatusService,
                $resource: angular.resource.IResourceService,
                $q: angular.IQService,
                $rootScope: angular.IRootScopeService) {
        this.mmstatus = MinemeldStatusService;
        this.$resource = $resource;
        this.$q = $q;
        this.$rootScope = $rootScope;
    }

    registerClass(classname: string, classdetails: INodeDetailClass) {
        this.nodeClasses[classname] = classdetails;
    }

    resolveNode(nodename: string) {
        return this.mmstatus.getStatus().then((currentStatus: IMinemeldStatus) => {
            var node: any = currentStatus[nodename];

            if (this.nodeClasses.hasOwnProperty(node.class)) {
                return this.nodeClasses[node.class];
            }

            return this.defaultClass;
        });
    }
}
