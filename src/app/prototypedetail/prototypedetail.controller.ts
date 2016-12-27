/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldPrototypeService, IMinemeldPrototypeLibrary, IMinemeldPrototype } from '../../app/services/prototype';
import { IConfirmService } from '../../app/services/confirm';

export class PrototypedetailController {
    MinemeldPrototypeService: IMinemeldPrototypeService;
    $rootScope: any;
    $state: angular.ui.IStateService;
    toastr: any;
    ConfirmService: IConfirmService;

    prototypeName: string;
    libraryName: string;
    library: IMinemeldPrototypeLibrary;
    prototype: IMinemeldPrototype;

    /* @ngInject */
    constructor(MinemeldPrototypeService: IMinemeldPrototypeService,
                $stateParams: angular.ui.IStateParamsService,
                $rootScope: angular.IRootScopeService,
                $state: angular.ui.IStateService,
                ConfirmService: IConfirmService,
                toastr: any) {
        this.$state = $state;
        this.$rootScope = $rootScope;
        this.toastr = toastr;
        this.ConfirmService = ConfirmService;

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

    public delete() {
        this.ConfirmService.show(
            'DELETE PROTOTYPE',
            'Are you sure you want to delete prototype ' + this.libraryName + '.' + this.prototypeName + ' ?'
        ).then((result: any) => {
            this.MinemeldPrototypeService.deletePrototype(this.libraryName + '.' + this.prototypeName).then((result: any) => {
                this.toastr.success(this.libraryName + '.' + this.prototypeName + ' DELETED');
                this.MinemeldPrototypeService.invalidateCache();
                this.$rootScope.mmBack('prototypes');
            }, (error: any) => {
                if (error.status === 400) {
                    this.toastr.error('ERROR DELETING ' + this.libraryName + '.' + this.prototypeName + ': ' + error.data.error.message);
                } else {
                    this.toastr.error('ERROR DELETING ' + this.libraryName + '.' + this.prototypeName + ': ' + error.statusText);
                }
            });
        });
    }
}
