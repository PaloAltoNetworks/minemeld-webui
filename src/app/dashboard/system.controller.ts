/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldStatus } from  '../../app/services/status';
import { IMinemeldSupervisor } from '../../app/services/supervisor';

export class SystemController {
    mmstatus: IMinemeldStatus;
    MinemeldSupervisor: IMinemeldSupervisor;
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
                MinemeldStatus: IMinemeldStatus, $scope: angular.IScope,
                moment: moment.MomentStatic,
                MinemeldSupervisor: IMinemeldSupervisor, $state: angular.ui.IStateService) {
        this.toastr = toastr;
        this.mmstatus = MinemeldStatus;
        this.MinemeldSupervisor = MinemeldSupervisor;
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
        var vm: any = this;

        vm.mmstatus.getSystem()
        .then(
            function(result: any) {
                vm.system = result;
            },
            function(error: any) {
                vm.toastr.error('ERROR RETRIEVING SYSTEM STATUS: ' + error.status);
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
        var vm: any = this;

        vm.MinemeldSupervisor.getStatus()
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
                vm.toastr.error('ERROR RETRIEVING SUPERVISOR STATUS: ' + error.status);
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
