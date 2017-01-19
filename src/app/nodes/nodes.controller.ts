/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService, IMinemeldStatus, IMinemeldStatusNode } from  '../../app/services/status';
import { IThrottleService, IThrottled } from '../../app/services/throttle';
import { IMineMeldRunningConfigStatusService, IMineMeldRunningConfigStatus, IMinemeldResolvedConfigNode } from '../../app/services/runningconfigstatus';
import { IMinemeldPrototypeService } from '../../app/services/prototype';
import { IMineMeldCurrentUserService } from '../services/currentuser';

declare var he: any;

interface INodeStatus {
    status: IMinemeldStatusNode;
    nodeType?: string;
}

export class NodesController {
    mmstatus: IMinemeldStatusService;
    MineMeldRunningConfigStatusService: IMineMeldRunningConfigStatusService;
    MinemeldPrototypeService: IMinemeldPrototypeService;
    MineMeldCurrentUserService: IMineMeldCurrentUserService;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $q: angular.IQService;
    DTColumnBuilder: any;
    DTOptionsBuilder: any;

    mmStatusListener: () => void;
    mmRunningConfigListener: () => void;
    mmThrottledUpdate: IThrottled;

    dtNodes: any = {};
    dtColumns: any[];
    dtOptions: any;

    /* @ngInject */
    constructor(toastr: any,
        $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        MineMeldRunningConfigStatusService: IMineMeldRunningConfigStatusService,
        MinemeldPrototypeService: IMinemeldPrototypeService,
        MineMeldCurrentUserService: IMineMeldCurrentUserService,
        $scope: angular.IScope,
        DTOptionsBuilder: any,
        DTColumnBuilder: any,
        $compile: angular.ICompileService,
        $state: angular.ui.IStateService,
        $q: angular.IQService,
        $rootScope: angular.IRootScopeService,
        $timeout: angular.ITimeoutService,
        ThrottleService: IThrottleService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatusService;
        this.MineMeldRunningConfigStatusService = MineMeldRunningConfigStatusService;
        this.MinemeldPrototypeService = MinemeldPrototypeService;
        this.MineMeldCurrentUserService = MineMeldCurrentUserService;
        this.$interval = $interval;
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
        this.mmRunningConfigListener = $rootScope.$on(
            'mm-running-config-changed',
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

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(() => {
            return vm.MineMeldRunningConfigStatusService.getStatus().then((rconfig: IMineMeldRunningConfigStatus) => {
                return vm.mmstatus.getStatus().then((value: IMinemeldStatus) => {
                    var nodes: INodeStatus[] = [];

                    angular.forEach(value, (x: IMinemeldStatusNode) => {
                        var nt: string;
                        var rcnode: IMinemeldResolvedConfigNode;

                        rcnode = rconfig.nodes[x.name];

                        // running config doesn't contain the node (?) => set nodeType to LOADING
                        if (typeof rcnode === 'undefined') {
                            console.log('no proto ' + x.name + ' ' + rcnode);
                            nodes.push({
                                status: x,
                                nodeType: 'loading'
                            });
                            return;
                        }

                        nt = 'unknown';
                        if (rcnode.resolvedPrototype && rcnode.resolvedPrototype.node_type) {
                            nt = rcnode.resolvedPrototype.node_type;
                        }
                        nodes.push({ status: x, nodeType: nt });
                    });

                    return nodes;
                });
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
        .withOption('createdRow', function(row: HTMLScriptElement, data: INodeStatus) {
            var c: string;
            var fc: HTMLElement;
            var j: number;

            row.className += ' nodes-table-row';

            if (data.nodeType === 'miner') {
                c = 'nodes-dt-header-miner';
            } else if (data.nodeType === 'output') {
                c = 'nodes-dt-header-output';
            } else if (data.nodeType === 'processor') {
                c = 'nodes-dt-header-processor';
            } else {
                c = 'nodes-dt-header-default';
            }

            fc = <HTMLElement>(row.childNodes[0]);
            fc.className += ' ' + c;

            for (var j = 0; j < row.childNodes.length; j++) {
                fc = <HTMLElement>(row.childNodes[j]);
                fc.setAttribute('ng-click', 'nodes.go("' + data.status.name + '")');
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
            this.DTColumnBuilder.newColumn(null).withClass('nodes-dt-name').withTitle('NAME').renderWith(function(data: any, type: any, full: INodeStatus) {
                var result: string = he.encode(full.status.name, {strict: true});

                if (full.status.sub_state && full.status.sub_state === 'ERROR') {
                    result = result + ' <span';
                    if (full.status.sub_state_message) {
                        result = result + ' tooltip="' + he.encode(full.status.sub_state_message, {strict: true}) + '"';
                    }
                    result = result + 'class="text-danger glyphicon glyphicon-exclamation-sign"></span>';
                }

                return result;
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('TYPE').renderWith(function(data: any, type: any, full: INodeStatus) {
                var c: string;
                var v: string;

                if (full.nodeType === 'miner') {
                    c = 'nodes-label-miner';
                    v = 'MINER';
                } else if (full.nodeType === 'output') {
                    c = 'nodes-label-output';
                    v = 'OUTPUT';
                } else if (full.nodeType === 'processor') {
                    c = 'nodes-label-processor';
                    v = 'PROCESSOR';
                } else if (full.nodeType === 'loading') {
                    c = 'nodes-label-loading';
                    v = 'UNKNOWN';
                } else {
                    c = 'nodes-label-default';
                    v = 'UNKNOWN';
                }

                return '<span class="label ' + c + '">' + v + '</span>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('STATE').renderWith(function(data: any, type: any, full: INodeStatus) {
                var m: string = vm.mmstatus.NODE_STATES[full.status.state];
                var c: string;

                c = 'label-primary';
                if (m === 'STARTED') {
                    c = 'label-success';
                } else if (m === 'INIT') {
                    c = 'label-warning';
                }

                return '<span class="label ' + c + '">' + m + '</span>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('INDICATORS').renderWith(function(data: any, type: any, full: INodeStatus) {
                if (typeof full.status.length === 'undefined' || full.status.length === null) {
                    return '<span class="label nodes-label-loading"></span>';
                }

                return '' + full.status.length;
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('ADD/REM/AO').notSortable().renderWith(function(data: any, type: any, full: INodeStatus) {
                var stats: string[] = ['<ul>'];
                var s: number;

                data = full.status.statistics;

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
            this.DTColumnBuilder.newColumn(null).withTitle('UPDATES').notSortable().renderWith(function(data: any, type: any, full: INodeStatus) {
                var stats: string[] = ['<ul>'];
                var s: number;

                data = full.status.statistics;

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
            this.DTColumnBuilder.newColumn(null).withTitle('WITHDRAWS').notSortable().renderWith(function(data: any, type: any, full: INodeStatus) {
                var stats: string[] = ['<ul>'];
                var s: number;

                data = full.status.statistics;

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
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: INodeStatus) {
                return '<span class="nodes-table-chevron glyphicon glyphicon-chevron-right"></span>';
            }).withOption('width', '30px')
        ];
    }

    private destroy() {
        if (this.mmStatusListener) {
            this.mmStatusListener();
        }
        if (this.mmRunningConfigListener) {
            this.mmRunningConfigListener();
        }
        if (this.mmThrottledUpdate) {
            this.mmThrottledUpdate.cancel();
        }
    }
}
