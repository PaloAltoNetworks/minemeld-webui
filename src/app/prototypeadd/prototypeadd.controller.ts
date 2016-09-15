/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldPrototypeService, IMinemeldPrototypeLibrary, IMinemeldPrototype, IMinemeldPrototypeMetadata } from '../../app/services/prototype';

declare var jsyaml: any;

export class PrototypeAddController {
    MinemeldPrototypeService: IMinemeldPrototypeService;
    $state: angular.ui.IStateService;
    $rootScope: any;
    toastr: any;

    localLibrary: IMinemeldPrototypeLibrary;
    prototype: string;

    name: string;
    class: string;
    description: string;
    nodeType: string;
    developmentStatus: string;
    config: string;

    saving: boolean = false;

    availableTypes: string[] = [
        'miner',
        'processor',
        'output'
    ];

    availableDevelopmentStatuses: string[] = [
        'STABLE',
        'EXPERIMENTAL'
    ];

    /* @ngInject */
    constructor(MinemeldPrototypeService: IMinemeldPrototypeService,
                $stateParams: angular.ui.IStateParamsService,
                $state: angular.ui.IStateService,
                toastr: any,
                $rootScope: angular.IRootScopeService) {
        this.$state = $state;
        this.MinemeldPrototypeService = MinemeldPrototypeService;
        this.toastr = toastr;
        this.$rootScope = $rootScope;

        if ($stateParams['prototype'] === 'none') {
            this.$state.go('config');
            return;
        }

        this.prototype = $stateParams['prototype'];
        this.name = this.prototype.split('.').join('_');
        this.name = this.name + '-' + (new Date().getTime());

        MinemeldPrototypeService.getPrototypeLibrary('minemeldlocal')
        .then((result: any) => {
            this.localLibrary = result;
        }, (error: any) => {
            toastr.error('ERROR RETRIEVING LOCAL PROTOTYPE LIBRARY: ' + error.statusText);
        });

        MinemeldPrototypeService.getPrototypeYaml(this.prototype).then((result: IMinemeldPrototype) => {
            this.class = result.class;
            this.description = result.description;
            this.nodeType = result.nodeType;
            this.developmentStatus = result.developmentStatus;
            this.config = result.config;
        }, (error: any) => {
            toastr.error('ERROR RETRIEVING PROTOTYPE ' + this.prototype + ': ' + error.statusText);
        });
    }

    editorLoaded(editor_: any): void {
        editor_.setShowInvisibles(false);

        angular.element('.ace_text-input').on('focus', (event: any) => {
            angular.element(event.currentTarget.parentNode).addClass('ace-focus');
        });
        angular.element('.ace_text-input').on('blur', (event: any) => {
            angular.element(event.currentTarget.parentNode).removeClass('ace-focus');
        });
    }

    valid(): boolean {
        var result: boolean = true;
        var config: any;

        if (this.saving) {
            result = false;
        }

        if (!this.name) {
            result = false;
            angular.element('#fgName').addClass('has-error');
        } else {
            if (this.name.indexOf('.') !== -1 || (this.localLibrary && this.name in this.localLibrary.prototypes)) {
                angular.element('#fgName').addClass('has-error');
                result = false;
            } else {
                angular.element('#fgName').removeClass('has-error');
            }
        }

        if (!this.class) {
            result = false;
        }

        try {
            if (this.config) {
                config = jsyaml.safeLoad(this.config);
                if (typeof(config) !== 'object') {
                    throw 'config is not a valid object';
                }
                angular.element('#fgConfig').removeClass('has-error');
            }
        } catch (err) {
            angular.element('#fgConfig').addClass('has-error');

            result = false;
        }

        return result;
    }

    save(): void {
        var optionalParams: IMinemeldPrototypeMetadata = {};
        var full_prototypename: string = 'minemeldlocal.' + this.name;

        if (this.description) {
            optionalParams.description = this.description;
        }

        if (this.developmentStatus) {
            optionalParams.developmentStatus = this.developmentStatus;
        }

        if (this.nodeType) {
            optionalParams.nodeType = this.nodeType;
        }

        this.saving = true;
        this.MinemeldPrototypeService.setPrototypeYaml(
            full_prototypename,
            this.class,
            this.config,
            optionalParams
        ).then((result: any) => {
            this.toastr.success('PROTOTYPE ' + full_prototypename + ' ADDED');
            this.MinemeldPrototypeService.invalidateCache();
            this.$state.go('prototypes', { reload: true });
        }, (error: any) => {
            this.toastr.error('ERROR ADDING PROTOTYPE ' + full_prototypename + ': ' + error.statusText);
            this.saving = false;
        });
    }

    back(): void {
        this.$rootScope.mmBack('prototypes');
    }
}
