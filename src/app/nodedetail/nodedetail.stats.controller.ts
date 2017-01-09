/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService, IMinemeldStatus } from  '../../app/services/status';
import { IMinemeldMetricsService } from '../../app/services/metrics';
import { IMinemeldStatusNode } from '../../app/services/status';
import { IThrottled, IThrottleService } from '../../app/services/throttle';

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
    mmstatus: IMinemeldStatusService;
    mmmetrics: IMinemeldMetricsService;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $stateParams: angular.ui.IStateParamsService;

    nodename: string;

    nodeState: INGMinemeldStatusNode;

    mmStatusListener: any;
    mmThrottledUpdate: IThrottled;

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
    metrics_names: string[];

    updateNodeMetricsPromise: angular.IPromise<any>;
    updateNodeMetricsInterval: number = 5 * 60 * 1000;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        MinemeldMetricsService: IMinemeldMetricsService,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService,
        $rootScope: angular.IRootScopeService,
        ThrottleService: IThrottleService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatusService;
        this.mmmetrics = MinemeldMetricsService;
        this.$interval = $interval;
        this.moment = moment;
        this.$scope = $scope;
        this.$compile = $compile;
        this.$state = $state;
        this.$stateParams = $stateParams;

        this.nodename = $scope.$parent['nodedetail']['nodename'];

        this.updateMinemeldStatus();
        this.mmThrottledUpdate = ThrottleService.throttle(
            this.updateMinemeldStatus.bind(this),
            500
        );
        this.mmStatusListener = $rootScope.$on(
            'mm-status-changed',
            this.mmThrottledUpdate
        );
        this.updateNodeMetrics();

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    renderMetrics(vm: NodeDetailStatsController, result: any) {
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
            if (cm.values.length > 0) {
                if (cm.values[cm.values.length - 1].y == null) {
                    cm.values = cm.values.slice(0, -1);
                }
            }
            nmetrics[m] = [cm];
        }
        vm.metrics = nmetrics;
        vm.updateMetricsNames();

        if (!vm.$scope.$$phase) {
            vm.$scope.$digest();
        }

        for (var p in vm.chartApi) {
            if (nmetrics.hasOwnProperty(p)) {
                vm.chartApi[p].updateWithData(nmetrics[p]);
            }
        }
    }

    chartRangeChanged(): void {
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

    protected updateMetricsNames() {
        this.metrics_names = Object.keys(this.metrics);
        angular.forEach(Object.keys(this.nodeState.statistics), (key: string) => {
            if (this.metrics_names.indexOf(key) === -1) {
                this.metrics_names.push(key);
            }
        });
    }

    private updateNodeMetrics() {
        var vm: any = this;

        vm.mmmetrics.getNode(vm.nodename, {
            dt: vm.chartDT,
            r: vm.chartDR
        })
        .then(function(result: any) {
            vm.renderMetrics(vm, result);
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
        this.mmstatus.getStatus().then((currentStatus: IMinemeldStatus) => {
            this.nodeState = <INGMinemeldStatusNode>currentStatus[this.nodename];
            this.updateMetricsNames();
            this.nodeState.indicators = this.nodeState.length;
        });
    }

    private destroy() {
        if (this.mmThrottledUpdate) {
            this.mmThrottledUpdate.cancel();
        }
        if (this.mmStatusListener) {
            this.mmStatusListener();
        }
        if (this.updateNodeMetricsPromise) {
            this.$interval.cancel(this.updateNodeMetricsPromise);
        }
    }
}
