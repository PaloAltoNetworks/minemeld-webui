/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldStatus } from  '../../app/services/status';
import { IMinemeldMetrics } from '../../app/services/metrics';

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
    mmstatus: IMinemeldStatus;
    mmmetrics: IMinemeldMetrics;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;

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
                tickFormat: (d, i) => { return Math.ceil(d); }
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
            getSize: function(d: any) { console.log(d); return 0.1; },
            useInteractiveGuideline: true,
            showXAxis: false,
            interactiveLayer: {
                tooltip: {
                    headerFormatter: function(d: any) { return this.moment.unix(d).fromNow().toUpperCase(); }
                }
            },
            showYAxis: false,
            yAxis: {
                tickFormat: (d, i) => { return Math.ceil(d); }
            },
            forceY: [0, 1],
            showLegend: false,
            interpolate: 'monotone'
        }
    };

    numIndicators: number = 0;

    minemeld: any;
    minemeldUpdateInterval: number = 60 * 1000;
    minemeldUpdatePromise: angular.IPromise<any>;

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
                MinemeldStatus: IMinemeldStatus, MinemeldMetrics: IMinemeldMetrics,
                moment: moment.MomentStatic, $scope: angular.IScope, $state: angular.ui.IStateService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatus;
        this.mmmetrics = MinemeldMetrics;
        this.$interval = $interval;
        this.moment = moment;
        this.$scope = $scope;

        this.updateMinemeld();
        this.updateNTMinersMetrics();
        this.updateNTOutputsMetrics();
        this.updateMinemeldMetrics();

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    private destroy() {
        if (this.minemeldUpdatePromise) {
            this.$interval.cancel(this.minemeldUpdatePromise);
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

    private updateMinemeld(): void {
        var vm: any = this;

        vm.mmstatus.getMinemeld()
        .then(
            function(result: any) {
                vm.minemeld = result;
                vm.updateMinemeldStats(vm);
            },
            function(error: any) {
                vm.toastr.error('ERROR RETRIEVING MINEMELD STATUS: '+error.status);
            }
        )
        .finally(function() {
            vm.minemeldUpdatePromise = vm.$interval(
                vm.updateMinemeld.bind(vm),
                vm.minemeldUpdateInterval,
                1
            );
        });
    }

    private updateMinemeldStats(vm: any) {
        var j: number;
        var e: any;

        vm.numMiners = 0;
        vm.numProcessors = 0;
        vm.numOutputs = 0;
        vm.numIndicators = 0;

        vm.minersStats.length = 0;
        vm.minersStats.added = 0;
        vm.minersStats.removed = 0;
        vm.minersStats.aged_out = 0;
        vm.outputsStats.length = 0;
        vm.outputsStats.added = 0;
        vm.outputsStats.removed = 0;

        for (j = 0; j < vm.minemeld.length; j++) {
            e = vm.minemeld[j];

            if (e.inputs.length === 0) {
                vm.numMiners++;

                if (e.length) {
                    vm.minersStats.length += e.length;
                }
                if (e.statistics && e.statistics.added) {
                    vm.minersStats.added += e.statistics.added;
                }
                if (e.statistics && e.statistics.removed) {
                    vm.minersStats.removed += e.statistics.removed;
                }
                if (e.statistics && e.statistics.aged_out) {
                    vm.minersStats.aged_out += e.statistics.aged_out;
                }
            } else if (!e.output) {
                vm.numOutputs++;

                if (e.length) {
                    vm.outputsStats.length += e.length;
                }
                if (e.statistics && e.statistics.added) {
                    vm.outputsStats.added += e.statistics.added;
                }
                if (e.statistics && e.statistics.removed) {
                    vm.outputsStats.removed += e.statistics.removed;
                }
            } else {
                vm.numProcessors++;
            }

            if (e.length) {
                vm.numIndicators += e.length;
            }
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
                    } else if (cmetric === 'added') {
                        metrics['ar'][0].key = 'ADDED';
                        metrics['ar'][0].area = true;
                        metrics['ar'][0].color = '#586994';
                        metrics['ar'][0].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
                    } else if (cmetric === 'aged_out') {
                        metrics['ar'][1].key = 'AGED_OUT';
                        metrics['ar'][1].area = true;
                        metrics['ar'][1].color = '#977390';
                        metrics['ar'][1].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
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
                vm.toastr.error('ERROR RETRIEVING MINERS METRICS: '+error.status);
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
                    } else if (cmetric === 'added') {
                        metrics['ar'][0].key = 'ADDED';
                        metrics['ar'][0].area = true;
                        metrics['ar'][0].color = '#586994';
                        metrics['ar'][0].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
                    } else if (cmetric === 'removed') {
                        metrics['ar'][1].key = 'REMOVED';
                        metrics['ar'][1].area = true;
                        metrics['ar'][1].color = '#977390';
                        metrics['ar'][1].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
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
                vm.toastr.error('ERROR RETRIEVING OUTPUTS METRICS: '+error.status);
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

        console.log('updateMinemeldMetrics');

        vm.mmmetrics.getMinemeld({
            dt: vm.chartDT,
            r: vm.chartDR
        })
        .then(
            function(result: any) {
                var metrics: IMetricsDictionary =  <IMetricsDictionary>{};
                var p: number;
                var cmetric: string;

                metrics['length'] = new Array(<IMetric>{});

                for (p = 0; p < result.length; p++) {
                    cmetric = result[p].metric;

                    if (cmetric === 'length') {
                        metrics['length'][0].area = true;
                        metrics['length'][0].color = '#91B7C7';
                        metrics['length'][0].values = result[p].values.map(function(e: number[]) {
                            return { x: e[0], y: e[1] };
                        });
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
                vm.toastr.error('ERROR RETRIEVING MINEMELD METRICS: '+error.status);
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
}
