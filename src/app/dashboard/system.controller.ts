/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatusService } from  '../../app/services/status';
import { IMinemeldSupervisorService } from '../../app/services/supervisor';

export class SystemController {
    mmstatus: IMinemeldStatusService;
    MinemeldSupervisorService: IMinemeldSupervisorService;
    toastr: any;
    $interval: angular.IIntervalService;
    $scope: angular.IScope;
    moment: moment.MomentStatic;

    epOptions: any = {
        barColor: '#977390'
    };

    system: any;
    systemUpdateInterval: number = 30000;
    systemUpdatePromise: angular.IPromise<any>;

    supervisor: any;
    supervisorUpdateInterval: number = 30000;
    supervisorUpdatePromise: angular.IPromise<any>;

    /* @ngInject */
    constructor(toastr: any, $interval: angular.IIntervalService,
                MinemeldStatusService: IMinemeldStatusService, $scope: angular.IScope,
                moment: moment.MomentStatic,
                MinemeldSupervisorService: IMinemeldSupervisorService, $state: angular.ui.IStateService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatusService;
        this.MinemeldSupervisorService = MinemeldSupervisorService;
        this.$interval = $interval;
        this.$scope = $scope;
        this.moment = moment;

        this.updateSystem();
        this.updateSupervisor();

        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    private destroy() {
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

    private updateSupervisor(): void {
        var vm: SystemController = this;

        vm.MinemeldSupervisorService.getStatus()
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
        )
        .finally(function() {
            vm.supervisorUpdatePromise = vm.$interval(
                vm.updateSupervisor.bind(vm),
                vm.supervisorUpdateInterval,
                1
            );
        });
    }
}
