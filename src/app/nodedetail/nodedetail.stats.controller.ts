/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldStatus } from  '../../app/services/status';
import { IMinemeldMetrics } from '../../app/services/metrics';
import { IMinemeldStatusNode } from '../../app/services/status';

interface INGMinemeldStatusNode extends IMinemeldStatusNode {
    indicators: number;
}

interface IMetric {
    values: { x: number, y: number }[];
    area?: boolean;
    color?: string;
    key?: string;
}

interface IMetricsDictionary {
    [index: string]: IMetric[];
}

export class NodeDetailStatsController {
    mmstatus: IMinemeldStatus;
    mmmetrics: IMinemeldMetrics;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $stateParams: angular.ui.IStateParamsService;

    nodename: string;

    nodeState: INGMinemeldStatusNode;

    chartOptions: any = {
        chart: {
            type: 'lineChart',
            margin : {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            height: 50,
            x: function(d: any) { return d.x; },
            y: function(d: any) { return d.y; },
            color: ['#ff7f0e'],
            groupSpacing: 0.5,
            transition: 0,
            useInteractiveGuideline: true,
            showXAxis: false,
            showYAxis: false,
            yAxis: {
                tickFormat: (d: any, i: any) => { return Math.ceil(d); }
            },
            xAxis: {
                tickFormat: (d: any, i: any) => { return this.moment.unix(d).fromNow().toUpperCase(); }
            },
            forceY: [0, 1],
            showLegend: false,
            interpolate: 'monotone'
        }
    };
    chartApi: any = {};

    chartRange: string = '24h';
    chartDT: number = 86400;
    chartDR: number = 1800;

    metrics: IMetricsDictionary = <IMetricsDictionary>{};

    updateNodeMetricsPromise: angular.IPromise<any>;
    updateNodeMetricsInterval: number = 5 * 60 * 1000;

    updateMinemeldStatusPromise: angular.IPromise<any>;
    updateMinemeldStatusInterval: number = 5 * 60 * 1000;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatus: IMinemeldStatus, MinemeldMetrics: IMinemeldMetrics,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatus;
        this.mmmetrics = MinemeldMetrics;
        this.$interval = $interval;
        this.moment = moment;
        this.$scope = $scope;
        this.$compile = $compile;
        this.$state = $state;
        this.$stateParams = $stateParams;

        this.nodename = $scope.$parent['nodedetail']['nodename'];

        this.updateMinemeldStatus();
        this.updateNodeMetrics();

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    private updateNodeMetrics() {
        var vm: any = this;

        vm.mmmetrics.getNode(vm.nodename, {
            dt: vm.chartDT,
            r: vm.chartDR
        })
        .then(function(result: any) {
            var j: number;
            var m: string;
            var cm: IMetric;
            var nmetrics: IMetricsDictionary = <IMetricsDictionary>{};

            for (j = 0; j < result.length; j++) {
                m = result[j].metric;
                if (m === 'length') {
                    m = 'indicators';
                }
                cm = <IMetric> {
                    area: true,
                    color: '#ff7f0e',
                    values: result[j].values.map(function(e: number[]) {
                        return { x: e[0], y: e[1] };
                    })
                };
                nmetrics[m] = [cm];
            }
            vm.metrics = nmetrics;

            for (var p in vm.chartApi) {
                if (nmetrics.hasOwnProperty(p)) {
                    vm.chartApi[p].updateWithData(nmetrics[p]);
                }
            }
        }, function(error: any) {
            vm.toastr.error('ERROR RETRIEVING MINEMELD METRICS: ' + error.status);
        })
        .finally(function() {
            vm.updateNodeMetricsPromise = vm.$interval(
                vm.updateNodeMetrics.bind(vm),
                vm.updateNodeMetricsInterval,
                1
            );
        })
        ;
    }

    private updateMinemeldStatus() {
        var vm: any = this;

        vm.mmstatus.getMinemeld()
        .then(function(result: any) {
            var ns: IMinemeldStatusNode;

            ns = <IMinemeldStatusNode>(result.filter(function(x: any) { return x.name === vm.nodename; })[0]);
            vm.nodeState = ns;
            vm.nodeState.indicators = ns.length;
        }, function(error: any) {
            vm.toastr.error('ERROR RETRIEVING MINEMELD STATUS: ' + error.status);
        })
        .finally(function() {
            vm.updateMinemeldStatusPromise = vm.$interval(
                vm.updateMinemeldStatus.bind(vm),
                vm.updateMinemeldStatusInterval,
                1
            );
        })
        ;
    }

    private destroy() {
        if (this.updateNodeMetricsPromise) {
            this.$interval.cancel(this.updateNodeMetricsPromise);
        }
        if (this.updateMinemeldStatusPromise) {
            this.$interval.cancel(this.updateMinemeldStatusPromise);
        }
    }

    private chartRangeChanged() {
        if (this.chartRange === '1h') {
            this.chartDT = 3600;
            this.chartDR = 1;
        } else if (this.chartRange === '7d') {
            this.chartDT = 24 * 3600 * 7;
            this.chartDR = 6 * 3600;
        } else if (this.chartRange === '30d') {
            this.chartDT = 30 * 3600 * 24;
            this.chartDR = 12 * 3600;
        } else {
            this.chartDT = 86400;
            this.chartDR = 1800;
        }

        if (this.updateNodeMetricsPromise) {
            this.$interval.cancel(this.updateNodeMetricsPromise);
            this.updateNodeMetrics();
        }
    }
}
