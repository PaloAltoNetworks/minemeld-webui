/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldExtensionsService, IMineMeldExtension } from './extensions';
import { IMineMeldAPIService } from './minemeldapi';

export interface IMineMeldWebUIExtensionsLoaderService {
}

export class MineMeldWebUIExtensionsLoaderService implements IMineMeldWebUIExtensionsLoaderService {
    MineMeldAPIService: IMineMeldAPIService;
    MineMeldExtensionService: IMineMeldExtensionsService;
    toastr: any;
    $ocLazyLoad: any;

    /** @ngInject */
    constructor(MineMeldExtensionsService: IMineMeldExtensionsService,
                MineMeldAPIService: IMineMeldAPIService,
                $ocLazyLoad: any,
                toastr: any) {
        this.MineMeldExtensionService = MineMeldExtensionsService;
        this.MineMeldAPIService = MineMeldAPIService;
        this.toastr = toastr;
        this.$ocLazyLoad = $ocLazyLoad;

        this.MineMeldAPIService.onLogin(this.loadWebUIExtensions.bind(this));
        if (this.MineMeldAPIService.isLoggedIn()) {
            this.loadWebUIExtensions();
        }
    }

    private loadWebUIExtensions(): void {
        this.MineMeldExtensionService.list(false).then((extensions: IMineMeldExtension[]) => {
            var webuiExtensions: string[] = [];

            angular.forEach(extensions, (extension: IMineMeldExtension) => {
                if (!extension.entry_points) {
                    return;
                }

                if (!('minemeld_webui' in extension.entry_points)) {
                    return;
                }

                angular.forEach((<Object>extension.entry_points['minemeld_webui']), (value: any, key: string) => {
                    webuiExtensions.push(key);
                });
            });

            angular.forEach(webuiExtensions, (extname: string) => {
                this.$ocLazyLoad.load('/extensions/webui/' + extname + '/extension.js', { cache: false }).then(() => {
                    console.log('Loaded ' + extname + ' extension');
                });
            });
        }, (error: any) => {
            if (this.MineMeldAPIService.isLoggedIn()) {
                this.toastr.error('ERROR RETRIEVING MINEMELD EXTENSIONS: ' + error.statusText);
            }
        });
    }
}
