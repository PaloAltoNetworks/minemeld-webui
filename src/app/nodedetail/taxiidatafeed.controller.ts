/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldStatusNode } from '../../app/services/status';
import { NodeDetailFeedInfoController } from './feed.controller';

class NodeDetailTAXIIDataFeedInfoController extends NodeDetailFeedInfoController {
    public renderState(vm: any, ns: IMinemeldStatusNode) {
        var clocation: string;

        super.renderState(vm, ns);

        clocation = location.protocol + '//' + location.hostname;
        if (location.port) {
            clocation += ':' + location.port;
        }
        vm.nodeState.discoveryServiceURL = clocation + '/taxii-discovery-service';
    }
}

/** @ngInject */
function taxiiDataFeedRouterConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.taxiidatafeedinfo', {
            templateUrl: 'app/nodedetail/taxiidatafeed.info.html',
            controller: NodeDetailTAXIIDataFeedInfoController,
            controllerAs: 'vm'
        })
        ;
}

/** @ngInject */
function taxiiDataFeedRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.taxii.DataFeed', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.taxiidatafeedinfo',
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
        }]
    });
}

console.log('Loading TAXII DataFeed');
angular.module('minemeldWebui')
    .config(taxiiDataFeedRouterConfig)
    .run(taxiiDataFeedRegisterClass)
    ;
