/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldPrototypeService, IMinemeldPrototypeLibrary, IMinemeldPrototype } from '../../app/services/prototype';

declare var YAML: any;

export class PrototypeEditController {
    MinemeldPrototype: IMinemeldPrototypeService;
    $state: angular.ui.IStateService;

    localLibrary: IMinemeldPrototypeLibrary;
    prototype: string;

    name: string;
    class: string;
    description: string;
    nodeType: string;
    developmentStatus: string;
    config: string;

    /* @ngInject */
    constructor(MinemeldPrototype: IMinemeldPrototypeService,
                $stateParams: angular.ui.IStateParamsService,
                $state:angular.ui.IStateService,
                toastr: any) {
        var toks: string[];

        this.$state = $state;

        this.MinemeldPrototype = MinemeldPrototype;

        this.prototype = $stateParams['prototype'];
        this.name = this.prototype.split('.').join('_');
        this.name = this.name + '-' + (new Date().getTime());

        MinemeldPrototype.getPrototypeLibrary('minemeldlocal')
        .then((result: any) => {
            this.localLibrary = result;
        }, (error: any) => {
            toastr.error('ERROR RETRIEVING LOCAL PROTOTYPE LIBRARY: ' + error.statusText);
        });

        MinemeldPrototype.getPrototypeYaml(this.prototype).then((result: IMinemeldPrototype) => {
            this.class = result.class;
            this.description = result.description;
            this.nodeType = result.nodeType;
            this.developmentStatus = result.developmentStatus;
            this.config = result.config;
        }, (error: any) => {
            toastr.error('ERROR RETRIEVING PROTOTYPE ' + this.prototype + ': ' + error.statusText);
        });
    }
}
