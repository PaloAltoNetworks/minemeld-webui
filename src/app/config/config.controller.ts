/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldConfigService, IMinemeldCandidateConfigInfo, IMinemeldCandidateConfigNode } from  '../../app/services/config';
import { IConfirmService } from '../../app/services/confirm';
import { IMinemeldPrototypeService } from '../../app/services/prototype';
import { IMinemeldSupervisorService } from '../../app/services/supervisor';
import { IMineMeldEngineStatusService, IMineMeldEngineStatus } from '../../app/services/enginestatus';
import { IMineMeldCurrentUserService } from '../services/currentuser';

declare var he: any;

export class ConfigController {
    toastr: any;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    $q: angular.IQService;
    $modal: angular.ui.bootstrap.IModalService;
    DTColumnBuilder: any;
    DTOptionsBuilder: any;
    MinemeldConfigService: IMinemeldConfigService;
    MinemeldPrototypeService: IMinemeldPrototypeService;
    MinemeldSupervisorService: IMinemeldSupervisorService;
    MineMeldEngineStatusService: IMineMeldEngineStatusService;
    MineMeldCurrentUserService: IMineMeldCurrentUserService;
    ConfirmService: IConfirmService;

    expertMode: boolean = false;

    dtNodes: any = {};
    dtColumns: any[];
    dtOptions: any;

    changed: boolean = false;
    inCommit: boolean = false;

    configInfo: IMinemeldCandidateConfigInfo;
    nodesConfig: IMinemeldCandidateConfigNode[];

    /** @ngInject */
    constructor(toastr: any, $scope: angular.IScope, DTOptionsBuilder: any,
                DTColumnBuilder: any, $compile: angular.ICompileService,
                MinemeldConfigService: IMinemeldConfigService,
                MinemeldSupervisorService: IMinemeldSupervisorService,
                MinemeldPrototypeService: IMinemeldPrototypeService,
                MineMeldEngineStatusService: IMineMeldEngineStatusService,
                MineMeldCurrentUserService: IMineMeldCurrentUserService,
                $state: angular.ui.IStateService, $q: angular.IQService,
                $modal: angular.ui.bootstrap.IModalService,
                ConfirmService: IConfirmService) {
        this.toastr = toastr;
        this.$scope = $scope;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.$compile = $compile;
        this.$state = $state;
        this.$q = $q;
        this.$modal = $modal;
        this.MinemeldConfigService = MinemeldConfigService;
        this.MinemeldPrototypeService = MinemeldPrototypeService;
        this.MinemeldSupervisorService = MinemeldSupervisorService;
        this.MineMeldEngineStatusService = MineMeldEngineStatusService;
        this.MineMeldCurrentUserService = MineMeldCurrentUserService;
        this.ConfirmService = ConfirmService;

        this.setupNodesTable();
    }

    revert() {
        this.MinemeldConfigService.reload('running').then((result: any) => {
            this.$state.go(this.$state.current.name, {}, {reload: true});
        }, (error: any) => {
            this.toastr.error('ERROR RELOADING CONFIG: ' + error.statusText);
        });
    }

    load() {
        this.MinemeldConfigService.reload('committed').then((result: any) => {
            this.$state.go(this.$state.current.name, {}, {reload: true});
        }, (error: any) => {
            this.toastr.error('ERROR RELOADING CONFIG: ' + error.statusText);
        });
    }

    import(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/config/configureimport.modal.html',
            controller: 'ConfigureImportController',
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            size: 'lg'
        });

        mi.result.then((result: any) => {
            if (result === 'ok') {
                this.changed = this.MinemeldConfigService.changed;
                this.dtNodes.reloadData();
            }
        });
    }

    export(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/config/configureexport.modal.html',
            controller: 'ConfigureExportController',
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            size: 'lg'
        });
    }

    configureOutput(nodenum: number) {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/config/configureoutput.modal.html',
            controller: ConfigureOutputController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                nodenum: () => { return nodenum; }
            },
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            if (result !== 'ok') {
                this.toastr.error('ERROR SAVING NODE CONFIG: ' + result.statusText);
                this.refreshConfig().finally(() => {
                    this.changed = this.MinemeldConfigService.changed;
                    this.dtNodes.reloadData();
                });
            } else {
                this.changed = this.MinemeldConfigService.changed;
                this.dtNodes.reloadData();
            }
        });
    }

    configureInputs(nodenum: number) {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        if (!this.expertMode) {
            if (typeof this.nodesConfig[nodenum].properties.node_type !== 'undefined') {
                if (this.nodesConfig[nodenum].properties.node_type === 'miner') {
                    return;
                }
            }
        }

        mi = this.$modal.open({
            templateUrl: 'app/config/configureinputs.modal.html',
            controller: ConfigureInputsController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                nodenum: () => { return nodenum; }
            },
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            if (result !== 'ok') {
                this.toastr.error('ERROR SAVING NODE CONFIG: ' + result.statusText);
                this.refreshConfig().finally(() => {
                    this.dtNodes.reloadData();
                });
            } else {
                this.dtNodes.reloadData();
            }
        });
    }

    removeNode(nodenum: number) {
        var p: angular.IPromise<any>;

        p = this.ConfirmService.show(
            'DELETE NODE',
            'Are you sure you want to delete node ' + this.nodesConfig[nodenum].name + ' ?'
        );

        p.then((result: any) => {
            this.MinemeldConfigService.deleteNode(nodenum).then((result: any) => {
                this.dtNodes.reloadData();
            }, (error: any) => {
                this.toastr.error('ERROR DELETING NODE: ' + error.statusText);
                this.dtNodes.reloadData();
            });
        });
    }

    commit() {
        this.inCommit = true;
        this.MineMeldEngineStatusService.getStatus().then((result: IMineMeldEngineStatus) => {
            if (result.statename == 'STARTING' || result.statename == 'STOPPING') {
                this.toastr.error('COMMIT CANCELLED: ENGINE IS ' + result.statename);
                this.inCommit = false;
                return;
            }

            this.doCommit();
        }, (error: any) => {
            this.inCommit = false;
        });
    }

    toggleExpert() {
        if (this.expertMode) {
            this.expertMode = false;
        } else {
            this.expertMode = true;
        }

        angular.element('#configTable thead tr th:nth-child(6)').toggle();
        angular.element('#configTable tbody tr td:nth-child(6)').toggle();

        angular.element('.config-table-miner')
            .toggleClass('config-table-clickable')
            .toggleClass('config-table-disabled');
    }

    private doCommit() {
        var p: angular.IPromise<any>;

        p = this.MinemeldConfigService.commit().then((result: any) => {
            this.toastr.success('COMMIT SUCCESSFUL');
            this.dtNodes.reloadData();
            this.MinemeldSupervisorService.restartEngine().then(
                (result: any) => {
                    this.toastr.success(
                        'Restarting engine, could take some minutes. Check <a href="/#/system/dashboard">SYSTEM</a>',
                        { allowHtml: true }
                    );
                },
                (error: any) => { this.toastr.error('ERROR RESTARTING ENGINE: ' + error.statusText); }
            );
        }, (error: any) => {
            if (error.status === 402) {
                this.toastr.error('COMMIT FAILED: ' + error.data.error.message.join(', '), '', { timeOut: 60000 });
            } else {
                this.toastr.error('ERROR IN COMMIT: ' + error.statusText);
            }
            this.dtNodes.reloadData();
        })
        .finally(() => { this.inCommit = false; });
    }

    private setupNodesTable() {
        var vm: ConfigController = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            return vm.getConfig();
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('order', [[2, 'asc'], [1, 'asc']])
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('bDeferRender', true)
        .withOption('paging', false)
        .withOption('stateSave', true)
        .withOption('headerCallback', (thead: HTMLScriptElement) => {
            var fc: HTMLElement;

            fc = <HTMLElement>thead.childNodes[5];
            fc.setAttribute('ng-show', 'vm.expertMode');

            vm.$compile(angular.element(thead).contents())(vm.$scope);
        })
        .withOption('createdRow', function(row: HTMLScriptElement, data: any, index: any) {
            var c: string;
            var fc: HTMLElement;

            if (data.deleted === true) {
                row.style.display = 'none';
                return;
            }

            row.className += ' config-table-row';

            c = 'nodes-dt-header-default';
            if (typeof data.properties.node_type === 'undefined') {
                c = 'nodes-dt-header-default';
            } else if (data.properties.node_type === 'miner') {
                c = 'nodes-dt-header-miner';
            } else if (data.properties.node_type === 'output') {
                    c = 'nodes-dt-header-output';
            } else if (data.properties.node_type === 'processor') {
                    c = 'nodes-dt-header-processor';
            }
            fc = <HTMLElement>(row.childNodes[0]);
            fc.className += ' ' + c;

            fc = <HTMLElement>(row.childNodes[4]);
            fc.setAttribute('ng-click', 'vm.configureInputs(' + index + ')');
            if (typeof data.properties.node_type !== 'undefined' && data.properties.node_type === 'miner') {
                fc.className += ' config-table-miner';

                if (vm.expertMode) {
                    fc.className += ' config-table-clickable';
                } else {
                    fc.className += ' config-table-disabled';
                }
            } else {
                fc.className += ' config-table-clickable';
            }

            fc = <HTMLElement>(row.childNodes[5]);
            fc.setAttribute('ng-click', 'vm.configureOutput(' + index + ')');
            fc.className += ' config-table-clickable';
            fc.setAttribute('ng-show', 'vm.expertMode');

            fc = <HTMLElement>(row.childNodes[6]);
            fc.setAttribute('ng-click', 'vm.removeNode(' + index + ')');
            fc.style.textAlign = 'center';
            fc.style.verticalAlign = 'middle';
            fc.setAttribute('tooltip', 'delete node');
            fc.setAttribute('tooltip-popup-delay', '500');
            fc.setAttribute('tooltip-append-to-body', 'true');
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
            }).withOption('width', '5px').notSortable(),
            this.DTColumnBuilder.newColumn('name').withTitle('NAME').renderWith(function(data: any, type: any, full: any) {
                return he.encode(data, { strict: true });
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('TYPE').renderWith(function(data: any, type: any, full: any) {
                var v, c, nt: string;

                if (typeof full.properties.node_type === 'undefined' || full.properties.node_type === 'UNKNOWN') {
                    return '<span class="label label-default">UNKNOWN</span>';
                }

                nt = he.encode(full.properties.node_type, {strict: true});
                c = 'nodes-label-' + nt;
                v = <string>(nt).toUpperCase();

                return '<span class="label ' + c + '">' + v + '</span>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('PROTOTYPE').renderWith(function(data: any, type: any, full: any) {
                if (full.properties.prototype) {
                    return full.properties.prototype;
                }

                return '<span class="config-none">None</span>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('INPUTS').renderWith(function(data: any, type: any, full: any) {
                if (full.properties.inputs && (full.properties.inputs.length > 0)) {
                    var result: string[] = new Array();

                    result = ['<ul style="margin: 0;">'];
                    result = result.concat(full.properties.inputs.map(
                        (x: string) => { return '<li style="padding-bottom: 0px;">' + he.encode(x, {strict: true}) + '</li>'; }
                    ));
                    result.push('</ul>');

                    return result.join('');
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
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<span class="config-table-icon glyphicon glyphicon-remove"></span>';
            }).withOption('width', '30px')
        ];
    }

    private getConfig(): angular.IPromise<any> {
/*        if (this.MinemeldConfig.configInfo) {
            var $p: angular.IDeferred<any> = this.$q.defer();

            this.configInfo = this.MinemeldConfig.configInfo;
            this.nodesConfig = this.MinemeldConfig.nodesConfig;

            $p.resolve(this.MinemeldConfig.nodesConfig);

            return $p.promise;
        }*/

        return this.MinemeldPrototypeService.getPrototypeLibraries().then((result: any) => {
            return this.refreshConfig();
        }, (error: any) => {
            if (!error.cancelled) {
                this.toastr.error('ERROR LOADING PROTOTYPES: ' + error.statusText);
            }

            throw error;
        });
    }

    private refreshConfig(): angular.IPromise<any> {
        return this.MinemeldConfigService.refresh().then((result: any) => {
            this.configInfo = this.MinemeldConfigService.configInfo;
            this.nodesConfig = this.MinemeldConfigService.nodesConfig;
            this.changed = this.MinemeldConfigService.configInfo.changed;

            return result;
        }, (error: any) => {
            if (error.cancelled) {
                return;
            }

            this.toastr.error('ERROR RELOADING CONFIG: ' + error.statusText);

            this.configInfo = undefined;
            this.nodesConfig = [];
            this.changed = false;

            return this.nodesConfig;
        }).then((config: any[]) => {
            var result: angular.IPromise<any>[] = [];

            result = config.map((node: any) => {
                if (typeof node.properties.prototype === 'undefined') {
                    return this.$q.when(node);
                }

                return this.MinemeldPrototypeService.getPrototype(node.properties.prototype).then((result: any) => {
                    if (typeof result === 'undefined') {
                        node.properties.node_type = 'UNKNOWN';
                    } else {
                        if (result.node_type) {
                            node.properties.node_type = result.node_type;
                        }
                        if (result.indicator_types) {
                            node.properties.indicator_types = result.indicator_types;
                        }
                    }

                    return node;
                }, (error: any) => {
                    return node;
                });
            });

            return this.$q.all(result);
        });
    }
}

export class ConfigureOutputController {
    nodenum: number;
    MinemeldConfigService: IMinemeldConfigService;
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    nodeConfig: IMinemeldCandidateConfigNode;
    output: boolean;
    originalOutput: boolean;

    /** @ngInject */
    constructor(MinemeldConfigService: IMinemeldConfigService,
                $modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                nodenum: number) {
        this.nodenum = nodenum;
        this.MinemeldConfigService = MinemeldConfigService;
        this.$modalInstance = $modalInstance;
        this.nodeConfig = this.MinemeldConfigService.nodesConfig[nodenum];
        this.output = this.nodeConfig.properties.output;
        this.originalOutput = this.output;
    }

    disableOutput() {
        this.output = false;
    }

    enableOutput() {
        this.output = true;
    }

    save() {
        this.nodeConfig.properties.output = this.output;
        this.MinemeldConfigService.saveNodeConfig(this.nodenum)
            .then((result: any) => {
                this.$modalInstance.close('ok');
            }, (error: any) => {
                this.$modalInstance.close(error);
            });
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}

interface InputProperties {
    name: string;
    nodeType: string;
};

export class ConfigureInputsController {
    nodenum: number;
    MinemeldConfigService: IMinemeldConfigService;
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    expertMode: boolean = false;
    nodeConfig: IMinemeldCandidateConfigNode;
    nodeType: string;
    nodeTypeLimit: number;
    indicatorTypes: string[];

    noChoiceMessage: string;

    inputs: string[];
    availableInputs: InputProperties[];
    changed: boolean = false;

    /** @ngInject */
    constructor(MinemeldConfigService: IMinemeldConfigService,
                $modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                nodenum: number) {
        this.nodenum = nodenum;
        this.MinemeldConfigService = MinemeldConfigService;
        this.$modalInstance = $modalInstance;

        this.nodeConfig = this.MinemeldConfigService.nodesConfig[nodenum];
        if (typeof this.nodeConfig.properties.node_type !== 'undefined') {
            this.nodeType = this.nodeConfig.properties.node_type;
        }
        if (typeof this.nodeConfig.properties.indicator_types !== 'undefined') {
            this.indicatorTypes = this.nodeConfig.properties.indicator_types;
        }
        if (this.nodeType === 'output') {
            this.nodeTypeLimit = 1;
        }
        if (this.nodeType === 'miner') {
            this.nodeTypeLimit = 0;
        }
        if (this.nodeType === 'processor') {
            this.nodeTypeLimit = 1024; /* should be enough */
        }

        this.inputs = angular.copy(this.nodeConfig.properties.inputs);

        this.loadAvailableInputs();
    }

    hasChanged() {
        this.changed = true;
        this.loadAvailableInputs();
    }

    save() {
        this.nodeConfig.properties.inputs = this.inputs;
        this.MinemeldConfigService.saveNodeConfig(this.nodenum)
            .then((result: any) => {
                this.$modalInstance.close('ok');
            }, (error: any) => {
                this.$modalInstance.close(error);
            });
    }

    cancel() {
        this.$modalInstance.dismiss();
    }

    toggleExpert(): void {
        if (this.expertMode) {
            this.expertMode = false;
        } else {
            this.expertMode = true;
        }
        this.loadAvailableInputs();
    }

    private loadAvailableInputs(): void {
        var t: IMinemeldCandidateConfigNode[];

        if (!this.expertMode) {
            if (this.inputs.length >= this.nodeTypeLimit) {
                this.availableInputs = this.inputs.map((i: string) => {
                    var cn: IMinemeldCandidateConfigNode;
                    var nt: string = 'UNKNOWN';

                    for (cn of this.MinemeldConfigService.nodesConfig) {
                        if (cn.name == i) {
                            if (typeof cn.properties.node_type !== 'undefined') {
                                nt = cn.properties.node_type.toUpperCase();
                            }
                            break;
                        }
                    }

                    return {
                        name: i,
                        nodeType: nt
                    };
                });

                this.noChoiceMessage = 'Max number of input nodes for this ' + this.nodeType.toUpperCase() + ' node reached';

                return;
            }
        }

        t = this.MinemeldConfigService.nodesConfig
            .filter((x: IMinemeldCandidateConfigNode) => {
                /* first thing remove deleted nodes and itself */
                if (x.name == this.nodeConfig.name) {
                    return false;
                }

                /* already selected inputs should be available */
                if (this.inputs.indexOf(x.name) !== -1) {
                    return true;
                }

                if (x.deleted) {
                    return false;
                }

                return true;
            });

        if (!this.expertMode && typeof this.nodeType !== 'undefined') {
            t = t.filter((x: IMinemeldCandidateConfigNode) => {
                var x_nt: string;

                if (typeof x.properties.node_type === 'undefined') {
                    return true;
                }
                x_nt = x.properties.node_type;

                if (this.nodeType === 'miner') {
                    return false;
                }
                if (this.nodeType === 'processor') {
                    if (x_nt === 'miner') {
                        return true;
                    }
                    if (x_nt === 'processor') {
                        return true;
                    }
                    return false;
                }
                if (this.nodeType === 'output') {
                    if (x_nt === 'miner') {
                        return true;
                    }
                    if (x_nt === 'processor') {
                        return true;
                    }
                    return false;
                }

                return true;
            });
        }
        if (!this.expertMode && this.indicatorTypes) {
            if (this.indicatorTypes.length !== 0 && this.indicatorTypes[0] !== 'any') {
                t = t.filter((x: IMinemeldCandidateConfigNode) => {
                    var x_it: string[];

                    if (!x.properties.indicator_types) {
                        return true;
                    }
                    x_it = x.properties.indicator_types;

                    if (x_it.length === 0 || x_it[0] === 'any') {
                        return true;
                    }
                    for (var j: number = 0; j < x_it.length; j++) {
                        if (this.indicatorTypes.indexOf(x_it[j]) !== -1) {
                            return true;
                        }
                    }
                    return false;
                });
            }
        }

        this.availableInputs = t.map((x: IMinemeldCandidateConfigNode) => {
            var nt: string;

            nt = 'UNKNOWN';
            if (typeof x.properties.node_type !== 'undefined') {
                nt = x.properties.node_type.toUpperCase();
            }

            return {
                name: x.name,
                nodeType: nt
            };
        });

        /* in ui-select all the already specified nodes should be "available"
           this thing here is to add selected but deleted nodes */
        angular.forEach(this.inputs, (x: string) => {
            var f: InputProperties[];

            f = this.availableInputs.filter((ai: InputProperties) => {
                return ai.name == x;
            });

            if (f.length === 0) {
                this.availableInputs.push({
                    name: x,
                    nodeType: 'UNKNOWN'
                });
            }
        });

        this.noChoiceMessage = 'No suitable input nodes found';
    }
}
