/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IConfirmService } from '../../app/services/confirm';
import { YamlConfigureCommentController, YamlConfigureShareLevelController } from './yamlmodals.controller';

declare var he: any;

class NodeDetailYamlDomainIndicatorsController {
    MinemeldConfigService: IMinemeldConfigService;
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

    /** @ngInject */
    constructor(toastr: any, MinemeldConfigService: IMinemeldConfigService,
                $scope: angular.IScope, DTOptionsBuilder: any,
                DTColumnBuilder: any, $compile: angular.ICompileService,
                $modal: angular.ui.bootstrap.IModalService,
                ConfirmService: IConfirmService) {
        this.MinemeldConfigService = MinemeldConfigService;
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
            templateUrl: 'app/nodedetail/yamldomain.add.modal.html',
            controller: YamlDomainAddIndicatorController,
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
            'Are you sure you want to delete indicator ' + i + ' ?'
        );

        p.then((result: any) => {
            this.indicators.splice(inum, 1);
            this.saveIndicators().catch((error: any) => {
                this.toastr.error('ERROR REMOVING INDICATOR: ' + error.statusText);
                this.dtIndicators.reloadData();
            });
        });
    }

    reload() {
        this.dtIndicators.reloadData();
    }

    configureShareLevel(nodenum: number) {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/yaml.sharelevel.modal.html',
            controller: YamlConfigureShareLevelController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                indicator: () => {
                    return this.indicators[nodenum].indicator;
                },
                share_level: () => {
                    var sl: string;

                    sl = null;
                    if (this.indicators[nodenum].share_level) {
                        sl = this.indicators[nodenum].share_level;
                    }

                    return sl;
                }
            },
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            if (!result) {
                if (this.indicators[nodenum].share_level) {
                    delete this.indicators[nodenum].share_level;
                }
            } else {
                this.indicators[nodenum].share_level = result;
            }
            this.saveIndicators();
        });
    }

    configureComment(nodenum: number) {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/yaml.comment.modal.html',
            controller: YamlConfigureCommentController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                indicator: () => {
                    return this.indicators[nodenum].indicator;
                },
                comment: () => {
                    var c: string;

                    c = null;
                    if (this.indicators[nodenum].comment) {
                        c = this.indicators[nodenum].comment;
                    }
                    return c;
                }
            },
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            if (!result || result.length === 0) {
                if (this.indicators[nodenum].comment) {
                    delete this.indicators[nodenum].comment;
                }
            } else {
                this.indicators[nodenum].comment = result;
            }

            this.saveIndicators();
        });
    }

    private setupIndicatorsTable(): void {
        var vm: NodeDetailYamlDomainIndicatorsController = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            return vm.MinemeldConfigService.getDataFile(vm.cfd_indicators).then((result: any) => {
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
        .withOption('stateSave', true)
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('deferRender', true)
        .withOption('lengthMenu', [[50, 200, -1], [50, 200, 'All']])
        .withOption('createdRow', function(row: HTMLScriptElement, data: any, index: any) {
            var fc: HTMLElement;

            row.className += ' config-table-row';

            fc = <HTMLElement>(row.childNodes[1]);
            fc.setAttribute('ng-click', 'vm.configureShareLevel(' + index + ')');
            fc.className += ' config-table-clickable';

            fc = <HTMLElement>(row.childNodes[2]);
            fc.setAttribute('ng-click', 'vm.configureComment(' + index + ')');
            fc.className += ' config-table-clickable';

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
            this.DTColumnBuilder.newColumn('indicator').withTitle('INDICATOR').withOption('width', '25%').renderWith(function(data: any, type: any, full: any) {
                if (data) {
                    return he.encode(data, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn('share_level').withTitle('SHARE LEVEL')
                .withOption('defaultContent', ' ').withOption('width', '130px').renderWith(function(data: any, type: any, full: any) {
                    var c: string;
                    var v: string;

                    if (data === 'yellow') {
                        c = 'label-warning';
                        v = 'YELLOW';
                    } else if (data === 'red') {
                        c = 'label-danger';
                        v = 'RED';
                    } else if (data === 'green') {
                        c = 'label-success';
                        v = 'GREEN';
                    } else {
                        return '';
                    }

                    return '<span class="label ' + c + '">' + v + '</span>';
            }),
            this.DTColumnBuilder.newColumn('comment').withTitle('COMMENT').withOption('defaultContent', ' ').renderWith(function(data: any, type: any, full: any) {
                if (data) {
                    return he.encode(data, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<span class="config-table-icon glyphicon glyphicon-remove"></span>';
            }).withOption('width', '30px')
        ];
    }

    private saveIndicators(): angular.IPromise<any> {
        return this.MinemeldConfigService
            .saveDataFile(this.cfd_indicators, this.indicators, this.nodename)
            .then((result: any) => {
                this.toastr.success('CHANGES SAVED');
                this.dtIndicators.reloadData();
            });
    }
}

class YamlDomainAddIndicatorController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    comment: string;
    indicator: string;
    share_level: string = 'red';

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance) {
        this.$modalInstance = $modalInstance;
    }

    save() {
        var result: any = {};

        result.indicator = this.indicator;
        if (this.share_level) {
            result.share_level = this.share_level;
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

    private validateIndicator(): boolean {
        return true;
    }
};

/** @ngInject */
function yamlDomainRouterConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.yamldomainindicators', {
            templateUrl: 'app/nodedetail/yamldomain.indicators.html',
            controller: NodeDetailYamlDomainIndicatorsController,
            controllerAs: 'vm'
        })
        ;
}

/** @ngInject */
function yamlDomainRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.local.YamlDomainFT', {
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
            state: 'nodedetail.yamldomainindicators',
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

console.log('Loading yamldomain');
angular.module('minemeldWebui')
    .config(yamlDomainRouterConfig)
    .run(yamlDomainRegisterClass)
    ;
