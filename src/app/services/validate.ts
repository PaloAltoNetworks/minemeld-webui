/// <reference path="../../../.tmp/typings/tsd.d.ts" />

import { IMinemeldAuth } from './auth';

export interface IMinemeldValidateService {
    syslogMinerRule(rule: any): angular.IPromise<any>;
}

interface IMinemeldValidateResource extends angular.resource.IResourceClass<angular.resource.IResource<any>> {
    post(params: any, postdata: any);
}

export class MinemeldValidate implements IMinemeldValidateService {
    static $inject = ['$resource', '$state', '$q', 'MinemeldAuth'];

    $resource: angular.resource.IResourceService;
    $state: angular.ui.IStateService;
    $q: angular.IQService;
    MinemeldAuth: IMinemeldAuth;

    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService,
                $q: angular.IQService,
                MinemeldAuth: IMinemeldAuth) {
        this.$resource = $resource;
        this.$state = $state;
        this.$q = $q;
        this.MinemeldAuth = MinemeldAuth;
    }

    syslogMinerRule(rule: any): angular.IPromise<any> {
        var r: IMinemeldValidateResource;

        if (!this.MinemeldAuth.authorizationSet) {
            this.$state.go('login');
            return;
        }

        r = <IMinemeldValidateResource>(this.$resource('/validate/syslogminerrule', {}, {
            post: {
                    method: 'POST',
                    headers: this.MinemeldAuth.getAuthorizationHeaders()
                }
        }));

        return r.post({}, JSON.stringify(rule)).$promise
            .then((result: any) => {
                return result.result;
            });
    }
}
