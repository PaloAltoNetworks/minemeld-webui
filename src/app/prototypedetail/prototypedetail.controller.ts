/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldPrototypeService, IMinemeldPrototypeLibrary, IMinemeldPrototype } from '../../app/services/prototype';

export class PrototypedetailController {
    MinemeldPrototype: IMinemeldPrototypeService;
    $state: angular.ui.IStateService;

    prototypeName: string;
    libraryName: string;
    library: IMinemeldPrototypeLibrary;
    prototype: IMinemeldPrototype;

    /* @ngInject */
    constructor(MinemeldPrototype: IMinemeldPrototypeService,
                $stateParams: angular.ui.IStateParamsService,
                $state: angular.ui.IStateService,
                toastr: any) {
        this.$state = $state;

        this.MinemeldPrototype = MinemeldPrototype;

        this.libraryName = $stateParams['libraryName'];
        this.prototypeName = $stateParams['prototypeName'];

        MinemeldPrototype.getPrototypeLibrary($stateParams['libraryName'])
        .then((result: any) => {
            this.library = result;
            this.prototype = this.library.prototypes[$stateParams['prototypeName']];
        }, (error: any) => {
            toastr.error('ERROR RETRIEVING PROTOTYPES: ' + error.statusText);
        });
    }
}
