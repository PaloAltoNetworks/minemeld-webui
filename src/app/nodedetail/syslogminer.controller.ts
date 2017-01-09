/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IConfirmService } from '../../app/services/confirm';
import { IMinemeldValidateService } from '../../app/services/validate';
import { IMinemeldStatusService, IMinemeldStatusNode, IMinemeldStatus } from '../../app/services/status';
import { IThrottled, IThrottleService } from '../../app/services/throttle';
import { NodeDetailStatsController } from './nodedetail.stats.controller';

declare var he: any;
declare var jsyaml: any;

class SyslogMinerStatsController extends NodeDetailStatsController {
    protected updateMetricsNames() {
        this.metrics_names = Object.keys(this.metrics);
        angular.forEach(Object.keys(this.nodeState.statistics), (key: string) => {
            if (this.metrics_names.indexOf(key) === -1) {
                this.metrics_names.push(key);
            }
        });
        this.metrics_names = this.metrics_names.filter((metric: string) => {
            if (metric.indexOf('rule.') === 0) {
                return false;
            }

            return true;
        });
    }
}

class SyslogMinerRulesController {
    MinemeldConfigService: IMinemeldConfigService;
    toastr: any;
    DTOptionsBuilder: any;
    DTColumnBuilder: any;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $modal: angular.ui.bootstrap.IModalService;
    ConfirmService: IConfirmService;
    MinemeldStatusService: IMinemeldStatusService;
    $interval: angular.IIntervalService;

    dtOptions: any;
    dtColumns: any;
    dtRules: any = {};

    changed: boolean = false;
    cfd_rules_list: string;
    rules_list: any[];
    nodename: string;

    mmStatusListener: any;
    mmThrottledUpdate: IThrottled;

    /** @ngInject */
    constructor(toastr: any, MinemeldConfigService: IMinemeldConfigService,
                DTOptionsBuilder: any, DTColumnBuilder: any,
                $compile: angular.ICompileService, $scope: angular.IScope,
                $modal: angular.ui.bootstrap.IModalService,
                MinemeldStatusService: IMinemeldStatusService, $interval: angular.IIntervalService,
                ConfirmService: IConfirmService,
                $rootScope: angular.IRootScopeService,
                ThrottleService: IThrottleService) {
        this.MinemeldConfigService = MinemeldConfigService;
        this.toastr = toastr;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.$compile = $compile;
        this.$scope = $scope;
        this.$modal = $modal;
        this.ConfirmService = ConfirmService;
        this.MinemeldStatusService = MinemeldStatusService;
        this.$interval = $interval;

        this.nodename = $scope.$parent['nodedetail']['nodename'];
        this.cfd_rules_list = this.nodename + '_rules';

        this.setupRulesTable();

        this.mmThrottledUpdate = ThrottleService.throttle(
            this.updateMinemeldStatus.bind(this),
            500
        );
        this.mmStatusListener = $rootScope.$on(
            'mm-status-changed',
            this.mmThrottledUpdate
        );

        this.$scope.$on('$destroy', () => { this.destroy(); });
    }

    reload(): void {
        this.dtRules.reloadData();
    }

    addRule(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/syslogminer.edit.modal.html',
            controller: SyslogMinerEditRuleController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            size: 'lg',
            resolve: {
                title: () => { return 'ADD RULE'; },
                rule: () => { return undefined; },
                rule_names: () => { return this.rules_list.map((x: any) => { return x.name.toUpperCase(); }); }
            }
        });

        mi.result.then((result: any) => {
            this.rules_list.push(result);
            this.saveRulesList().catch((error: any) => {
                    this.toastr.error('ERROR ADDING RULE: ' + error.statusText);
                    this.dtRules.reloadData();
                });
        });
    }

    editRule(rulen: number): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/syslogminer.edit.modal.html',
            controller: SyslogMinerEditRuleController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            size: 'lg',
            resolve: {
                title: () => { return 'EDIT RULE'; },
                rule: () => { return this.rules_list[rulen]; },
                rule_names: () => {
                    return this.rules_list
                        .map((x: any) => { return x.name.toUpperCase(); })
                        .filter((x: any) => { return x !== this.rules_list[rulen].name.toUpperCase(); });
                }
            }
        });

        mi.result.then((result: any) => {
            var oldname: string = this.rules_list[rulen].name;
            var metric: string;

            this.rules_list[rulen] = result;
            this.saveRulesList().catch((error: any) => {
                    this.toastr.error('ERROR ADDING RULE: ' + error.statusText);
                    this.dtRules.reloadData();
                });

            if (oldname !== result.name) {
                metric = name.replace(/[^a-zA-Z0-9_-]/g, '_');
                angular.element('#' + metric).attr('id', metric);
                this.updateMinemeldStatus();
            }
        });
    }

    removeRule(rulen: number) {
        var p: angular.IPromise<any>;
        var n: string;

        n = this.rules_list[rulen].name;

        p = this.ConfirmService.show(
            'DELETE INDICATOR',
            'Are you sure you want to delete indicator ' + n + ' ?'
        );

        p.then((result: any) => {
            this.rules_list.splice(rulen, 1);
            this.saveRulesList().catch((error: any) => {
                this.toastr.error('ERROR REMOVING INDICATOR: ' + error.statusText);
                this.dtRules.reloadData();
            });
        });
    }

    updateMinemeldStatus(): void {
        var ns: IMinemeldStatusNode;

        this.MinemeldStatusService.getStatus().then((currentStatus: IMinemeldStatus) => {
            ns = currentStatus[this.nodename];
            angular.forEach(ns.statistics, (value: number, key: any) => {
                var metric: string;

                if (!key.startsWith('rule.')) {
                    return;
                }

                metric = key.split('.', 2)[1];

                angular.element('#' + metric).text(value);
            });
        });
    }

    private destroy() {
        if (this.mmThrottledUpdate) {
            this.mmThrottledUpdate.cancel();
        }
        if (this.mmStatusListener) {
            this.mmStatusListener();
        }
    }

    private saveRulesList(): angular.IPromise<any> {
        return this.MinemeldConfigService
            .saveDataFile(this.cfd_rules_list, this.rules_list, this.nodename)
            .then((result: any) => {
                this.toastr.success('CHANGES SAVED');
                this.dtRules.reloadData();
            });
    }

    private setupRulesTable(): void {
        var vm: SyslogMinerRulesController = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            return vm.MinemeldConfigService.getDataFile(vm.cfd_rules_list).then((result: any) => {
                vm.changed = false;

                if (result === null) {
                    return [];
                }

                return result;
            }, (error: any) => {
                vm.toastr.error('ERROR LOADING RULES LIST: ' + error.statusText);
                throw error;
            })
            .then((result: any) => {
                vm.rules_list = result;

                return result;
            })
            ;
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('fnInitComplete', () => { this.updateMinemeldStatus(); })
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('lengthMenu', [[50, -1], [50, 'All']])
        .withOption('createdRow', function(row: HTMLScriptElement, data: any, index: any) {
            var fc: HTMLElement;
            var j: number;

            row.className += ' config-table-row';

            fc = <HTMLElement>(row.childNodes[4]);
            fc.setAttribute('ng-click', 'vm.removeRule(' + index + ')');
            fc.style.textAlign = 'center';
            fc.style.verticalAlign = 'middle';
            fc.setAttribute('tooltip', 'delete rule');
            fc.setAttribute('tooltip-popup-delay', '500');
            fc.className += ' config-table-clickable';

            for (j = 0; j < row.childNodes.length - 2; j++) {
                fc = <HTMLElement>(row.childNodes[j]);
                fc.setAttribute('ng-click', 'vm.editRule(' + index + ')');
                fc.className += ' config-table-clickable';
            }

            fc = <HTMLElement>(row.childNodes[row.childNodes.length - 2]);
            fc.setAttribute('id', data.name.replace(/[^a-zA-Z0-9_]/g, '_'));

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
            this.DTColumnBuilder.newColumn('name').withTitle('NAME').renderWith(function(data: any, type: any, full: any) {
                return he.encode(data, { strict: true });
            }),
            this.DTColumnBuilder.newColumn('comment').withTitle('COMMENT').withOption('defaultContent', ' ').renderWith(function(data: any, type: any, full: any) {
                if (data) {
                    return he.encode(data, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('DETAILS').renderWith(function(data: any, type: any, full: any) {
                var result: string[] = [];

                if (data.conditions) {
                    result.push('' + data.conditions.length + ' conditions');
                } else {
                    result.push('0 conditions');
                }

                if (data.indicators) {
                    result.push('' + data.indicators.length + ' indicators');
                } else {
                    result.push('0 indicators');
                }

                if (data.fields) {
                    result.push(' ' + data.fields.length + ' fields');
                }  else {
                    result.push('0 fields');
                }

                return '<i>' + result.join(', ') + '</i>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('HITS').renderWith(function(data: any, type: any, full: any) {
                return 0;
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<span class="config-table-icon glyphicon glyphicon-remove"></span>';
            }).withOption('width', '30px')
        ];
    }
}

class SyslogMinerEditRuleController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;
    MinemeldValidateService: IMinemeldValidateService;
    toastr: any;

    title: string;
    rule_names: string[];

    name: string;
    definition: string;
    comment: string;
    nameReadOnly: boolean = false;

    validated: boolean = false;

    editorChanged: any;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                title: string, rule: any, rule_names: string[],
                MinemeldValidateService: IMinemeldValidateService, toastr: any) {
        var trule: any;

        this.title = title;
        this.rule_names = rule_names;

        if (rule) {
            trule = {};

            this.name = rule.name;
            this.nameReadOnly = true;

            angular.forEach(rule, (value: any, key: any) => {
                if ((key === 'name') || (key === 'comment')) {
                    return;
                }
                trule[key] = value;
            });

            this.definition = jsyaml.safeDump(trule);

            this.comment = rule.comment;
        }

        if (!this.definition) {
            this.definition = 'conditions:\n\nindicators:\n\nfields:\n\n';
        }

        this.$modalInstance = $modalInstance;
        this.MinemeldValidateService = MinemeldValidateService;
        this.toastr = toastr;

        this.editorChanged = () => {
            this.validated = false;
        };
    }

    editorLoaded(editor_: any): void {
        editor_.setShowInvisibles(false);

        angular.element('.ace_text-input').on('focus', (event: any) => {
            angular.element(event.currentTarget.parentNode).addClass('ace-focus');
        });
        angular.element('.ace_text-input').on('blur', (event: any) => {
            angular.element(event.currentTarget.parentNode).removeClass('ace-focus');
        });
    }

    valid(): boolean {
        var result: boolean = true;
        var rule: any;

        if (!this.name) {
            result = false;
        }

        if (this.name && this.rule_names.indexOf(this.name.toUpperCase()) !== -1) {
            angular.element('#fgRuleName').addClass('has-error');
            result = false;
        } else {
            angular.element('#fgRuleName').removeClass('has-error');
        }

        if ((!this.definition) || (this.definition.length === 0)) {
            result = false;
        }

        try {
            if (this.definition) {
                rule = jsyaml.safeLoad(this.definition);
                if (typeof(rule) !== 'object') {
                    throw 'definition is not a valid object';
                }
                angular.element('#ruleDefinition').removeClass('has-error');
            }
        } catch (err) {
            angular.element('#ruleDefinition').addClass('has-error');

            result = false;
        }

        return result;
    }

    validate(): void {
        var rule: any;

        rule = jsyaml.safeLoad(this.definition);
        rule.name = this.name;

        if (this.comment) {
            rule.comment = this.comment;
        }

        this.MinemeldValidateService.syslogMinerRule(rule)
            .then((result: any) => {
                this.validated = true;
            }, (error: any) => {
                if (error.status === 400) {
                    this.toastr.error('ERROR VALIDATING RULE: ' + error.data.error.message);
                } else {
                    this.toastr.error('ERROR VALIDATING RULE: ' + error.statusText);
                    angular.element('#ruleDefinition').addClass('has-error');
                }
            });
    }

    save() {
        var result: any;

        result = jsyaml.safeLoad(this.definition);
        result.name = this.name;
        if (this.comment) {
            result.comment = this.comment;
        }

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}

/** @ngInject */
function syslogMinerRouterConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.syslogminerrules', {
            templateUrl: 'app/nodedetail/syslogminer.rules.html',
            controller: SyslogMinerRulesController,
            controllerAs: 'vm'
        })
        .state('nodedetail.syslogminerstats', {
            templateUrl: 'app/nodedetail/view.stats.html',
            controller: SyslogMinerStatsController,
            controllerAs: 'nodedetailstats'
        })
        ;
}

/** @ngInject */
function syslogMinerRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.syslog.SyslogMiner', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.info',
            active: false
        },
        {
            icon: 'fa fa-area-chart',
            tooltip: 'STATS',
            state: 'nodedetail.syslogminerstats',
            active: false
        },
        {
            icon: 'fa fa-bars',
            tooltip: 'RULES',
            state: 'nodedetail.syslogminerrules',
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

console.log('Loading syslog miner');
angular.module('minemeldWebui')
    .config(syslogMinerRouterConfig)
    .run(syslogMinerRegisterClass)
    ;
