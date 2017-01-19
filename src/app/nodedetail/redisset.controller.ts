/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldStatusNode } from '../../app/services/status';
import { NodeDetailFeedInfoController } from './feed.controller';

class NodeDetailRedisSetInfoController extends NodeDetailFeedInfoController {
    public renderState(vm: any, ns: IMinemeldStatusNode) {
        var clocation: string;

        vm.nodeState = ns;
        vm.nodeState.indicators = ns.length;
        vm.nodeState.stateAsString = vm.mmstatus.NODE_STATES[ns.state];

        clocation = location.protocol + '//' + location.hostname;
        if (location.port) {
            clocation += ':' + location.port;
        }
        vm.nodeState.feedURL = clocation + '/feeds/' + vm.nodename;
    }
}

/** @ngInject */
function redisSetRouterConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.redissetinfo', {
            templateUrl: 'app/nodedetail/redisset.info.html',
            controller: 'NodeDetailRedisSetInfoController',
            controllerAs: 'vm'
        })
        ;
}

/** @ngInject */
function redisSetRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.redis.RedisSet', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.redissetinfo',
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

console.log('Loading RedisSet');
angular.module('minemeldWebui')
    .config(redisSetRouterConfig)
    .run(redisSetRegisterClass)
    .controller('NodeDetailRedisSetInfoController', NodeDetailRedisSetInfoController)
    ;
