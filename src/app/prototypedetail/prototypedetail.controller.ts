/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldPrototypeService, IMinemeldPrototypeLibrary, IMinemeldPrototype } from '../../app/services/prototype';

export class PrototypedetailController {
    MinemeldPrototypeService: IMinemeldPrototypeService;
    $state: angular.ui.IStateService;

    prototypeName: string;
    libraryName: string;
    library: IMinemeldPrototypeLibrary;
    prototype: IMinemeldPrototype;

    /* @ngInject */
    constructor(MinemeldPrototypeService: IMinemeldPrototypeService,
                $stateParams: angular.ui.IStateParamsService,
                $state: angular.ui.IStateService,
                toastr: any) {
        this.$state = $state;

        this.MinemeldPrototypeService = MinemeldPrototypeService;

        this.libraryName = $stateParams['libraryName'];
        this.prototypeName = $stateParams['prototypeName'];

        MinemeldPrototypeService.getPrototypeLibrary($stateParams['libraryName'])
        .then((result: any) => {
            this.library = result;
            this.prototype = this.library.prototypes[$stateParams['prototypeName']];
        }, (error: any) => {
            toastr.error('ERROR RETRIEVING PROTOTYPES: ' + error.statusText);
        });
    }
}
