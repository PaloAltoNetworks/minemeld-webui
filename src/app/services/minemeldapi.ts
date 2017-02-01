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
    onLogin(listener: any): void;
    onLogout(listener: any): void;
    isLoggedIn(): boolean;
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
    $cookies: angular.cookies.ICookiesService;
    $rootScope: angular.IRootScopeService;

    loggedIn: boolean = false;

    /** @ngInject */
    constructor($resource: angular.resource.IResourceService,
                $state: angular.ui.IStateService,
                $httpParamSerializer: angular.IHttpParamSerializer,
                $cookies: angular.cookies.ICookiesService,
                $rootScope: angular.IRootScopeService) {
        this.$resource = $resource;
        this.$httpParamSerializer = $httpParamSerializer;
        this.$state = $state;
        this.$cookies = $cookies;
        this.$rootScope = $rootScope;

        if ($cookies.get('mm-ec-login')) {
            this.loggedIn = true;
        }
    }

    public getAPIResource(url: string, paramDefaults?: any, actions?: any, cancellable?: boolean): IMineMeldAPIResource {
        var result: IMineMeldAPIResource;
        var vm: MineMeldAPIService = this;

        if (typeof cancellable === 'undefined') {
            cancellable = true;
        }

        angular.forEach(actions, (action: angular.resource.IActionDescriptor, actionName: string) => {
            action.cancellable = true;
            action.timeout = 45000;

            if (typeof action.headers === 'undefined') {
                action.headers = {};
            }
            action.headers['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
            action.headers['Cache-Control'] = 'no-cache';
            action.headers['Pragma'] = 'no-cache';

            if (typeof action.params === 'undefined') {
                action.params = {};
            }
            action.params['_'] = (): string => { return '' + Math.floor(Date.now() / 1000); };
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
                    .then(() => {
                        vm.setLoggedIn(true);
                    }, (error: any) => {
                        if (error.status === 401) {
                            vm.$state.go('login');
                            vm.setLoggedIn(false);
                            throw error;
                        }

                        if (promise.cancelled) {
                            error.cancelled = true;
                        } else {
                            if (error.status === -1) {
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

        this.setLoggedIn(false);

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
        }).$promise.then(() => {
            this.setLoggedIn(true);
        });
    }

    public logOut(): angular.IPromise<any> {
        var logoutResource: IMineMeldAPIResourceLogOut;

        logoutResource = <IMineMeldAPIResourceLogOut>this.$resource('/logout', {}, {
            get: {
                method: 'GET'
            }
        });

        return logoutResource.get().$promise.finally(() => {
            this.setLoggedIn(false);
        });
    }

    public isLoggedIn(): boolean {
        return this.loggedIn;
    }

    public cancelAPICalls(): void {
        this.outstanding.forEach((value: IMineMeldAPIPromise) => {
            if (!value.resolved && value.cancellable) {
                value.cancelled = true;
                value.resource.$cancelRequest();
            }
        });
    }

    public onLogin(listener: any): void {
        this.$rootScope.$on('mm-login', listener);
    }

    public onLogout(listener: any): void {
        this.$rootScope.$on('mm-logout', listener);
    }

    private setLoggedIn(status: boolean): void {
        if (status == this.loggedIn) {
            return;
        }

        this.loggedIn = status;
        if (status) {
            this.$cookies.put('mm-ec-login', '1');
            this.$rootScope.$emit('mm-login');
        } else {
            this.$cookies.remove('mm-ec-login');
            this.$cookies.remove('mm-session');
            this.$rootScope.$emit('mm-logout');
        }
    }
}
