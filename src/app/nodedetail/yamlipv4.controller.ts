/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IConfirmService } from '../../app/services/confirm';
import { YamlConfigureCommentController, YamlConfigureShareLevelController } from './yamlmodals.controller';

declare var he: any;

class ConfigureDirectionController {
    origDirection: string;
    indicator: string;

    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    direction: string;
    availableDirections: any = [
        { value: 'inbound' },
        { value: 'outbound' }
    ];

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                indicator: string, direction: string) {
        this.$modalInstance = $modalInstance;
        this.origDirection = direction;
        this.direction = this.origDirection;
        this.indicator = indicator;
    }

    save() {
        this.$modalInstance.close(this.direction);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}

class NodeDetailYamlIPv4IndicatorsController {
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

    configureDirection(nodenum: number) {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/yamlipv4.direction.modal.html',
            controller: ConfigureDirectionController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                indicator: () => {
                    return this.indicators[nodenum].indicator;
                },
                direction: () => {
                    var d: string;

                    d = null;
                    if (this.indicators[nodenum].direction) {
                        d = this.indicators[nodenum].direction;
                    }

                    return d;
                }
            },
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            if (!result) {
                if (this.indicators[nodenum].direction) {
                    delete this.indicators[nodenum].direction;
                }
            } else {
                this.indicators[nodenum].direction = result;
            }

            this.saveIndicators();
        });
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
        var vm: NodeDetailYamlIPv4IndicatorsController = this;

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
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('stateSave', true)
        .withOption('deferRender', true)
        .withOption('lengthMenu', [[50, 200, -1], [50, 200, 'All']])
        .withOption('createdRow', function(row: HTMLScriptElement, data: any, index: any) {
            var fc: HTMLElement;

            row.className += ' config-table-row';

            fc = <HTMLElement>(row.childNodes[1]);
            fc.setAttribute('ng-click', 'vm.configureDirection(' + index + ')');
            fc.className += ' config-table-clickable';

            fc = <HTMLElement>(row.childNodes[2]);
            fc.setAttribute('ng-click', 'vm.configureShareLevel(' + index + ')');
            fc.className += ' config-table-clickable';

            fc = <HTMLElement>(row.childNodes[3]);
            fc.setAttribute('ng-click', 'vm.configureComment(' + index + ')');
            fc.className += ' config-table-clickable';

            fc = <HTMLElement>(row.childNodes[4]);
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
            this.DTColumnBuilder.newColumn('direction').withTitle('DIRECTION').withOption('defaultContent', ' ')
                .withOption('width', '130px').renderWith(function(data: any, type: any, full: any) {
                    var c: string;
                    var v: string;

                    if (data === 'inbound') {
                        c = 'label-info';
                        v = 'INBOUND';
                    } else if (data === 'outbound') {
                        c = 'label-primary';
                        v = 'OUTBOUND';
                    } else {
                        return '';
                    }

                    return '<span class="label ' + c + '">' + v + '</span>';
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

class YamlIPv4AddIndicatorController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    comment: string;
    indicator: string;
    direction: string;
    share_level: string = 'red';

    availableDirections: any = [
        { value: 'inbound' },
        { value: 'outbound' }
    ];

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
        if ((this.direction === 'inbound') || (this.direction === 'outbound')) {
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
        if (toks.length !== 4) {
            return -1;
        }

        result = 0;
        for (j = toks.length - 1; j >= 0; j--) {
            tn = parseInt(toks[j], 10);
            if (isNaN(tn)) {
                return -1;
            }
            if ((tn < 0) || (tn > 255)) {
                return -1;
            }

            result += tn * (1 << 8 * j);
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

        if (addresses.length === 2) {
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

        if (toks.length === 2) {
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

/** @ngInject */
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

console.log('Loading yamlipv4');
angular.module('minemeldWebui')
    .config(yamlIPv4RouterConfig)
    .run(yamlIPv4RegisterClass)
    ;
