/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService } from './minemeldapi';
import { IMinemeldAAAService, IMinemeldCurrentUser } from './aaa';

export interface IMineMeldCurrentUserService {
    getReadWrite(): angular.IPromise<boolean>;
}

export class MineMeldCurrentUserService implements IMineMeldCurrentUserService {
    MineMeldAPIService: IMineMeldAPIService;
    MinemeldAAAService: IMinemeldAAAService;
    $q: angular.IQService;
    toastr: any;

    readWriteDeferred: ng.IDeferred<boolean>;
    currentUser: IMinemeldCurrentUser;

    /** @ngInject */
    constructor(MinemeldAAAService: IMinemeldAAAService,
                MineMeldAPIService: IMineMeldAPIService,
                $q: angular.IQService,
                toastr: any) {
        this.MinemeldAAAService = MinemeldAAAService;
        this.MineMeldAPIService = MineMeldAPIService;
        this.toastr = toastr;
        this.$q = $q;

        this.readWriteDeferred = $q.defer<boolean>();
        this.currentUser = {
            id: undefined,
            read_write: false
        };

        this.MineMeldAPIService.onLogin(this.initCurrentUser.bind(this));
        this.MineMeldAPIService.onLogout(this.destroyCurrentUser.bind(this));
        if (this.MineMeldAPIService.isLoggedIn()) {
            this.initCurrentUser();
        }
    }

    getReadWrite(): angular.IPromise<boolean> {
        return this.readWriteDeferred.promise;
    }

    private initCurrentUser(): void {
        this.MinemeldAAAService.getCurrentUser().then((result: IMinemeldCurrentUser) => {
            this.currentUser = result;
            this.readWriteDeferred.resolve(this.currentUser.read_write);
        }, (error: any) => {
            if (error.status == 401) {
                return;
            }

            this.toastr.error('ERROR RETRIEVING CURRENT USER: ' + error.statusText);
        });
    }

    private destroyCurrentUser(): void {
        this.currentUser = {
            id: undefined,
            read_write: false
        };
        this.readWriteDeferred = this.$q.defer<boolean>();
    }
}
