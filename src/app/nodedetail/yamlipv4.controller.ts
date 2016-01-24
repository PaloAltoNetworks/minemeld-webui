/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { NodeDetailStatsController } from './nodedetail.stats.controller';
import { IConfirmService } from '../../app/services/confirm';

interface IYamlIPv4Indicator {
    indicator: string;
    direction: string;
    comment: string;
}

class NodeDetailYamlIPv4IndicatorsController {
    MinemeldConfig: IMinemeldConfigService;
    toastr: any;
    $scope: angular.IScope;
    DTOptionsBuilder: any;
    DTColumnBuilder: any;
    $compile: angular.ICompileService;
    $modal: angular.ui.bootstrap.IModalService;
    ConfirmService: IConfirmService;

    changed: boolean = false;
    nodename: string;
    cfd_indicators: string;

    dtIndicators: any = {};
    dtColumns: any[];
    dtOptions: any;

    indicators: any[];

    /** @ngInject **/
    constructor(toastr: any, MinemeldConfig: IMinemeldConfigService,
                $scope: angular.IScope, DTOptionsBuilder: any,
                DTColumnBuilder: any, $compile: angular.ICompileService,
                $modal: angular.ui.bootstrap.IModalService,
                ConfirmService: IConfirmService) {
        this.MinemeldConfig = MinemeldConfig;
        this.$scope = $scope;
        this.toastr = toastr;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.$compile = $compile;
        this.$modal = $modal;
        this.ConfirmService = ConfirmService;
        this.nodename = $scope.$parent['nodedetail']['nodename'];
        this.cfd_indicators = this.nodename + '_indicators';
        this.setupIndicatorsTable();
    }

    addIndicator(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/yamlipv4.add.modal.html',
            controller: YamlIPv4AddIndicatorController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            this.indicators.push(result);
            this.saveIndicators().catch((error: any) => {
                this.toastr.error('ERROR ADDING INDICATOR: ' + error.statusText);
                this.dtIndicators.reloadData();
            });
        });
    }

    removeIndicator(inum: number) {
        var p: angular.IPromise<any>;
        var i: string;

        i = this.indicators[inum].indicator;

        p = this.ConfirmService.show(
            'DELETE INDICATOR',
            'Are you sure you want to delete indicator '+i+' ?'
        );

        p.then((result: any) => {
            this.indicators.splice(inum, 1);
            this.saveIndicators().catch((error: any) => {
                this.toastr.error('ERROR REMOVING INDICATOR: ' + error.statusText);
                this.dtIndicators.reloadData();
            });
        });
    }

    private setupIndicatorsTable(): void {
        var vm: NodeDetailYamlIPv4IndicatorsController = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            return vm.MinemeldConfig.getDataFile(vm.cfd_indicators).then((result: any) => {
                vm.changed = false;

                if (result === null) {
                    return [];
                }

                return result;
            }, (error: any) => {
                vm.toastr.error('ERROR LOADING INDICATORS LIST: ' + error.statusText);
                throw error;
            })
            .then((result: any) => {
                vm.indicators = result;

                return result;
            })
            ;
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('lengthMenu', [[50, 200, -1], [50, 200, 'All']])
        .withOption('createdRow', function(row: HTMLScriptElement, data: any, index: any) {
            var fc: HTMLElement;

            row.className += ' config-table-row';

            fc = <HTMLElement>(row.childNodes[3]);
            fc.setAttribute('ng-click', 'vm.removeIndicator(' + index + ')');
            fc.style.textAlign = 'center';
            fc.style.verticalAlign = 'middle';
            fc.setAttribute('tooltip', 'delete indicator');
            fc.setAttribute('tooltip-popup-delay', '500');
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
            this.DTColumnBuilder.newColumn('indicator').withTitle('INDICATOR').withOption('width', '30%'),
            this.DTColumnBuilder.newColumn('direction').withTitle('DIRECTION').withOption('defaultContent', ' ').withOption('width', '10%'),
            this.DTColumnBuilder.newColumn('comment').withTitle('COMMENT').withOption('defaultContent', ' '),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<span class="config-table-icon glyphicon glyphicon-remove"></span>';
            }).withOption('width', '30px')
        ];
    }

    private saveIndicators(): angular.IPromise<any> {
        return this.MinemeldConfig.saveDataFile(this.cfd_indicators, this.indicators)
            .then((result: any) => {
                this.dtIndicators.reloadData();
            });
    }
}

class YamlIPv4AddIndicatorController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    comment: string;
    indicator: string;
    direction: string;

    availableDirections: any = [
        { value: 'inbound' },
        { value: 'outbound' }
    ];

    /** @ngInject **/
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance) {
        this.$modalInstance = $modalInstance;
    }

    save() {
        var result: any = {};

        result.indicator = this.indicator;
        if ((this.direction == 'inbound') || (this.direction == 'outbound')) {
            result.direction = this.direction;
        }
        if (this.comment) {
            result.comment = this.comment;
        }

        this.$modalInstance.close(result);
    }

    valid(): boolean {
        if (!this.indicator) {
            return false;
        }

        if (!this.validateIndicator()) {
            angular.element('#fgIndicator').addClass('has-error');
            return false;
        }
        angular.element('#fgIndicator').removeClass('has-error');

        return true;
    }

    cancel() {
        this.$modalInstance.dismiss();
    }

    private validateIPv4(addr: string): number {
        var toks: string[];
        var j: number;
        var tn: number;
        var result: number;

        toks = addr.split('.');
        if (toks.length != 4) {
            return -1;
        }

        result = 0;
        for (j = toks.length-1; j >= 0; j--) {
            tn = parseInt(toks[j], 10);
            if (isNaN(tn)) {
                return -1;
            }
            if ((tn < 0) || (tn > 255)) {
                return -1;
            }

            result += tn * (1 << 8*j);
        }

        return result;
    }

    private validateIndicator(): boolean {
        var addresses: string[];
        var toks: string[];
        var nmbits: number;
        var t0, t1: number;

        addresses = this.indicator.split('-');
        if (addresses.length > 2) {
            return false;
        }

        if (addresses.length == 2) {
            t0 = this.validateIPv4(addresses[0]);
            if (t0 < 0) {
                return false;
            }

            t1 = this.validateIPv4(addresses[1]);
            if (t1 < 0) {
                return false;
            }

            return (t0 <= t1);
        }

        toks = addresses[0].split('/');
        if (toks.length > 2) {
            return false;
        }

        if (toks.length == 2) {
            nmbits = parseInt(toks[1], 10);
            if (isNaN(nmbits)) {
                return false;
            }
            if ((nmbits < 0) || (nmbits > 32)) {
                return false;
            }
        }

        return (this.validateIPv4(toks[0]) > 0);
    }
};

/** @ngInject */
function yamlIPv4RouterConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.yamlipv4indicators', {
            templateUrl: 'app/nodedetail/yamlipv4.indicators.html',
            controller: NodeDetailYamlIPv4IndicatorsController,
            controllerAs: 'vm'
        })
        ;
}

/** @ngInject **/
function yamlIPv4RegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.local.YamlIPv4FT', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.info',
            active: false
        },
        {
            icon: 'fa fa-area-chart',
            tooltip: 'STATS',
            state: 'nodedetail.stats',
            active: false
        },
        {
            icon: 'fa fa-list-alt',
            tooltip: 'INDICATORS',
            state: 'nodedetail.yamlipv4indicators',
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

console.log("Loading yamlipv4");
angular.module('minemeldWebui')
    .config(yamlIPv4RouterConfig)
    .run(yamlIPv4RegisterClass)
    ;
