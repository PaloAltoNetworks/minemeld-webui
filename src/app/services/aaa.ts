/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService, IMineMeldAPIResource } from './minemeldapi';

export interface IMinemeldAAAUserAttributes {
    comment?: string;
    tags?: string[];
}

export interface IMinemeldAAAUsers {
    enabled: boolean;
    users: {
        [key: string]: IMinemeldAAAUserAttributes;
    };
}

export interface IMinemeldAAAFeedAttributes {
    tags?: string[];
}

export interface IMinemeldAAAFeeds {
    enabled: boolean;
    feeds: {
        [key: string]: IMinemeldAAAFeedAttributes;
    };
}

export interface IMinemeldCurrentUser {
    id: string;
    read_write: boolean;
}

export interface IMinemeldAAAService {
    getCurrentUser(): angular.IPromise<IMinemeldCurrentUser>;
    getUsers(subsystem: string): angular.IPromise<IMinemeldAAAUsers>;
    setUserPassword(subsystem: string, username: string, password: string): angular.IPromise<any>;
    setUserAttributes(subsystem: string, username: string, attributes: IMinemeldAAAUserAttributes): angular.IPromise<any>;
    deleteUser(subsystem: string, username: string): angular.IPromise<any>;
    getFeeds(): angular.IPromise<IMinemeldAAAFeeds>;
    setFeedAttributes(feed: string, attributes: IMinemeldAAAFeedAttributes): angular.IPromise<any>;
    deleteFeed(feed: string): angular.IPromise<any>;
    getTags(): angular.IPromise<string[]>;
}

interface IMinemeldAAAResource extends angular.resource.IResourceClass<angular.resource.IResource<any>> {
    put(params: any, putdata: any);
    del(params: any);
    post(params: any, postdata: any);
}

export class MinemeldAAAService implements IMinemeldAAAService {
    $state: angular.ui.IStateService;
    $q: angular.IQService;
    MineMeldAPIService: IMineMeldAPIService;

    /** @ngInject */
    constructor($state: angular.ui.IStateService,
                $q: angular.IQService,
                MineMeldAPIService: IMineMeldAPIService) {
        this.$state = $state;
        this.$q = $q;
        this.MineMeldAPIService = MineMeldAPIService;
    }

    getCurrentUser(): angular.IPromise<IMinemeldCurrentUser> {
        var api: IMineMeldAPIResource;

        api = <IMineMeldAPIResource>(this.MineMeldAPIService.getAPIResource('/aaa/users/current', {},
        {
            get: {
                method: 'GET'
            }
        }, false));

        return api.get().$promise.then((result: any) => {
            return result.result;
        });
    }

    getUsers(subsystem: string): angular.IPromise<IMinemeldAAAUsers> {
        var r: IMinemeldAAAResource;

        r = <IMinemeldAAAResource>(this.MineMeldAPIService.getAPIResource('/aaa/users/:subsystem', {
            subsystem: subsystem
        }, {
            get: {
                method: 'GET'
            }
        }));

        return r.get().$promise.then((result: any) => {
            return result.result;
        });
    }

    setUserPassword(subsystem: string, username: string, password: string): angular.IPromise<any> {
        var r: IMinemeldAAAResource;

        r = <IMinemeldAAAResource>(this.MineMeldAPIService.getAPIResource('/aaa/users/:subsystem/:username', {
            subsystem: subsystem,
            username: username
        }, {
            put: {
                method: 'PUT'
            }
        }, false));

        return r.put({}, JSON.stringify({ password: password })).$promise.then((result: any) => {
            return result.result;
        });
    }

    setUserAttributes(subsystem: string, username: string, attributes: IMinemeldAAAUserAttributes): angular.IPromise<any> {
        var r: IMinemeldAAAResource;

        r = <IMinemeldAAAResource>(this.MineMeldAPIService.getAPIResource('/aaa/users/:subsystem/:username/attributes', {
            subsystem: subsystem,
            username: username
        }, {
            post: {
                method: 'POST'
            }
        }, false));

        return r.post({}, JSON.stringify(attributes)).$promise.then((result: any) => {
            return result.result;
        });
    }

    deleteUser(subsystem: string, username: string): angular.IPromise<any> {
        var r: IMinemeldAAAResource;

        r = <IMinemeldAAAResource>(this.MineMeldAPIService.getAPIResource('/aaa/users/:subsystem/:username', {
            subsystem: subsystem,
            username: username
        }, {
            del: {
                method: 'DELETE'
            }
        }, false));

        return r.del({}).$promise.then((result: any) => {
            return result.result;
        });
    }

    getFeeds(): angular.IPromise<IMinemeldAAAFeeds> {
        var r: IMinemeldAAAResource;

        r = <IMinemeldAAAResource>(this.MineMeldAPIService.getAPIResource('/aaa/feeds', {},
        {
            get: {
                method: 'GET'
            }
        }));

        return r.get().$promise.then((result: any) => {
            return result.result;
        });
    }

    setFeedAttributes(feed: string, attributes: IMinemeldAAAFeedAttributes): angular.IPromise<any> {
        var r: IMinemeldAAAResource;

        r = <IMinemeldAAAResource>(this.MineMeldAPIService.getAPIResource('/aaa/feeds/:feed/attributes', {
            feed: feed
        }, {
            post: {
                method: 'POST'
            }
        }, false));

        return r.post({}, JSON.stringify(attributes)).$promise.then((result: any) => {
            return result.result;
        });
    }

    deleteFeed(feed: string): angular.IPromise<any> {
        var r: IMinemeldAAAResource;

        r = <IMinemeldAAAResource>(this.MineMeldAPIService.getAPIResource('/aaa/feeds/:feed', {
            feed: feed
        }, {
            del: {
                method: 'DELETE'
            }
        }, false));

        return r.del({}).$promise.then((result: any) => {
            return result.result;
        });
    }

    getTags(): angular.IPromise<string[]> {
        var r: IMinemeldAAAResource;

        r = <IMinemeldAAAResource>(this.MineMeldAPIService.getAPIResource('/aaa/tags', {}, {
            get: {
                method: 'GET'
            }
        }));

        return r.get({}).$promise.then((result: any) => {
            return result.result;
        });
    }
}
