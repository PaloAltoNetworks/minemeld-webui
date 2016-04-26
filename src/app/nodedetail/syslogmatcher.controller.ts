/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { NodeDetailStatsController } from './nodedetail.stats.controller';

class NodeDetailsSyslogMatcherSourcesController extends NodeDetailStatsController {
    sources: boolean = false;

    renderMetrics(vm: NodeDetailsSyslogMatcherSourcesController, result: any) {
        var ns: number = 0;
        var j: number;

        super.renderMetrics(vm, result);

        for (j = 0; j < vm.metrics_names.length; j++) {
            if (vm.metrics_names[j].indexOf('source.') === 0) {
                ns++;
            }
        }

        vm.sources = ns !== 0;
    }
}

/** @ngInject */
function syslogMatcherRouterConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.syslogmatcherstats', {
            templateUrl: 'app/nodedetail/syslogmatcher.stats.html',
            controller: 'NodeDetailStatsController',
            controllerAs: 'nodedetailstats'
        })
        .state('nodedetail.syslogmatchersources', {
            templateUrl: 'app/nodedetail/syslogmatcher.sources.html',
            controller: NodeDetailsSyslogMatcherSourcesController,
            controllerAs: 'nodedetailstats'
        })
        ;
}

/** @ngInject */
function syslogMatcherRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.syslog.SyslogMatcher', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.info',
            active: false
        },
        {
            icon: 'fa fa-area-chart',
            tooltip: 'STATS',
            state: 'nodedetail.syslogmatcherstats',
            active: false
        },
        {
            icon: 'fa fa-cube',
            tooltip: 'SOURCES',
            state: 'nodedetail.syslogmatchersources',
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

console.log('Loading syslog matcher');
angular.module('minemeldWebui')
    .config(syslogMatcherRouterConfig)
    .run(syslogMatcherRegisterClass)
    ;
