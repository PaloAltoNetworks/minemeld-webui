/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService, IMinemeldStatus } from  '../../app/services/status';
import { IMinemeldMetricsService } from '../../app/services/metrics';
import { IThrottleService, IThrottled } from '../../app/services/throttle';

declare var he: any;

export class NodesController {
    mmstatus: IMinemeldStatusService;
    mmmetrics: IMinemeldMetricsService;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $q: angular.IQService;
    DTColumnBuilder: any;
    DTOptionsBuilder: any;

    mmStatusListener: any;
    mmThrottledUpdate: IThrottled;

    dtNodes: any = {};
    dtColumns: any[];
    dtOptions: any;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService, MinemeldMetricsService: IMinemeldMetricsService,
        moment: moment.MomentStatic, $scope: angular.IScope, DTOptionsBuilder: any,
        DTColumnBuilder: any, $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $q: angular.IQService, $rootScope: angular.IRootScopeService, $timeout: angular.ITimeoutService,
        ThrottleService: IThrottleService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatusService;
        this.mmmetrics = MinemeldMetricsService;
        this.$interval = $interval;
        this.moment = moment;
        this.$scope = $scope;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.$compile = $compile;
        this.$state = $state;
        this.$q = $q;

        this.setupNodesTable();

        this.mmThrottledUpdate = ThrottleService.throttle(this.updateNodesTable.bind(this), 5000);
        this.mmStatusListener = $rootScope.$on(
            'mm-status-changed',
            this.mmThrottledUpdate
        );

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    public go(newstate: string) {
        this.$state.transitionTo('nodedetail', { nodename: newstate });
    }

    private updateNodesTable() {
        var vm: any = this;
        var tbody: JQuery;

        if (vm.dtNodes && vm.dtNodes.reloadData) {
            tbody = angular.element('#nodesTable > tbody').children().unbind();

            vm.dtNodes.reloadData(
                () => { tbody.remove(); tbody = null; },
                false
            );
        }
    }

    private setupNodesTable() {
        var vm: NodesController = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            return vm.mmstatus.getStatus().then((value: IMinemeldStatus) => {
                var result: any[] = [];

                angular.forEach(value, (x: any) => {
                    result.push(x);
                });

                return result;
            });
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('order', [[2, 'asc'], [1, 'asc']])
        .withOption('aaSorting', [])
        .withOption('stateSave', true)
        .withOption('aaSortingFixed', [])
        .withOption('bDeferRender', true)
        .withOption('redraw', true)
        .withOption('lengthMenu', [[50, -1], [50, 'All']])
        .withOption('pageLength', -1)
        .withOption('createdRow', function(row: HTMLScriptElement, data: any) {
            var c: string;
            var fc: HTMLElement;
            var j: number;

            row.className += ' nodes-table-row';

            if (data.inputs.length === 0) {
                c = 'nodes-dt-header-miner';
            } else if (data.output === false) {
                    c = 'nodes-dt-header-output';
            } else {
                    c = 'nodes-dt-header-processor';
            }

            fc = <HTMLElement>(row.childNodes[0]);
            fc.className += ' ' + c;

            for (var j = 0; j < row.childNodes.length; j++) {
                fc = <HTMLElement>(row.childNodes[j]);
                fc.setAttribute('ng-click', 'nodes.go("' + data.name + '")');
            }

            vm.$compile(angular.element(row).contents())(vm.$scope);
        })
        .withLanguage({
            'oPaginate': {
                'sNext': '>',
                'sPrevious': '<'
            }
        })
        ;

        this.dtColumns = [
            this.DTColumnBuilder.newColumn(null).withTitle('').renderWith(function(data: any, type: any, full: any) {
                return '';
            }).withOption('width', '5px').notSortable(),
            this.DTColumnBuilder.newColumn('name').withClass('nodes-dt-name').withTitle('NAME').renderWith(function(data: any, type: any, full: any) {
                var result: string = he.encode(data, {strict: true});

                if (full.sub_state && full.sub_state === 'ERROR') {
                    result = result + ' <span';
                    if (full.sub_state_message) {
                        result = result + ' tooltip="' + full.sub_state_message +'"';
                    }
                    result = result + 'class="text-danger glyphicon glyphicon-exclamation-sign"></span>';
                }

                return result;
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('POSITION').renderWith(function(data: any, type: any, full: any) {
                var c: string;
                var v: string;

                if (full.inputs.length === 0) {
                    c = 'nodes-label-miner';
                    v = 'MINER';
                } else if (full.output === false) {
                    c = 'nodes-label-output';
                    v = 'OUTPUT';
                } else {
                    c = 'nodes-label-processor';
                    v = 'PROCESSOR';
                }

                return '<span class="label ' + c + '">' + v + '</span>';
            }),
            this.DTColumnBuilder.newColumn('state').withTitle('STATE').renderWith(function(data: any, type: any, full: any) {
                var m: string = vm.mmstatus.NODE_STATES[data];
                var c: string;

                c = 'label-primary';
                if (m === 'STARTED') {
                    c = 'label-success';
                } else if (m === 'INIT') {
                    c = 'label-warning';
                }

                return '<span class="label ' + c + '">' + m + '</span>';
            }),
            this.DTColumnBuilder.newColumn('length').withTitle('INDICATORS'),
            this.DTColumnBuilder.newColumn('statistics').withTitle('ADD/REM/AO').notSortable().renderWith(function(data: any, type: any, full: any) {
                var stats: string[] = ['<ul>'];
                var s: number;

                s = 0;
                if (data.added) {
                    s = data.added;
                }
                stats.push('<li>ADDED: ' + s + '</li>');

                s  = 0;
                if (data.aged_out) {
                    s = data.aged_out;
                    stats.push('<li>AGED OUT: ' + s + '</li>');
                } else {
                    if (data.removed) {
                        s = data.removed;
                    }
                    stats.push('<li>REMOVED: ' + s + '</li>');
                }

                stats.push('</ul>');

                return stats.join('');
            }),
            this.DTColumnBuilder.newColumn('statistics').withTitle('UPDATES').notSortable().renderWith(function(data: any, type: any, full: any) {
                var stats: string[] = ['<ul>'];
                var s: number;

                s = 0;
                if (data['update.rx']) {
                    s = data['update.rx'];
                }
                stats.push('<li>RX: ' + s + '</li>');

                s = 0;
                if (data['update.processed']) {
                    s = data['update.processed'];
                }
                stats.push('<li>PROCESSED: ' + s + '</li>');

                s = 0;
                if  (data['update.tx']) {
                    s = data['update.tx'];
                }
                stats.push('<li>TX: ' + s + '</li>');

                stats.push('</ul>');

                return stats.join('');
            }),
            this.DTColumnBuilder.newColumn('statistics').withTitle('WITHDRAWS').notSortable().renderWith(function(data: any, type: any, full: any) {
                var stats: string[] = ['<ul>'];
                var s: number;

                s = 0;
                if (data['withdraw.rx']) {
                    s = data['withdraw.rx'];
                }
                stats.push('<li>RX: ' + s + '</li>');

                s = 0;
                if (data['withdraw.processed']) {
                    s = data['withdraw.processed'];
                }
                stats.push('<li>PROCESSED: '  + s + '</li>');

                s = 0;
                if (data['withdraw.tx']) {
                    s = data['withdraw.tx'];
                }
                stats.push('<li>TX: ' + s + '</li>');

                stats.push('</ul>');

                return stats.join('');
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<span class="nodes-table-chevron glyphicon glyphicon-chevron-right"></span>';
            }).withOption('width', '30px')
        ];
    }

    private destroy() {
        this.mmStatusListener();
        this.mmThrottledUpdate.cancel();
    }
}
