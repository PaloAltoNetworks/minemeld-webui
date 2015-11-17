/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldStatus } from  '../../app/services/status';
import { IMinemeldMetrics } from '../../app/services/metrics';

export class NodesController {
    mmstatus: IMinemeldStatus;
    mmmetrics: IMinemeldMetrics;
    moment: moment.MomentStatic;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    DTColumnBuilder: any;
    DTOptionsBuilder: any;

    dtNodes: any = {};
    dtColumns: any[];
    dtOptions: any;

    chartRange: string = '1d';
    chartDT: number = 86400;
    chartDR: number = 1800;

    updateNodesTablePromise: angular.IPromise<any>;
    updateNodesTableInterval: number = 5 * 60 * 1000;

    NODE_STATES: string[] = [
        'READY',
        'CONNECTED',
        'REBUILDING',
        'RESET',
        'INIT',
        'STARTED',
        'CHECKPOINT',
        'IDLE',
        'STOPPED'
    ];

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatus: IMinemeldStatus, MinemeldMetrics: IMinemeldMetrics,
        moment: moment.MomentStatic, $scope: angular.IScope, DTOptionsBuilder: any,
        DTColumnBuilder: any) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatus;
        this.mmmetrics = MinemeldMetrics;
        this.$interval = $interval;
        this.moment = moment;
        this.$scope = $scope;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;

        this.setupNodesTable();
        console.log(this.dtNodes);

        this.updateNodesTablePromise = this.$interval(
            this.updateNodesTable.bind(this),
            this.updateNodesTableInterval
        );

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    private updateNodesTable() {
        var vm: any = this;

        if (vm.dtNodes) {
            vm.dtNodes.reloadData(
                function() {
                    vm.updateNodesTablePromise = vm.$interval(
                        vm.updateNodesTable.bind(vm),
                        vm.updateNodesTableInterval
                    );
                },
                true
            );
        }
    }

    private setupNodesTable() {
        var vm: any = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            console.log('fn promise called');
            var $p: any = vm.mmstatus.getMinemeld()
                .catch(function(error: any) {
                    this.toastr.error('ERROR RETRIEVING MINEMELD STATUS:' + error.status);
                });

            return $p;
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('lengthMenu', [[50, -1], [50, 'All']])
        .withOption('createdRow', function(row: HTMLScriptElement, data: any) {
            var c: string;
            var fc: HTMLElement;

            if (data.inputs.length === 0) {
                c = 'nodes-dt-header-miner';
            } else if (data.output === false) {
                    c = 'nodes-dt-header-output';
            } else {
                    c = 'nodes-dt-header-processor';
            }

            fc = <HTMLElement>(row.childNodes[0]);
            fc.className += ' '+c;

            // $compile(angular.element(row))($scope);
            ;
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
            }).withOption('width', '5px'),
            this.DTColumnBuilder.newColumn('name').withTitle('NAME'),
            this.DTColumnBuilder.newColumn(null).withTitle('TYPE').renderWith(function(data: any, type: any, full: any) {
                var c: string;
                var v: string;

                console.log(data);
    
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
                var m: string = vm.NODE_STATES[data];
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
            this.DTColumnBuilder.newColumn('statistics').withTitle('ADD/REM').notSortable().renderWith(function(data: any, type, full) {
                var stats: string[] = ['<ul>'];
                var s: number;

                s = 0;
                if(data.added) {
                    s = data.added;
                }
                stats.push('<li>ADDED: ' + s+ '</li>');

                s = 0;
                if(data.removed) {
                    s = data.removed;
                }
                stats.push('<li>REMOVED: ' + s + '</li>');

                stats.push('</ul>');

                return stats.join('');
            }),
            this.DTColumnBuilder.newColumn('statistics').withTitle('UPDATES').notSortable().renderWith(function(data: any, type, full) {
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
                stats.push('<li>PROCESSED: ' + s+ '</li>');

                s = 0;
                if  (data['update.tx']) {
                    s = data['update.tx'];
                }
                stats.push('<li>TX: ' + s + '</li>');

                stats.push('</ul>');

                return stats.join('');
            }),
            this.DTColumnBuilder.newColumn('statistics').withTitle('WITHDRAWS').notSortable().renderWith(function(data: any, type, full) {
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
                stats.push('<li>PROCESSED: '  + s+ '</li>');

                s = 0;
                if (data['withdraw.tx']) {
                    s = data['withdraw.tx'];
                }
                stats.push('<li>TX: ' + s + '</li>');

                stats.push('</ul>');

                return stats.join('');
            })
        ];
    }

    private destroy() {
        if (this.updateNodesTablePromise) {
            this.$interval.cancel(this.updateNodesTablePromise);
        }
    }
}
