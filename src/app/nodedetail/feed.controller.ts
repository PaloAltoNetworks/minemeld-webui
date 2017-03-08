/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService } from '../../app/services/status';
import { NodeDetailInfoController } from './nodedetail.info.controller';
import { IThrottleService } from '../../app/services/throttle';
import { IMinemeldAAAService, IMinemeldAAAFeeds } from '../../app/services/aaa';
import { IMinemeldConfigService } from '../../app/services/config';

export class ConfigureTagsController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    tags: string[] = [];
    availableTags: string[];
    changed: boolean = false;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                tags: string[], availableTags: string[]) {
        this.$modalInstance = $modalInstance;
        if (tags) {
            this.tags = tags;
        }
        this.availableTags = availableTags;
        this.availableTags.push('any');
        this.availableTags.push('anonymous');
    }

    save() {
        this.$modalInstance.close(this.tags);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}

export class NodeDetailFeedInfoController extends NodeDetailInfoController {
    $modal: angular.ui.bootstrap.IModalService;
    MinemeldAAAService: IMinemeldAAAService;

    auth_enabled: boolean = false;
    tags: string[];
    tags_tooltip: string = 'authentication disabled';

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
        MinemeldStatusService: IMinemeldStatusService,
        moment: moment.MomentStatic, $scope: angular.IScope,
        $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $stateParams: angular.ui.IStateParamsService, MinemeldConfigService: IMinemeldConfigService,
        $modal: angular.ui.bootstrap.IModalService,
        $rootScope: angular.IRootScopeService,
        ThrottleService: IThrottleService,
        MinemeldAAAService: IMinemeldAAAService) {
        super(
            toastr, $interval, MinemeldStatusService, moment, $scope,
            $compile, $state, $stateParams, $rootScope, ThrottleService
        );

        this.$modal = $modal;
        this.MinemeldAAAService = MinemeldAAAService;

        this.loadTags();
    }

    configureTags(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/feed.tags.modal.html',
            controller: ConfigureTagsController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                tags: () => {
                    return this.tags;
                },
                availableTags: this.MinemeldAAAService.getTags()
            },
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            if (!result || result.length === 0) {
                this.tags = [];
            } else {
                this.tags = result;
            }

            this.MinemeldAAAService.setFeedAttributes(
                this.nodename,
                { tags: this.tags }
            ).then((result: any) => {
                this.loadTags();
            }, (error: any) => {
                this.toastr.error('ERROR SAVING TAGS: ' + error.statusText);
                this.loadTags();
            });
        });
    }

    private loadTags(): void {
        this.MinemeldAAAService.getFeeds().then((result: IMinemeldAAAFeeds) => {
            console.log(result);
            this.auth_enabled = result.enabled;
            if (this.auth_enabled) {
                this.tags_tooltip = 'configure tags';
            }
            if (result.feeds.hasOwnProperty(this.nodename)) {
                this.tags = result.feeds[this.nodename].tags;
            }
        }, (error: any) => {
            if (!error.cancelled) {
                this.toastr.error('ERROR LOADING FEEDS ATTRIBUTES: ' + error.statusText);
            }

            throw error;
        });
    }
}

console.log('Loading Feed');
angular.module('minemeldWebui')
    .controller('NodeDetailFeedInfoController', NodeDetailFeedInfoController)
    ;
