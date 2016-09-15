/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService } from './minemeldapi';

export interface IMinemeldValidateService {
    syslogMinerRule(rule: any): angular.IPromise<any>;
}

interface IMinemeldValidateResource extends angular.resource.IResourceClass<angular.resource.IResource<any>> {
    post(params: any, postdata: any);
}

export class MinemeldValidateService implements IMinemeldValidateService {
    $state: angular.ui.IStateService;
    $q: angular.IQService;
    MineMeldAPIService: IMineMeldAPIService;

    /** @ngInject */
    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService,
                $q: angular.IQService,
                MineMeldAPIService: IMineMeldAPIService) {
        this.$state = $state;
        this.$q = $q;
        this.MineMeldAPIService = MineMeldAPIService;
    }

    syslogMinerRule(rule: any): angular.IPromise<any> {
        var r: IMinemeldValidateResource;

        r = <IMinemeldValidateResource>(this.MineMeldAPIService.getAPIResource('/validate/syslogminerrule', {}, {
            post: {
                    method: 'POST'
                }
        }));

        return r.post({}, JSON.stringify(rule)).$promise
            .then((result: any) => {
                return result.result;
            });
    }
}
