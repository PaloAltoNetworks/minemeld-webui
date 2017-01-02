/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldConfigService, IMinemeldCandidateConfigNode } from  '../../app/services/config';
import { IMinemeldPrototypeService } from '../../app/services/prototype';

interface IPrototypesDescription {
    name: string;
    libraryName: string;
    prototypeName: string;
    prototypeDescription?: string;
    libraryDescription?: string;
    developmentStatus?: string;
    nodeType?: string;
    indicatorTypes?: string[];
}

interface IInputNode {
    name: string;
    nodeType: string;
    indicatorTypes: string[];
}

export class ConfigAddController {
    MinemeldPrototypeService: IMinemeldPrototypeService;
    MinemeldConfigService: IMinemeldConfigService;
    toastr: any;
    $state: angular.ui.IStateService;
    $stateParams: angular.ui.IStateParamsService;
    $rootScope: any;
    $q: angular.IQService;

    availablePrototypes: IPrototypesDescription[] = new Array();
    availableInputs: IInputNode[];
    configNodes: IInputNode[];

    name: string = 'node-' + (new Date().getTime());
    prototype: string;
    inputs: string[] = new Array();
    inputsDisabled: boolean = false;
    inputsLimit: number;
    noInputsChoiceMessage: string;
    output: boolean = false;

    selectedPrototype: IPrototypesDescription;

    /* @ngInject */
    constructor(MinemeldPrototypeService: IMinemeldPrototypeService,
                MinemeldConfigService: IMinemeldConfigService,
                toastr: any, $state: angular.ui.IStateService,
                $stateParams: angular.ui.IStateParamsService,
                $rootScope: angular.IRootScopeService,
                $q: angular.IQService) {
        var p: string;
        var toks: string[];

        this.$rootScope = $rootScope;
        this.MinemeldPrototypeService = MinemeldPrototypeService;
        this.MinemeldConfigService = MinemeldConfigService;
        this.toastr = toastr;
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.$q = $q;

        p = this.$stateParams['prototype'];
        if (p !== 'none') {
            this.prototype = p;

            toks = p.split('.');
            this.name = toks[toks.length - 1] + '-' + (new Date().getTime());
        }

        this.MinemeldPrototypeService.getPrototypeLibraries().then((result: any) => {
            var l: string;
            var p: string;
            var nt: string;
            var it: string[];
            var curproto: IPrototypesDescription;

            for (l in result) {
                if (!result.hasOwnProperty(l)) {
                    continue;
                }

                for (p in result[l].prototypes) {
                    if (!result[l].prototypes.hasOwnProperty(p)) {
                        continue;
                    }

                    nt = 'UNKNOWN';
                    if (result[l].prototypes[p].node_type) {
                        nt = result[l].prototypes[p].node_type.toUpperCase();
                    }

                    it = [];
                    if (result[l].prototypes[p].indicator_types) {
                        it = result[l].prototypes[p].indicator_types;
                    }

                    curproto = {
                        name: l + '.' + p,
                        libraryName: l,
                        prototypeName: p,
                        libraryDescription: result[l].description,
                        prototypeDescription: result[l].prototypes[p].description,
                        developmentStatus: result[l].prototypes[p].development_status,
                        nodeType: nt,
                        indicatorTypes: it
                    };
                    this.availablePrototypes.push(curproto);

                    if (this.prototype && (this.prototype == curproto.name)) {
                        this.prototypeSelected(curproto, 'dummy');
                    }
                }
            }
        }).then((result: any) => {
            return this.MinemeldConfigService.candidateConfig();
        }).then((cconfig: IMinemeldCandidateConfigNode[]) => {
            return this.decorateConfigNodes(cconfig);
        }).then((result: any) => {
            this.configNodes = result;
            this.loadAvailableInputs();
        }).then(undefined, (error: any) => {
            this.toastr.error('ERROR RETRIEVING CONFIG: ' + error.statusText);
        });
    }

    save(): void {
        this.MinemeldConfigService.addNode(
            this.name,
            {
                inputs: this.inputs,
                output: this.output,
                prototype: this.prototype
            }
        ).then((result: any) => {
            this.toastr.success('NODE ' + this.name + ' SUCCESSFULLY ADDED');
            this.$state.go('config');
        }, (error: any) => {
            this.toastr.error('ERROR ADDING NODE: ' + error.statusText);
        });
    }

    valid(): boolean {
        var namere = /^[a-zA-Z0-9_\-]+$/;
        var ci: IInputNode;
        var existcheck: boolean = false;

        if (this.name.length === 0) {
            return false;
        }

        if (typeof(this.configNodes) === 'undefined') {
            return false;
        }
        this.configNodes.forEach((x: IInputNode) => {
            if (x.name == this.name) {
                existcheck = true;
            }
        });
        if (existcheck) {
            angular.element('#nodename').addClass('has-error');

            return false;
        }

        if (!namere.test(this.name)) {
            angular.element('#nodename').addClass('has-error');

            return false;
        }
        angular.element('#nodename').removeClass('has-error');

        if (!this.availableInputs) {
            return false;
        }

        if (!this.availablePrototypes) {
            return false;
        }

        if (!this.prototype) {
            return false;
        }

        for (ci of this.availableInputs) {
            if (ci.name == this.name) {
                return false;
            }
        }

        if (this.availablePrototypes.filter(
            (x: IPrototypesDescription) => {
                return x.name == this.prototype;
            }).length !== 1) {
            return false;
        }

        return true;
    }

    prototypeSelected($item: IPrototypesDescription, $model: string): void {
        this.selectedPrototype = $item;
        this.inputs = [];
        if (typeof $item === 'undefined') {
            return;
        }

        if ($item.nodeType === 'OUTPUT') {
            this.output = false;
            this.inputsDisabled = false;
            this.inputsLimit = 1;
        } else if ($item.nodeType === 'MINER') {
            this.output = true;
            this.inputsDisabled = true;
            this.inputsLimit = 0;
        } else if ($item.nodeType === 'PROCESSOR') {
            this.output = true;
            this.inputsDisabled = false;
            this.inputsLimit = 1024;
        }

        if (this.configNodes) {
            this.loadAvailableInputs();
        }
    }

    prototypeRemoved($item: IPrototypesDescription, $model: string): void {
        this.selectedPrototype = $item;
        this.inputs = [];
        this.inputsDisabled = false;
        this.inputsLimit = undefined;
    }

    back() {
        this.$rootScope.mmBack('config');
    }

    inputsChanged() {
        this.loadAvailableInputs();
    }

    private loadAvailableInputs(): void {
        var result: IInputNode[];

        this.noInputsChoiceMessage = 'No suitable input nodes found';

        result = this.configNodes;

        if (this.selectedPrototype && this.selectedPrototype.nodeType) {
            result = result.filter((x: IInputNode) => {
                if (x.nodeType === 'UNKNOWN') {
                    return true;
                }
                if (this.selectedPrototype.nodeType === 'PROCESSOR') {
                    if (x.nodeType === 'PROCESSOR') {
                        return true;
                    }
                    if (x.nodeType === 'MINER') {
                        return true;
                    }
                    return false;
                }
                if (this.selectedPrototype.nodeType === 'OUTPUT') {
                    if (x.nodeType === 'PROCESSOR') {
                        return true;
                    }
                    if (x.nodeType === 'MINER') {
                        return true;
                    }
                    return false;
                }
                return false;
            });
            if (this.selectedPrototype && this.selectedPrototype.indicatorTypes) {
                if (this.selectedPrototype.indicatorTypes.length !== 0 &&  this.selectedPrototype.indicatorTypes[0] !== 'any') {
                    result = result.filter((x: IInputNode) => {
                        var x_it: string[];

                        if (!x.indicatorTypes) {
                            return true;
                        }
                        x_it = x.indicatorTypes;

                        if (x_it.length === 0 || x_it[0] === 'any') {
                            return true;
                        }
                        for (var j: number = 0; j < x_it.length; j++) {
                            if (this.selectedPrototype.indicatorTypes.indexOf(x_it[j]) !== -1) {
                                return true;
                            }
                        }
                        return false;
                    });
                }
            }

            if (this.inputsLimit && this.inputs.length >= this.inputsLimit) {
                result = result.filter((x: IInputNode) => {
                    if (this.inputs.indexOf(x.name) !== -1) {
                        return true;
                    }

                    return false;
                });
                this.noInputsChoiceMessage = 'Max number of input nodes for this prototype type reached';
            }
        }

        this.availableInputs = result;
    }

    private decorateConfigNodes(cconfig: IMinemeldCandidateConfigNode[]): angular.IPromise<any> {
        var t: IMinemeldCandidateConfigNode[];
        var p: angular.IPromise<any>[] = [];

        t = cconfig.filter((x: IMinemeldCandidateConfigNode) => {
                if (x.deleted) {
                    return false;
                }
                return true;
            });

        angular.forEach(t, (nc: IMinemeldCandidateConfigNode) => {
            if (typeof nc.properties.prototype === 'undefined') {
                p.push(this.$q((resolve: angular.IQResolveReject<any>) => {
                    resolve({
                        name: nc.name,
                        nodeType: 'UNKNOWN',
                        indicatorTypes: []
                    });
                }));
                return;
            }
            p.push(this.MinemeldPrototypeService.getPrototype(nc.properties.prototype).then((result: any) => {
                var nt: string = 'UNKNOWN';
                var it: string[] = [];

                if (result && result.node_type) {
                    nt = result.node_type.toUpperCase();
                }
                if (result && result.indicator_types) {
                    it = result.indicator_types;
                }
                return { name: nc.name, nodeType: nt, indicatorTypes: it };
            }));
        });

        return this.$q.all(p).then((result: any) => {
            return result;
        });
    }
}
