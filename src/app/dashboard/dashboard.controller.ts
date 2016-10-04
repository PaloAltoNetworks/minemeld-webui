/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService, IMinemeldStatusNode } from  '../../app/services/status';
import { IMinemeldMetricsService } from '../../app/services/metrics';

interface ITNodeIndicatorsStats {
    length: number;
    added: number;
    removed: number;
    aged_out: number;
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

export class DashboardController {
    mmstatus: IMinemeldStatusService;
    mmmetrics: IMinemeldMetricsService;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    $rootScope: angular.IRootScopeService;

    indicatorsOptions: any = {
        chart: {
            type: 'discreteBarChart',
            margin : {
                top: 0,
                right: 0,
                bottom: 5,
                left: 0
            },
            height: 128,
            x: function(d: any) { return d.x; },
            y: function(d: any) { return d.y; },
            useInteractiveGuideline: true,
            showXAxis: false,
            tooltip: {
                keyFormatter: function(d: any) { return this.moment.unix(d).fromNow().toUpperCase(); },
                valueFormatter: function(d: any) { return Math.ceil(d); }
            },
            showYAxis: false,
            forceY: [],
            yAxis: {
                tickFormat: (d: number, i: any) => { return Math.ceil(d); }
            },
            showLegend: false,
            color: ['#91B7C7']
        }
    };
    arOptions: any = {
        chart: {
            type: 'lineChart',
            margin: {
                top: 0,
                right: 0,
                bottom: 5,
                left: 0
            },
            height: 128,
            x: function(d: any) { return d.x; },
            y: function(d: any) { return d.y; },
            getSize: function(d: any) { return 0.1; },
            useInteractiveGuideline: true,
            showXAxis: false,
            interactiveLayer: {
                tooltip: {
                    headerFormatter: function(d: any) { return this.moment.unix(d).fromNow().toUpperCase(); }
                }
            },
            showYAxis: false,
            yAxis: {
                tickFormat: (d: number, i: any) => { return Math.ceil(d); }
            },
            forceY: [0, 1],
            showLegend: false,
            interpolate: 'monotone'
        }
    };

    mmStatusListener: any;

    numIndicators: number = 0;

    numMiners: number = 0;
    numProcessors: number = 0;
    numOutputs: number = 0;

    minersStats: ITNodeIndicatorsStats = <ITNodeIndicatorsStats>{ length: 0, added: 0, removed: 0 };
    outputsStats: ITNodeIndicatorsStats = <ITNodeIndicatorsStats>{ length: 0, added: 0, removed: 0 };

    metricsUpdateInterval: number = 5 * 60 * 1000;

    ntminersUpdatePromise: angular.IPromise<any>;
    ntoutputsUpdatePromise: angular.IPromise<any>;

    minersMetrics: IMetricsDictionary;
    outputsMetrics: IMetricsDictionary;

    minemeldMetrics: IMetricsDictionary;
    minemeldMetricsUpdatePromise: angular.IPromise<any>;

    chartRange: string = '24h';
    chartDT: number = 86400;
    chartDR: number = 1800;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
                MinemeldStatusService: IMinemeldStatusService, MinemeldMetricsService: IMinemeldMetricsService,
                moment: moment.MomentStatic, $scope: angular.IScope, $state: angular.ui.IStateService,
                $rootScope: angular.IRootScopeService, $timeout: angular.ITimeoutService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatusService;
        this.mmmetrics = MinemeldMetricsService;
        this.$interval = $interval;
        this.moment = moment;
        this.$scope = $scope;
        this.$rootScope = $rootScope;

        this.updateMinemeldStats();
        this.mmStatusListener = this.$rootScope.$on(
            'mm-status-changed',
            () => {
                $timeout(this.updateMinemeldStats.bind(this));
            }
        );

        this.updateNTMinersMetrics();
        this.updateNTOutputsMetrics();
        this.updateMinemeldMetrics();

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    updateMinemeldStats(): void {
        var node: IMinemeldStatusNode;

        this.numMiners = 0;
        this.numProcessors = 0;
        this.numOutputs = 0;
        this.numIndicators = 0;

        this.minersStats.length = 0;
        this.minersStats.added = 0;
        this.minersStats.removed = 0;
        this.minersStats.aged_out = 0;
        this.outputsStats.length = 0;
        this.outputsStats.added = 0;
        this.outputsStats.removed = 0;

        Object.keys(this.mmstatus.currentStatus).forEach((nname: string) => {
            node = this.mmstatus.currentStatus[nname];

            if (node.inputs.length === 0) {
                this.numMiners++;

                if (node.length) {
                    this.minersStats.length += node.length;
                }
                if (node.statistics && node.statistics['added']) {
                    this.minersStats.added += node.statistics['added'];
                }
                if (node.statistics && node.statistics['removed']) {
                    this.minersStats.removed += node.statistics['removed'];
                }
                if (node.statistics && node.statistics['aged_out']) {
                    this.minersStats.aged_out += node.statistics['aged_out'];
                }
            } else if (!node.output) {
                this.numOutputs++;

                if (node.length) {
                    this.outputsStats.length += node.length;
                }
                if (node.statistics && node.statistics['added']) {
                    this.outputsStats.added += node.statistics['added'];
                }
                if (node.statistics && node.statistics['removed']) {
                    this.outputsStats.removed += node.statistics['removed'];
                }
            } else {
                this.numProcessors++;
            }

            if (node.length) {
                this.numIndicators += node.length;
            }
        });
    }

    chartRangeChanged() {
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

        if (this.ntminersUpdatePromise) {
            this.$interval.cancel(this.ntminersUpdatePromise);
            this.updateNTMinersMetrics();
        }
        if (this.ntoutputsUpdatePromise) {
            this.$interval.cancel(this.ntoutputsUpdatePromise);
            this.updateNTOutputsMetrics();
        }
        if (this.minemeldMetricsUpdatePromise) {
            this.$interval.cancel(this.minemeldMetricsUpdatePromise);
            this.updateMinemeldMetrics();
        }
    }

    private destroy() {
        if (this.mmStatusListener) {
            this.mmStatusListener();
        }
        if (this.minemeldMetricsUpdatePromise) {
            this.$interval.cancel(this.minemeldMetricsUpdatePromise);
        }
        if (this.ntminersUpdatePromise) {
            this.$interval.cancel(this.ntminersUpdatePromise);
        }
        if (this.ntoutputsUpdatePromise) {
            this.$interval.cancel(this.ntoutputsUpdatePromise);
        }
    }

    private updateNTMinersMetrics() {
        var vm: any = this;

        vm.mmmetrics.getNodeType('miners', {
            dt: vm.chartDT,
            r: vm.chartDR
        })
        .then(
            function(result: any) {
                var metrics: IMetricsDictionary =  <IMetricsDictionary>{};
                var p: number;
                var tim: IMetric;
                var cmetric: string;

                metrics['length'] = new Array(<IMetric>{});
                metrics['ar'] = [<IMetric>{}, <IMetric>{}];

                for (p = 0; p < result.length; p++) {
                    cmetric = result[p].metric;

                    if (cmetric === 'length') {
                        metrics['length'][0].area = true;
                        metrics['length'][0].color = '#91B7C7';
                        metrics['length'][0].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
                        if (metrics['length'][0].values.length > 0) {
                            tim = metrics['length'][0];
                            if (tim.values[tim.values.length - 1].y == null) {
                                tim.values = tim.values.slice(0, -1);
                            }
                        }
                    } else if (cmetric === 'added') {
                        metrics['ar'][0].key = 'ADDED';
                        metrics['ar'][0].area = true;
                        metrics['ar'][0].color = '#586994';
                        metrics['ar'][0].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
                        if (metrics['ar'][0].values.length > 0) {
                            tim = metrics['ar'][0];
                            if (tim.values[tim.values.length - 1].y == null) {
                                tim.values = tim.values.slice(0, -1);
                            }
                        }
                    } else if (cmetric === 'aged_out') {
                        metrics['ar'][1].key = 'AGED_OUT';
                        metrics['ar'][1].area = true;
                        metrics['ar'][1].color = '#977390';
                        metrics['ar'][1].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
                        if (metrics['ar'][1].values.length > 0) {
                            tim = metrics['ar'][1];
                            if (tim.values[tim.values.length - 1].y == null) {
                                tim.values = tim.values.slice(0, -1);
                            }
                        }
                    }
                }

                vm.minersMetrics = metrics;
                if (vm.minersMetricsLengthAPI) {
                    vm.minersMetricsLengthAPI.updateWithData(
                        metrics['length']
                    );
                }
                if (vm.minersMetricsArAPI) {
                    vm.minersMetricsArAPI.updateWithData(
                        metrics['ar']
                    );
                }
            },
            function(error: any) {
                if (!error.cancelled) {
                    vm.toastr.error('ERROR RETRIEVING MINERS METRICS: ' + error.statusText);
                }

                throw error;
            }
        )
        .finally(function() {
            vm.ntminersUpdatePromise = vm.$interval(
                vm.updateNTMinersMetrics.bind(vm),
                vm.metricsUpdateInterval,
                1
            );
        });
    }

    private updateNTOutputsMetrics() {
        var vm: any = this;

        vm.mmmetrics.getNodeType('outputs', {
            dt: vm.chartDT,
            r: vm.chartDR
        })
        .then(
            function(result: any) {
                var metrics: IMetricsDictionary =  <IMetricsDictionary>{};
                var p: number;
                var tim: IMetric;
                var cmetric: string;

                metrics['length'] = new Array(<IMetric>{});
                metrics['ar'] = [<IMetric>{}, <IMetric>{}];

                for (p = 0; p < result.length; p++) {
                    cmetric = result[p].metric;

                    if (cmetric === 'length') {
                        metrics['length'][0].area = true;
                        metrics['length'][0].color = '#91B7C7';
                        metrics['length'][0].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
                        if (metrics['length'][0].values.length > 0) {
                            tim = metrics['length'][0];
                            if (tim.values[tim.values.length - 1].y == null) {
                                tim.values = tim.values.slice(0, -1);
                            }
                        }
                    } else if (cmetric === 'added') {
                        metrics['ar'][0].key = 'ADDED';
                        metrics['ar'][0].area = true;
                        metrics['ar'][0].color = '#586994';
                        metrics['ar'][0].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
                        if (metrics['ar'][0].values.length > 0) {
                            tim = metrics['ar'][0];
                            if (tim.values[tim.values.length - 1].y == null) {
                                tim.values = tim.values.slice(0, -1);
                            }
                        }
                    } else if (cmetric === 'removed') {
                        metrics['ar'][1].key = 'REMOVED';
                        metrics['ar'][1].area = true;
                        metrics['ar'][1].color = '#977390';
                        metrics['ar'][1].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
                        if (metrics['ar'][1].values.length > 0) {
                            tim = metrics['ar'][1];
                            if (tim.values[tim.values.length - 1].y == null) {
                                tim.values = tim.values.slice(0, -1);
                            }
                        }
                    }
                }

                vm.outputsMetrics = metrics;
                if (vm.outputsMetricsLengthAPI) {
                    vm.outputsMetricsLengthAPI.updateWithData(
                        metrics['length']
                    );
                }
                if (vm.outputsMetricsArAPI) {
                    vm.outputsMetricsArAPI.updateWithData(
                        metrics['ar']
                    );
                }
            },
            function(error: any) {
                if (!error.cancelled) {
                    vm.toastr.error('ERROR RETRIEVING OUTPUTS METRICS: ' + error.statusText);
                }

                throw error;
            }
        )
        .finally(function() {
            vm.ntoutputsUpdatePromise = vm.$interval(
                vm.updateNTOutputsMetrics.bind(vm),
                vm.metricsUpdateInterval,
                1
            );
        });
    }

    private updateMinemeldMetrics() {
        var vm: any = this;

        vm.mmmetrics.getMinemeld({
            dt: vm.chartDT,
            r: vm.chartDR
        })
        .then(
            function(result: any) {
                var metrics: IMetricsDictionary =  <IMetricsDictionary>{};
                var p: number;
                var cmetric: string;
                var tim: IMetric;

                metrics['length'] = new Array(<IMetric>{});

                for (p = 0; p < result.length; p++) {
                    cmetric = result[p].metric;

                    if (cmetric === 'length') {
                        metrics['length'][0].area = true;
                        metrics['length'][0].color = '#91B7C7';
                        metrics['length'][0].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
                        if (metrics['length'][0].values.length > 0) {
                            tim = metrics['length'][0];
                            if (tim.values[tim.values.length - 1].y == null) {
                                tim.values = tim.values.slice(0, -1);
                            }
                        }
                    }
                }

                vm.minemeldMetrics = metrics;
                if (vm.minemeldMetricsLengthAPI) {
                    vm.minemeldMetricsLengthAPI.updateWithData(
                        vm.minemeldMetrics['length']
                    );
                }
            },
            function(error: any) {
                if (!error.cancelled) {
                    vm.toastr.error('ERROR RETRIEVING MINEMELD METRICS: ' + error.statusText);
                }

                throw error;
            }
        )
        .finally(function() {
            vm.minemeldMetricsUpdatePromise = vm.$interval(
                vm.updateMinemeldMetrics.bind(vm),
                vm.metricsUpdateInterval,
                1
            );
        });
    }
}
