/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService } from  '../../app/services/status';
import { IMinemeldSupervisorService } from '../../app/services/supervisor';
import { IMinemeldTracedService } from '../services/traced';
import { IMineMeldJobsService } from '../services/jobs';
import { IConfirmService } from '../../app/services/confirm';

export class SystemController {
    $state: angular.ui.IStateService;
    tabs: boolean[] = [true, false];

    /* @ngInject */
    constructor($state: angular.ui.IStateService) {
        this.$state = $state;
    }
}

export class SystemDashboardController {
    mmstatus: IMinemeldStatusService;
    MinemeldSupervisorService: IMinemeldSupervisorService;
    MinemeldTracedService: IMinemeldTracedService;
    MineMeldJobsService: IMineMeldJobsService;
    ConfirmService: IConfirmService;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    moment: moment.MomentStatic;

    epOptions: any = {
        barColor: '#977390'
    };

    engineStatusSubscription: () => void;

    system: any;
    systemUpdateInterval: number = 30000;
    systemUpdatePromise: angular.IPromise<any>;

    supervisor: any;
    supervisorUpdateInterval: number = 30000;
    supervisorUpdatePromise: angular.IPromise<any>;

    purgingTraces: boolean = false;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
                MinemeldStatusService: IMinemeldStatusService, $scope: angular.IScope,
                MinemeldTracedService: IMinemeldTracedService,
                MineMeldJobsService: IMineMeldJobsService,
                ConfirmService: IConfirmService,
                $rootScope: angular.IRootScopeService,
                moment: moment.MomentStatic,
                MinemeldSupervisorService: IMinemeldSupervisorService, $state: angular.ui.IStateService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatusService;
        this.MinemeldSupervisorService = MinemeldSupervisorService;
        this.MinemeldTracedService = MinemeldTracedService;
        this.MineMeldJobsService = MineMeldJobsService;
        this.ConfirmService = ConfirmService;
        this.$interval = $interval;
        this.$scope = $scope;
        this.moment = moment;

        (<any>this.$scope.$parent).vm.tabs = [true, false];

        this.updateSystem();
        this.periodicUpdateSupervisor();

        this.engineStatusSubscription = $rootScope.$on(
            'mm-engine-status-changed',
            this.updateSupervisor.bind(this)
        );
        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    engineRestart() {
        this.ConfirmService.show(
            'RESTART ENGINE',
            'Are you sure you want to restart the MineMeld engine ?'
        ).then((result: any) => {
            this.MinemeldSupervisorService.restartEngine().then((result: any) => {
                this.toastr.success('ENGINE RESTART INITIATED');
            }, (error: any) => {
                var detail: string;

                detail = error.statusText;
                if (error.status == 400) {
                    detail = error.data.error.message;
                }

                this.toastr.error('ERROR INITIATING ENGINE RESTART: ' + detail);
            });
        });
    }

    apiRestart() {
        this.ConfirmService.show(
            'RESTART API SERVICE',
            'Are you sure you want to restart the MineMeld API service ?'
        ).then((result: any) => {
            this.MinemeldSupervisorService.hupAPI().then((result: any) => {
                this.toastr.success('API SERVICE RESTART INITIATED');
            }, (error: any) => {
                var detail: string;

                detail = error.statusText;
                if (error.status == 400) {
                    detail = error.data.error.message;
                }

                this.toastr.error('ERROR INITIATING API RESTART: ' + detail);
            });
        });
    }

    purgeTraces() {
        this.ConfirmService.show(
            'PURGE LOGS',
            'Are you sure you want to erase all logs ?'
        ).then((result: any) => {
            this.MinemeldTracedService.purgeAll().then((jobid: string) => {
                this.toastr.success('LOGS REMOVAL SCHEDULED');
                this.MineMeldJobsService.monitor('traced-purge', jobid);
            }, (error: any) => {
                var detail: string;

                detail = error.statusText;
                if (error.status == 400) {
                    detail = error.data.error.message;
                }

                this.toastr.error('ERROR SCHEDULING LOGS REMOVAL: ' + detail);
            });
        });
    }

    private destroy() {
        if (this.engineStatusSubscription) {
            this.engineStatusSubscription();
        }

        if (this.systemUpdatePromise) {
            this.$interval.cancel(this.systemUpdatePromise);
        }
        if (this.supervisorUpdatePromise) {
            this.$interval.cancel(this.supervisorUpdatePromise);
        }
    }

    private updateSystem(): void {
        var vm: SystemDashboardController = this;

        vm.mmstatus.getSystem()
        .then(
            function(result: any) {
                vm.system = result;
            },
            function(error: any) {
                if (!error.cancelled) {
                    vm.toastr.error('ERROR RETRIEVING SYSTEM STATUS: ' + error.statusText);
                }
            }
        )
        .finally(function() {
            vm.systemUpdatePromise = vm.$interval(
                vm.updateSystem.bind(vm),
                vm.systemUpdateInterval,
                1
            );
        });
    }

    private periodicUpdateSupervisor(): void {
        var vm: SystemDashboardController = this;

        vm.updateSupervisor().finally(function() {
            vm.supervisorUpdatePromise = vm.$interval(
                vm.periodicUpdateSupervisor.bind(vm),
                vm.supervisorUpdateInterval,
                1
            );
        });
    }

    private updateSupervisor(): angular.IPromise<any> {
        var vm: SystemDashboardController = this;

        return vm.MinemeldSupervisorService.getStatus()
        .then(
            function(result: any) {
                var p: string;

                vm.supervisor = result;

                for (p in vm.supervisor.processes) {
                    if (vm.supervisor.processes[p].start) {
                        vm.supervisor.processes[p].start = vm.moment.unix(vm.supervisor.processes[p].start).fromNow().toUpperCase();
                    }
                }
            },
            function(error: any) {
                if (!error.cancelled) {
                    vm.toastr.error('ERROR RETRIEVING SUPERVISOR STATUS: ' + error.statusText);
                }
            }
        );
    }
}
