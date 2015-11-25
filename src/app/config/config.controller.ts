/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldConfigService, IMinemeldConfigInfo, IMinemeldConfigNode } from  '../../app/services/config';

export class ConfigController {
    toastr: any;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $q: angular.IQService;
    $modal: angular.ui.bootstrap.IModalService;
    DTColumnBuilder: any;
    DTOptionsBuilder: any;
    MinemeldConfig: IMinemeldConfigService;

    dtNodes: any = {};
    dtColumns: any[];
    dtOptions: any;

    configInfo: IMinemeldConfigInfo;
    nodesConfig: IMinemeldConfigNode[];

    /* @ngInject */
    constructor(toastr: any, $scope: angular.IScope, DTOptionsBuilder: any,
                DTColumnBuilder: any, $compile: angular.ICompileService,
                MinemeldConfig: IMinemeldConfigService,
                $state: angular.ui.IStateService, $q: angular.IQService,
                $modal: angular.ui.bootstrap.IModalService) {
        this.toastr = toastr;
        this.$scope = $scope;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.$compile = $compile;
        this.$state = $state;
        this.$q = $q;
        this.$modal = $modal;
        this.MinemeldConfig = MinemeldConfig;

        this.setupNodesTable();
    }

    reload() {
        this.MinemeldConfig.reload().then((result: any) => {
            this.$state.go(this.$state.current.name, {}, {reload: true});
        }, (error: any) => {
            this.toastr.error("ERROR RELOADING CONFIG: " + error.statusText);
        });
    }

    configureNode(nodenum: number) {
        this.$modal.open({
            templateUrl: 'app/config/nodeconfig.modal.html',
            controller: NodeconfigController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                nodenum: () => { return nodenum }
            },
            backdrop: 'static',
            animation: false
        });
    }

    private setupNodesTable() {
        var vm: any = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            return vm.getConfig();
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('lengthMenu', [[50, -1], [50, 'All']])
        .withOption('createdRow', function(row: HTMLScriptElement, data: any, index: any) {
            var c: string;
            var fc: HTMLElement;
            var j: number;

            row.className += ' config-table-row';

            if ((!data.properties.inputs) || (data.properties.inputs.length === 0)) {
                c = 'nodes-dt-header-miner';
            } else if (data.properties.output === false) {
                    c = 'nodes-dt-header-output';
            } else {
                    c = 'nodes-dt-header-processor';
            }

            fc = <HTMLElement>(row.childNodes[0]);
            fc.className += ' '+c;

            fc = <HTMLElement>(row.childNodes[4]);
            fc.setAttribute('ng-click', 'vm.configureInputs(' + index + ')');
            fc.className += ' config-table-clickable';

            fc = <HTMLElement>(row.childNodes[5]);
            fc.setAttribute('ng-click', 'vm.configureOutput(' + index + ')');
            fc.className += ' config-table-clickable';

            fc = <HTMLElement>(row.childNodes[6]);
            fc.setAttribute('ng-click', 'vm.removeNode(' + index + ')');
            fc.className += ' config-table-clickable';

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
            }).withOption('width', '5px'),
            this.DTColumnBuilder.newColumn('name').withTitle('NAME'),
            this.DTColumnBuilder.newColumn(null).withTitle('TYPE').renderWith(function(data: any, type: any, full: any) {
                var c: string;
                var v: string;
    
                if ((!full.properties.inputs) || (full.properties.inputs.length === 0)) {
                    c = 'nodes-label-miner';
                    v = 'MINER';
                } else if (full.properties.output === false) {
                    c = 'nodes-label-output';
                    v = 'OUTPUT';
                } else {
                    c = 'nodes-label-processor';
                    v = 'PROCESSOR';
                }

                return '<span class="label ' + c + '">' + v + '</span>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('PROTOTYPE').renderWith(function(data: any, type: any, full: any) {
                if (full.properties.prototype) {
                    return full.properties.prototype;
                }

                return '<span class="config-none">None</span>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('INPUTS').renderWith(function(data: any, type: any, full: any) {
                if (full.properties.inputs) {
                    return full.properties.inputs;
                }

                return '<span class="config-none">None</span>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('OUTPUT').renderWith(function(data: any, type: any, full: any) {
                var v: boolean = true;
                var c: string;
                var m: string;

                if (full.properties.output === false) {
                    v = full.properties.output;
                }

                c = 'label-default';
                m = 'DISABLED';
                if (v) {
                    c = 'label-success';
                    m = 'ENABLED';
                }

                return '<span class="label ' + c + '">' + m + '</span>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type, full) {
                return '<span class="config-table-icon glyphicon glyphicon-trash"></span>';
            }).withOption('width', '30px')
        ];
    }

    private getConfig(): angular.IPromise<any> {
        if (this.MinemeldConfig.configInfo) {
            var $p: angular.IDeferred<any> = this.$q.defer();

            this.configInfo = this.MinemeldConfig.configInfo;
            this.nodesConfig = this.MinemeldConfig.nodesConfig;

            $p.resolve(this.MinemeldConfig.nodesConfig);

            return $p.promise;
        }

        return this.refreshConfig();
    }

    private refreshConfig(): angular.IPromise<any> {
        return this.MinemeldConfig.refresh().then((result: any) => {
            this.configInfo = this.MinemeldConfig.configInfo;
            this.nodesConfig = this.MinemeldConfig.nodesConfig;

            console.log(result);

            return result;
        }, (error: any) => {
            this.toastr.error('ERROR RELOADING CONFIG: ' + error.statusText);

            this.configInfo = undefined;
            this.nodesConfig = [];

            return this.nodesConfig;
        });
    }
}

export class NodeconfigController {
    nodenum: number;
    MinemeldConfig: IMinemeldConfigService;
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    nodeConfig: IMinemeldConfigNode;

    /* @ngInject */
    constructor(MinemeldConfig: IMinemeldConfigService,
                $modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                nodenum: number) {
        this.nodenum = nodenum;
        this.MinemeldConfig = MinemeldConfig;
        this.$modalInstance = $modalInstance;
        this.nodeConfig = this.MinemeldConfig.nodesConfig[nodenum];
    }

    ok() {
        this.$modalInstance.close('ok');
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}
