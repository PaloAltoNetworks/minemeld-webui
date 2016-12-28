/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService } from  '../../app/services/status';
import { IMinemeldSupervisorService } from '../../app/services/supervisor';
import { IConfirmService } from '../../app/services/confirm';

export class SystemController {
    mmstatus: IMinemeldStatusService;
    MinemeldSupervisorService: IMinemeldSupervisorService;
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

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
                MinemeldStatusService: IMinemeldStatusService, $scope: angular.IScope,
                ConfirmService: IConfirmService,
                $rootScope: angular.IRootScopeService,
                moment: moment.MomentStatic,
                MinemeldSupervisorService: IMinemeldSupervisorService, $state: angular.ui.IStateService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatusService;
        this.MinemeldSupervisorService = MinemeldSupervisorService;
        this.ConfirmService = ConfirmService;
        this.$interval = $interval;
        this.$scope = $scope;
        this.moment = moment;

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
                this.toastr.error('ERROR INITIATING ENGINE RESTART: '+error.data.error.message);
            });
        });
    }

    downloadLogs() {
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
        var vm: SystemController = this;

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
        var vm: SystemController = this;

        vm.updateSupervisor().finally(function() {
            vm.supervisorUpdatePromise = vm.$interval(
                vm.periodicUpdateSupervisor.bind(vm),
                vm.supervisorUpdateInterval,
                1
            );
        });
    }

    private updateSupervisor(): angular.IPromise<any> {
        var vm: SystemController = this;

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
