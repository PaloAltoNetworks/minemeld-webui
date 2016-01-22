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

    dtDevices: any = {};
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
}

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
