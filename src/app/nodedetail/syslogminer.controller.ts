/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IConfirmService } from '../../app/services/confirm';
import { IMinemeldValidateService } from '../../app/services/validate';

declare var he: any;
declare var YAML: any;

class syslogMinerRulesController {
    MinemeldConfig: IMinemeldConfigService;
    toastr: any;
    DTOptionsBuilder: any;
    DTColumnBuilder: any;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $modal: angular.ui.bootstrap.IModalService;
    ConfirmService: IConfirmService;

    dtOptions: any;
    dtColumns: any;
    dtRules: any = {};

    changed: boolean = false;
    cfd_rules_list: string;
    rules_list: any[];
    nodename: string;

    /** @ngInject **/
    constructor(toastr: any, MinemeldConfig: IMinemeldConfigService,
                DTOptionsBuilder: any, DTColumnBuilder: any,
                $compile: angular.ICompileService, $scope: angular.IScope,
                $modal: angular.ui.bootstrap.IModalService,
                ConfirmService: IConfirmService) {
        this.MinemeldConfig = MinemeldConfig;
        this.toastr = toastr;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.$compile = $compile;
        this.$scope = $scope;
        this.$modal = $modal;
        this.ConfirmService = ConfirmService;

        this.nodename = $scope.$parent['nodedetail']['nodename'];
        this.cfd_rules_list = this.nodename + '_rules';

        this.setupRulesTable();
    }

    reload(): void {
        this.dtRules.reloadData();
    }

    addRule(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/syslogminer.edit.modal.html',
            controller: syslogMinerEditRuleController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            size: 'lg',
            resolve: {
                title: () => { return 'ADD RULE'; },
                rule: () => { return undefined; }
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
            controller: syslogMinerEditRuleController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            size: 'lg',
            resolve: {
                title: () => { return 'EDIT RULE'; },
                rule: () => { return this.rules_list[rulen]; }
            }
        });

        mi.result.then((result: any) => {
            this.rules_list[rulen] = result;
            this.saveRulesList().catch((error: any) => {
                    this.toastr.error('ERROR ADDING RULE: ' + error.statusText);
                    this.dtRules.reloadData();
                }); 
        });
    }

    removeRule(rulen: number) {
        var p: angular.IPromise<any>;
        var n: string;

        n = this.rules_list[rulen].name;

        p = this.ConfirmService.show(
            'DELETE INDICATOR',
            'Are you sure you want to delete indicator '+n+' ?'
        );

        p.then((result: any) => {
            this.rules_list.splice(rulen, 1);
            this.saveRulesList().catch((error: any) => {
                this.toastr.error('ERROR REMOVING INDICATOR: ' + error.statusText);
                this.dtRules.reloadData();
            });
        });
    }

    private saveRulesList(): angular.IPromise<any> {
        return this.MinemeldConfig
            .saveDataFile(this.cfd_rules_list, this.rules_list, this.nodename)
            .then((result: any) => {
                this.toastr.success('CHANGES SAVED');
                this.dtRules.reloadData();
            });
    }

    private setupRulesTable(): void {
        var vm: syslogMinerRulesController = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            return vm.MinemeldConfig.getDataFile(vm.cfd_rules_list).then((result: any) => {
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

            for (j = 1; j < row.childNodes.length - 2; j++) {
                fc = <HTMLElement>(row.childNodes[j]);
                fc.setAttribute('ng-click', 'vm.editRule(' + index + ')');
                fc.className += ' config-table-clickable';
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

class syslogMinerEditRuleController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;
    MinemeldValidate: IMinemeldValidateService;
    toastr: any;

    title: string;

    name: string;
    definition: string;
    comment: string;
    nameReadOnly: boolean = false;

    validated: boolean = false;

    editorChanged: any;

    /** @ngInject **/
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                title: string, rule: any,
                MinemeldValidate: IMinemeldValidateService, toastr: any) {
        var trule: any;

        this.title = title;

        if (rule) {
            trule = {};

            this.name = rule.name;
            this.nameReadOnly = true;

            angular.forEach(rule, (value, key) => {
                if ((key == 'name') || (key == 'comment')) {
                    return;
                }
                trule[key] = value;
            });

            this.definition = YAML.stringify(trule);

            this.comment = rule.comment;
        }

        if (!this.definition) {
            this.definition = 'conditions:\n\nindicators:\n\nfields:\n\n';
        }

        this.$modalInstance = $modalInstance;
        this.MinemeldValidate = MinemeldValidate;
        this.toastr = toastr;

        this.editorChanged = () => {
            this.validated = false;
        };
    }

    editorLoaded(editor_: any): void {
        editor_.setShowInvisibles(true);
    }

    valid(): boolean {
        var result: boolean = true;
        var rule: any;

        if (!this.name) {
            result = false;
        }

        if ((!this.definition) || (this.definition.length == 0)) {
            result = false;
        }

        try {
            if (this.definition) {
                rule = YAML.parse(this.definition);
                if (typeof(rule) != "object") {
                    throw "definition is not a valid object";
                }
                angular.element('#ruleDefinition').removeClass('has-error');
            }
        }
        catch (err) {
            angular.element('#ruleDefinition').addClass('has-error');

            result = false;
        }

        return result;
    }

    validate(): void {
        var rule: any;

        rule = YAML.parse(this.definition);
        rule.name = this.name;

        if (this.comment) {
            rule.comment = this.comment;
        }

        this.MinemeldValidate.syslogMinerRule(rule)
            .then((result: any) => {
                this.validated = true;
            }, (error: any) => {
                if (error.status == 400) {
                    this.toastr.error('ERROR VALIDATING RULE: ' + error.data.error.message);
                } else {
                    this.toastr.error('ERROR VALIDATING RULE: ' + error.statusText);
                    angular.element('#ruleDefinition').addClass('has-error');
                }
            });
    }

    save() {
        var result: any;

        result = YAML.parse(this.definition);
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
            controller: syslogMinerRulesController,
            controllerAs: 'vm'
        })
        ;
}

/** @ngInject **/
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
            state: 'nodedetail.stats',
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

console.log("Loading syslog miner");
angular.module('minemeldWebui')
    .config(syslogMinerRouterConfig)
    .run(syslogMinerRegisterClass)
    ;
