/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldConfigService, IMinemeldConfigInfo, IMinemeldConfigNode } from  '../../app/services/config';
import { IMinemeldPrototypeService, IMinemeldPrototypeLibraryDictionary } from '../../app/services/prototype';
import { IConfirmService } from '../../app/services/confirm';

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
                toastr: any, $state: angular.ui.IStateService) {
        this.MinemeldPrototype = MinemeldPrototype;
        this.MinemeldConfig = MinemeldConfig;
        this.toastr = toastr;
        this.$state = $state;

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
            this.availableInputs = this.MinemeldConfig.nodesConfig.map((x: IMinemeldConfigNode) => { return x.name; });
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
        if (!this.availableInputs) {
            return false;
        }

        if (!this.availablePrototypes) {
            return false;
        }

        if (!this.prototype) {
            return false;
        }

        if (this.name.length == 0) {
            return false;
        }

        if (this.name in this.availableInputs) {
            return false;
        }

        if (this.availablePrototypes.filter(
            (x: IPrototypesDescription) => {
                return x.name == this.prototype; 
            }).length != 1) {
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
}
