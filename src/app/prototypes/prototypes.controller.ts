/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldPrototypeService } from '../../app/services/prototype';

declare var he: any;

export class PrototypesController {
    MinemeldPrototype: IMinemeldPrototypeService;
    toastr: any;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    DTColumnBuilder: any;
    DTOptionsBuilder: any;

    dtPrototypes: any = {};
    dtColumns: any[];
    dtOptions: any;

    /* @ngInject */
    constructor(toastr: any,
        MinemeldPrototype: IMinemeldPrototypeService,
        moment: moment.MomentStatic, $scope: angular.IScope, DTOptionsBuilder: any,
        DTColumnBuilder: any, $compile: angular.ICompileService, $state: angular.ui.IStateService) {
        this.MinemeldPrototype = MinemeldPrototype;
        this.toastr = toastr;
        this.$scope = $scope;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.$compile = $compile;
        this.$state = $state;

        this.setupPrototypesTable();
    }

    public go(newstate: string) {
        this.$state.transitionTo('nodedetail', { nodename: newstate });
    }

    private setupPrototypesTable() {
        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(() => {
            var $p: any = this.MinemeldPrototype.getPrototypeLibraries()
                .then((result: any) => {
                    var l, p: string;
                    var curlibrary, curprototype: any;
                    var nt: string;
                    var author: string;
                    var rprotos: any = [];

                    for (l in result) {
                        if (!result.hasOwnProperty(l)) {
                            continue;
                        }
                        curlibrary = result[l];

                        if (!curlibrary || !curlibrary.prototypes) {
                            continue;
                        }

                        for (p in curlibrary.prototypes) {
                            if (!curlibrary.prototypes.hasOwnProperty(p)) {
                                continue;
                            }
                            curprototype = curlibrary.prototypes[p];

                            nt = '';
                            if (curprototype.node_type) {
                                nt = curprototype.node_type;
                            }

                            author = undefined;
                            if (curprototype.author) {
                                author = curprototype.author;
                            }

                            rprotos.push({
                                name: l + '.' + p,
                                prototypeName: p,
                                libraryName: l,
                                nodeType: nt,
                                libraryDescription: curlibrary.description,
                                prototypeDescription: curprototype.description,
                                author: author
                            });
                        }
                    }

                    return rprotos;
                })
                .catch((error: any) => {
                    this.toastr.error('ERROR RETRIEVING PROTOTYPES LIBRARIES:' + error.status);
                });

            return $p;
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('stateSave', true)
        .withOption('lengthMenu', [[50, -1], [50, 'All']])
        .withOption('createdRow', (row: HTMLScriptElement, data: any) => {
            var c: string;
            var fc: HTMLElement;
            var j: number;

            row.className += ' nodes-table-row';

            fc = <HTMLElement>(row.childNodes[0]);
            fc.className += ' ' + c;

            for (var j = 0; j < row.childNodes.length; j++) {
                fc = <HTMLElement>(row.childNodes[j]);
                fc.setAttribute('ng-click', 'vm.$state.go("prototypedetail", {libraryName: "' + data.libraryName + '", prototypeName: "' + data.prototypeName + '"})');
            }

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
            this.DTColumnBuilder.newColumn('name').withTitle('NAME').renderWith(function(data: any, type: any, full: any) {
                var r: string;
                var iconclass, labelclass: string;

                iconclass = 'glyphicon glyphicon-user';
                labelclass = 'prototypes-label-unk';

                if (full.author) {
                    iconclass = 'mm-community';
                    labelclass = 'prototypes-label-community';
                    if (full.author == 'MineMeld Core Team') {
                        iconclass = 'mm-minemeld';
                        labelclass = 'prototypes-label-minemeld';
                    }
                }

                r = '<div><span class="label ' + labelclass + ' mm-label"><i class="' + iconclass + '"></i></span> ';
                r += he.encode(data, { strict: true }) + '</div>';

                if (full.author) {
                    r += '<div class="prototypes-author">' + he.encode(full.author.toUpperCase(), { strict: true }) + '</div>';
                }

                return r;
            }),
            this.DTColumnBuilder.newColumn('nodeType').withTitle('TYPE').renderWith(function(data: any, type: any, full: any) {
                var c: string;
                var v: string;

                if (data === 'miner') {
                    c = 'nodes-label-miner';
                    v = 'MINER';
                } else if (data === 'output') {
                    c = 'nodes-label-output';
                    v = 'OUTPUT';
                } else if (data === 'processor') {
                    c = 'nodes-label-processor';
                    v = 'PROCESSOR';
                } else {
                    c = 'label-default';
                    v = he.encode(data);
                }

                return '<span class="label ' + c + '">' + v + '</span>';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('DESCRIPTION').renderWith(function(data: any, type: any, full: any) {
                var r: string = '';

                if (full.libraryDescription) {
                    r += '<div class="m-b-xs"><strong>' + he.encode(full.libraryName) + '</strong> ' + he.encode(full.libraryDescription) + '</div>';
                }
                if (full.prototypeDescription) {
                    r += '<div><strong>' + he.encode(full.libraryName) + '.' + he.encode(full.prototypeName) + '</strong> ' + he.encode(full.prototypeDescription) + '</div>';
                }

                return r;
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<span class="prototypes-table-chevron glyphicon glyphicon-chevron-right"></span>';
            }).withOption('width', '30px').withClass('prototypes-chevron-td')
        ];
    }
}
