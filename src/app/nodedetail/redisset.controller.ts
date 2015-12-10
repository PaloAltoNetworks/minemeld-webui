/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldStatusNode } from '../../app/services/status';
import { NodeDetailInfoController } from './nodedetail.info.controller';

class NodeDetailRedisSetInfoController extends NodeDetailInfoController{
    public renderState(vm: any, ns: IMinemeldStatusNode) {
        vm.nodeState = ns;
        vm.nodeState.indicators = ns.length;
        vm.nodeState.stateAsString = vm.mmstatus.NODE_STATES[ns.state];
        vm.nodeState.feedURL = location.protocol + '//' + location.hostname + '/feeds/' + vm.nodename;
        console.log(vm);
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

/** @ngInject **/
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

console.log("Loading RedisSet");
angular.module('minemeldWebui')
    .config(redisSetRouterConfig)
    .run(redisSetRegisterClass)
    .controller('NodeDetailRedisSetInfoController', NodeDetailRedisSetInfoController)
    ;
