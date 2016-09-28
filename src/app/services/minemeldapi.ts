/// <reference path="../../../typings/main.d.ts" />

interface IMineMeldAPIPromise {
    resource: angular.resource.IResource<any>;
    resolved: boolean;
    cancelled: boolean;
    cancellable: boolean;
}

export interface IMineMeldAPIResource extends angular.resource.IResourceClass<angular.resource.IResource<any>> {
}

export interface IMineMeldAPIService {
    getAPIResource(url: string, paramDefaults?: any, actions?: any, cancellable?: boolean): IMineMeldAPIResource;
    logIn(username: string, password: string): angular.IPromise<any>;
    logOut(): angular.IPromise<any>;
    cancelAPICalls(): void;
}

interface IMineMeldAPIResourceLogIn extends IMineMeldAPIResource {
    post(params: Object, data: Object, success?: Function, error?: Function): angular.resource.IResource<any>;
}

interface IMineMeldAPIResourceLogOut extends IMineMeldAPIResource {
}

export class MineMeldAPIService implements IMineMeldAPIService {
    outstanding: IMineMeldAPIPromise[] = [];

    $resource: angular.resource.IResourceService;
    $httpParamSerializer: angular.IHttpParamSerializer;
    $state: angular.ui.IStateService;

    /** @ngInject */
    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService,
                $httpParamSerializer: angular.IHttpParamSerializer) {
        this.$resource = $resource;
        this.$httpParamSerializer = $httpParamSerializer;
        this.$state = $state;
    }

    public getAPIResource(url: string, paramDefaults?: any, actions?: any, cancellable?: boolean): IMineMeldAPIResource {
        var result: IMineMeldAPIResource;
        var vm: MineMeldAPIService = this;

        if (typeof cancellable == 'undefined') {
            cancellable = true;
        }

        angular.forEach(actions, (action: angular.resource.IActionDescriptor, actionName: string) => {
            action.cancellable = true;
            action.timeout = 45000;
        });

        result = <IMineMeldAPIResource>this.$resource(url, paramDefaults, actions);

        angular.forEach(actions, (action: angular.resource.IActionDescriptor, actionName: string) => {
            var origAction: any = result[actionName];

            result[actionName] = function(...args: any[]) {
                var promise: IMineMeldAPIPromise;
                var origResult: angular.resource.IResource<any>;

                origResult = origAction.apply(null, args);
                promise = {
                    resource: origResult,
                    cancellable: cancellable,
                    cancelled: false,
                    resolved: false
                };

                origResult.$promise
                    .catch((error: any) => {
                        if (error.status === 401) {
                            vm.$state.go('login');
                            throw error;
                        }

                        if (promise.cancelled) {
                            error.cancelled = true;
                        } else {
                            if (error.status == -1) {
                                error.statusText = 'Timeout';
                            }
                        }

                        throw error;
                    })
                    .finally(() => {
                        promise.resolved = true;
                    });

                vm.outstanding = vm.outstanding.filter((value: IMineMeldAPIPromise) => {
                    return !value.resolved;
                });
                vm.outstanding.push(promise);

                return origResult;
            };
        });

        return result;
    }

    public logIn(username: string, password: string): angular.IPromise<any> {
        var loginResource: IMineMeldAPIResourceLogIn;
        var vm: MineMeldAPIService = this;

        loginResource = <IMineMeldAPIResourceLogIn>this.getAPIResource('/login', {}, {
                post: {
                    method: 'POST',
                    headers : {'Content-Type': 'application/x-www-form-urlencoded'},
                    transformRequest: function(data: Object) {
                        return vm.$httpParamSerializer(data);
                    }
                }
            }
        );

        return loginResource.post({}, {
            u: username,
            p: password
        }).$promise;
    }

    public logOut(): angular.IPromise<any> {
        var logoutResource: IMineMeldAPIResourceLogOut;

        logoutResource = <IMineMeldAPIResourceLogOut>this.getAPIResource('/logout', {}, {
            get: {
                method: 'GET'
            }
        });

        return logoutResource.get().$promise;
    }

    public cancelAPICalls(): void {
        this.outstanding.forEach((value: IMineMeldAPIPromise) => {
            if (!value.resolved && value.cancellable) {
                value.cancelled = true;
                value.resource.$cancelRequest();
            }
        });
    }
}
