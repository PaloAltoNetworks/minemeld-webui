/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IConfirmService } from '../../app/services/confirm';

declare var he: any;
declare var moment: any;

class NodeDetailLocalDbIndicatorsController {
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
            templateUrl: 'app/nodedetail/localdb.indicator.modal.html',
            controller: LocalDbIndicatorController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            size: 'lg',
            animation: false,
            resolve: {
                indicator: () => {
                    return undefined;
                }
            }
        });

        mi.result.then(result => {
            this.iorIndicator(result)
                .then(() => {
                    this.toastr.success('INDICATOR ' + result.indicator + ' ADDED');
                    this.dtIndicators.reloadData();
                }, (error: any) => {
                    this.toastr.error('ERROR ADDING INDICATOR: ' + error.statusText);
                    this.dtIndicators.reloadData();
                });
        });
    }

    showIndicator(index: number): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/localdb.indicator.modal.html',
            controller: LocalDbIndicatorController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            size: 'lg',
            resolve: {
                indicator: () => {
                    return this.indicators[index];
                }
            }
        });

        mi.result.then(result => {
            this.iorIndicator(result)
                .then(() => {
                    this.toastr.success('INDICATOR ' + result.indicator + ' UPDATED');
                    this.dtIndicators.reloadData();
                }, (error: any) => {
                    this.toastr.error('ERROR UPDATING INDICATOR: ' + error.statusText);
                    this.dtIndicators.reloadData();
                });
        });
    }

    removeIndicator(inum: number) {
        var p: angular.IPromise<any>;
        var indicator: any;

        indicator = this.indicators[inum];

        p = this.ConfirmService.show(
            'DELETE INDICATOR',
            'Are you sure you want to delete indicator ' + indicator.indicator + ' ?'
        );

        p.then((result: any) => {
            this.indicators.splice(inum, 1);
            this.iorIndicator(indicator.indicator, indicator.type, -1, { removed: true })
                .then(() => {
                    this.toastr.success('INDICATOR ' + indicator.indicator + ' REMOVED');
                    this.dtIndicators.reloadData();
                }, (error: any) => {
                    this.toastr.error('ERROR REMOVING INDICATOR: ' + error.statusText);
                    this.dtIndicators.reloadData();
                });
        });
    }

    reload() {
        this.dtIndicators.reloadData();
    }

    private setupIndicatorsTable(): void {
        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(() => {
            return this.MinemeldConfigService.getDataFile(this.cfd_indicators, 'localdb').then((result: any) => {
                this.changed = false;

                if (result === null) {
                    return [];
                }

                return result;
            }, (error: any) => {
                this.toastr.error('ERROR LOADING INDICATORS LIST: ' + error.statusText);
                throw error;
            })
            .then((result: any) => {
                this.indicators = result;

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
        .withOption('createdRow', (row: HTMLScriptElement, data: any, index: any) => {
            var fc: HTMLElement;

            row.className += ' config-table-row';

            for (var j = 0; j < row.childNodes.length - 1; j++) {
                fc = <HTMLElement>(row.childNodes[j]);
                fc.setAttribute('ng-click', 'vm.showIndicator(' + index + ')');
            }

            fc = <HTMLElement>(row.childNodes[5]);
            fc.setAttribute('ng-click', 'vm.removeIndicator(' + index + ')');
            fc.style.textAlign = 'center';
            fc.style.verticalAlign = 'middle';
            fc.setAttribute('tooltip', 'delete indicator');
            fc.setAttribute('tooltip-popup-delay', '500');
            fc.setAttribute('tooltip-append-to-body', 'true');
            fc.className += ' config-table-clickable';

            this.$compile(angular.element(row).contents())(this.$scope);
        })
        .withLanguage({
            'oPaginate': {
                'sNext': '>',
                'sPrevious': '<'
            }
        })
        ;

        this.dtColumns = [
            this.DTColumnBuilder.newColumn('indicator').withTitle('INDICATOR').withOption('width', '20%').renderWith((data: any, type: any, full: any) => {
                if (data) {
                    return he.encode(data, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn('type').withTitle('TYPE')
                .withOption('defaultContent', ' ').renderWith(function(data: any, type: any, full: any) {
                if (data) {
                    return he.encode(data, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn('comment').withTitle('COMMENT')
                .withOption('defaultContent', ' ').renderWith(function(data: any, type: any, full: any) {
                if (data) {
                    return he.encode(data, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn('_update_ts').withTitle('LAST UPDATE')
                .withOption('defaultContent', ' ').withOption('width', '20%').renderWith(function(data: any, type: any, full: any) {
                    if (data) {
                        return moment(data).format('DD/MM/YYYY HH:mm:ss Z');
                    }

                    return 'N/A';
            }),
            this.DTColumnBuilder.newColumn('_expiration_ts').withTitle('EXPIRATION')
                .withOption('defaultContent', ' ').withOption('width', '20%').renderWith(function(data: any, type: any, full: any) {
                    if (data === 'disabled') {
                        return '<i>Disabled</i>';
                    }
                    if (data) {
                        return moment(data).format('DD/MM/YYYY HH:mm:ss Z');
                    }

                    return '<i>Default</i>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<span class="config-table-icon glyphicon glyphicon-remove"></span>';
            }).withOption('width', '30px')
        ];
    }

    private iorIndicator(indicator: any, type?: string, ttl?: number, attributes?: any): angular.IPromise<any> {
        let data: any;

        data = indicator;
        if (typeof(type) !== 'undefined') {
            data = angular.copy(attributes);
            data.indicator = indicator;
            data.type = type;
            data.ttl = ttl;
        }

        Object.keys(data).forEach((key: string) => {
            if (key[0] === '_') {
                delete data[key];
            }
        });

        return this.MinemeldConfigService
            .appendDataFile(this.cfd_indicators, data, this.nodename, 'localdb');
    }
}

class AttributesAnnotation {
    private _annotations: { [key: number]: string[] } = {};

    constructor() {
        /* empty */
    }

    addAnnotation(row: number, annotation: string): void {
        if (!(row in this._annotations)) {
            this._annotations[row] = [];
        }
        this._annotations[row].push(annotation);
    }

    getAnnotations(): any[] {
        var result: any[] = [];

        Object.keys(this._annotations).forEach((row: string) => {
            result.push({
                row: +row,
                column: 0,
                type: 'error',
                text: this._annotations[row].join('\n')
            });
        });

        return result;
    }

    length(): number {
        return Object.keys(this._annotations).length;
    }

    firstRowNumber(): number {
        var rows: number[];

        rows = Object.keys(this._annotations).map((v: string): number => { return +v; });
        if (rows.length !== 0) {
            return Math.min.apply(null, rows) + 1;
        }

        return 0;
    }
}

class LocalDbIndicatorController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    indicator: string;
    type: string;
    attributes: any;
    attributesJSON: string;

    update_ts: number;
    expiration_ts: number|string;

    editableIndicatorAndType: boolean = true;
    editableAttributes: boolean = true;

    numAnnotations: number = 0;
    firstAnnotation: number = 0;

    attributesValid: boolean = false;

    availableTypes: string[] = [
        'IPv4',
        'IPv6',
        'URL',
        'domain',
        'user-id',
        'md5',
        'sha256',
        'sha1',
        'ssdeep',
        'email-addr'
    ];

    comment: string;
    ttl: number;
    expirationDisabled: boolean = false;

    private editor: any;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                indicator: any) {
        this.$modalInstance = $modalInstance;

        if (typeof(indicator) !== 'undefined') {
            // everything read only
            this.editableAttributes = false;
            this.editableIndicatorAndType = false;

            this.attributes = angular.copy(indicator);
            this.update_ts = this.attributes._update_ts;
            this.expiration_ts = this.attributes._expiration_ts;
            if (this.expiration_ts === 'disabled') {
                this.expirationDisabled = true;
            }

            Object.keys(this.attributes).forEach(key => {
                if (key[0] === '_') {
                    delete this.attributes[key];
                }
            });

            this.indicator = this.attributes.indicator;
            delete this.attributes['indicator'];
            this.type = this.attributes.type;
            delete this.attributes['type'];

            if (this.attributes.comment) {
                this.comment = this.attributes.comment;
                delete this.attributes['comment'];
            }
        }
        this.attributesJSON = JSON.stringify(this.attributes, null, 4);

        /* this is a trick, basically these callbacks are called by ui-ace
           with this set to Window. To recover *this* instance we define
           the methods in a scope with *this* captured by a local variable vm */
        let vm: any = this;
        vm.editorLoaded = (editor_: any) => {
            vm.editor = editor_;

            editor_.setShowInvisibles(false);

            angular.element('.ace_text-input').on('focus', (event: any) => {
                angular.element(event.currentTarget.parentNode).addClass('ace-focus');
            });
            angular.element('.ace_text-input').on('blur', (event: any) => {
                angular.element(event.currentTarget.parentNode).removeClass('ace-focus');
            });

            editor_.getSession().setOption('useWorker', false);

            vm.validAttributes();
        };
        vm.aceChanged = vm.validAttributes.bind(this);
    }

    save() {
        var result: any = {};

        if (this.attributesJSON && this.attributesJSON.trim().length !== 0) {
            result = JSON.parse(this.attributesJSON);
        }

        result.indicator = this.indicator;
        result.type = this.type;
        result.ttl = this.ttl;
        if (this.expirationDisabled) {
            result.ttl = 'disabled';
        }

        if (this.comment) {
            result.comment = this.comment;
        }

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }

    errorClick(): void {
        this.editor.gotoLine(this.firstAnnotation, 0, true);
    }

    validate() {
        return this.attributesValid && this.indicator && this.type;
    }

    validAttributes(): void {
        var annotations: AttributesAnnotation = new AttributesAnnotation();

        if (!this.editor) {
            return;
        }

        this.attributesValid = true;

        this.editor.getSession().clearAnnotations();
        this.numAnnotations = 0;

        if (!this.attributesJSON) {
            return;
        }

        if (this.attributesJSON.trim().length === 0) {
            return;
        }

        try {
            this.attributes = JSON.parse(this.attributesJSON);
        } catch (err) {
            this.attributesValid = false;

            this.editor.getSession().setAnnotations([{
                row: 0,
                column: 0,
                text: 'Invalid JSON syntax',
                type: 'error' // also warning and information
            }]);
            this.numAnnotations = 1;
            this.firstAnnotation = 0;

            return;
        }

        Object.keys(this.attributes).forEach(key => {
            if (key[0] === '_') {
                annotations.addAnnotation(
                    this.findAttribute(key),
                    'Invalid attribute name ' + key
                );
            }
        });

        this.numAnnotations = annotations.length();
        this.firstAnnotation = annotations.firstRowNumber();
        if (annotations.length() !== 0) {
            this.editor.getSession().setAnnotations(
                annotations.getAnnotations()
            );
            this.attributesValid = false;
        }
    }

    private findAttribute(attribute: string): any {
        var clines: string[];
        var line: string;
        var regexp: RegExp = new RegExp('^\\s*"' +  attribute + '"');

        clines = this.attributesJSON.split('\n');
        for (var row in clines) {
            line = clines[row];
            if (regexp.test(line)) {
                return row;
            }
        }

        return 0;
    }
};

/** @ngInject */
function localDbRouterConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.localdbindicators', {
            templateUrl: 'app/nodedetail/localdb.indicators.html',
            controller: NodeDetailLocalDbIndicatorsController,
            controllerAs: 'vm'
        })
        ;
}

/** @ngInject */
function localDbRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.localdb.Miner', {
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
            state: 'nodedetail.localdbindicators',
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

console.log('Loading localdb');
angular.module('minemeldWebui')
    .config(localDbRouterConfig)
    .run(localDbRegisterClass)
    ;
