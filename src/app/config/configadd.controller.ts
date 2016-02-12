/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldConfigService, IMinemeldConfigNode } from  '../../app/services/config';
import { IMinemeldPrototypeService } from '../../app/services/prototype';

interface IPrototypesDescription {
    name: string;
    libraryName: string;
    prototypeName: string;
    prototypeDescription?: string;
    libraryDescription?: string;
    developmentStatus?: string;
    nodeType?: string;
}

export class ConfigAddController {
    MinemeldPrototype: IMinemeldPrototypeService;
    MinemeldConfig: IMinemeldConfigService;
    toastr: any;
    $state: angular.ui.IStateService;
    $stateParams: angular.ui.IStateParamsService;
    $rootScope: any;

    availablePrototypes: IPrototypesDescription[] = new Array();
    availableInputs: string[];

    name: string = 'node-' + (new Date().getTime());
    prototype: string;
    inputs: string[] = new Array();
    output: boolean = false;

    selectedPrototype: IPrototypesDescription;

    /* @ngInject */
    constructor(MinemeldPrototype: IMinemeldPrototypeService,
                MinemeldConfig: IMinemeldConfigService,
                toastr: any, $state: angular.ui.IStateService,
                $stateParams: angular.ui.IStateParamsService,
                $rootScope: angular.IRootScopeService) {
        var p: string;
        var toks: string[];

        this.$rootScope = $rootScope;
        this.MinemeldPrototype = MinemeldPrototype;
        this.MinemeldConfig = MinemeldConfig;
        this.toastr = toastr;
        this.$state = $state;
        this.$stateParams = $stateParams;

        p = this.$stateParams['prototype'];
        if (p !== 'none') {
            this.prototype = p;

            toks = p.split('.');
            this.name = toks[toks.length - 1] + '-' +(new Date().getTime());
        }

        this.MinemeldPrototype.getPrototypeLibraries().then((result: any) => {
            var l: string;
            var p: string;
            var nt: string;

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

                    this.availablePrototypes.push({
                        name: l + '.' + p,
                        libraryName: l,
                        prototypeName: p,
                        libraryDescription: result[l].description,
                        prototypeDescription: result[l].prototypes[p].description,
                        developmentStatus: result[l].prototypes[p].development_status,
                        nodeType: nt
                    });
                }
            }
        }, (error: any) => {
            this.toastr.error('ERROR RETRIEVING PROTOTYPES: ' + error.statusText);
        });

        this.MinemeldConfig.refresh().then((result: any) => {
            this.availableInputs = this.MinemeldConfig.nodesConfig
                .filter((x: IMinemeldConfigNode) => {
                    if (x.deleted) {
                        return false;
                    }
                    return true;
                })
                .map((x: IMinemeldConfigNode) => { return x.name; });
        }, (error: any) => {
            this.toastr.error('ERROR RETRIEVING CONFIG: ' + error.statusText);
        });
    }

    save(): void {
        this.MinemeldConfig.addNode(
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

        if (!this.availableInputs) {
            return false;
        }

        if (!this.availablePrototypes) {
            return false;
        }

        if (!this.prototype) {
            return false;
        }

        if (this.name.length === 0) {
            return false;
        }

        if (!namere.test(this.name)) {
            return false;
        }

        if (this.availableInputs.indexOf(this.name) > -1) {
            return false;
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
    }

    prototypeRemoved($item: IPrototypesDescription, $model: string): void {
        this.selectedPrototype = $item;
    }

    back() {
        this.$rootScope.mmBack('config');
    }
}
