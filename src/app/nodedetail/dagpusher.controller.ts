/// <reference path="../../../typings/main.d.ts" />

import { INodeDetailResolverService } from '../../app/services/nodedetailresolver';
import { IMinemeldConfigService } from '../../app/services/config';
import { IConfirmService } from '../../app/services/confirm';

declare var he: any;

/** @ngInject */
function dagPusherRouterConfig($stateProvider: ng.ui.IStateProvider) {
    $stateProvider
        .state('nodedetail.dagpusherinfo', {
            templateUrl: 'app/nodedetail/dagpusher.info.html',
            controller: 'NodeDetailInfoController',
            controllerAs: 'vm'
        })
        .state('nodedetail.dagpusherdevices', {
            templateUrl: 'app/nodedetail/dagpusher.devices.html',
            controller: 'NodeDetailDagPusherDevicesController',
            controllerAs: 'vm'
        })
        ;
}

/** @ngInject */
function dagPusherRegisterClass(NodeDetailResolver: INodeDetailResolverService) {
    NodeDetailResolver.registerClass('minemeld.ft.dag.DagPusher', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.dagpusherinfo',
            active: false
        },
        {
            icon: 'fa fa-hdd-o',
            tooltip: 'DEVICES',
            state: 'nodedetail.dagpusherdevices',
            active: false
        },
        {
            icon: 'fa fa-area-chart',
            tooltip: 'STATS',
            state: 'nodedetail.stats',
            active: false
        },
        {
            icon: 'fa fa-asterisk',
            tooltip: 'GRAPH',
            state: 'nodedetail.graph',
                active: false
        }]
    });

    NodeDetailResolver.registerClass('minemeld.ft.dag_ng.DagPusher', {
        tabs: [{
            icon: 'fa fa-circle-o',
            tooltip: 'INFO',
            state: 'nodedetail.dagpusherinfo',
            active: false
        },
        {
            icon: 'fa fa-hdd-o',
            tooltip: 'DEVICES',
            state: 'nodedetail.dagpusherdevices',
            active: false
        },
        {
            icon: 'fa fa-area-chart',
            tooltip: 'STATS',
            state: 'nodedetail.stats',
            active: false
        },
        {
            icon: 'fa fa-asterisk',
            tooltip: 'GRAPH',
            state: 'nodedetail.graph',
                active: false
        }]
    });
}

class NodeDetailDagPusherDevicesController {
    MinemeldConfigService: IMinemeldConfigService;
    toastr: any;
    $scope: angular.IScope;
    DTOptionsBuilder: any;
    DTColumnBuilder: any;
    $compile: angular.ICompileService;
    $modal: angular.ui.bootstrap.IModalService;
    ConfirmService: IConfirmService;

    changed: boolean = false;
    nodename: string;
    cfd_device_list: string;

    dtDevices: any = {};
    dtColumns: any[];
    dtOptions: any;

    device_list: any[];

    /** @ngInject */
    constructor(toastr: any, MinemeldConfigService: IMinemeldConfigService,
                $scope: angular.IScope, DTOptionsBuilder: any,
                DTColumnBuilder: any, $compile: angular.ICompileService,
                $modal: angular.ui.bootstrap.IModalService,
                ConfirmService: IConfirmService) {
        this.MinemeldConfigService = MinemeldConfigService;
        this.$scope = $scope;
        this.toastr = toastr;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.$compile = $compile;
        this.$modal = $modal;
        this.ConfirmService = ConfirmService;

        this.nodename = $scope.$parent['nodedetail']['nodename'];

        this.cfd_device_list = this.nodename + '_device_list';

        this.setupDeviceTable();
    }

    addDevice(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/nodedetail/dagpusher.add.modal.html',
            controller: DagPusherAddDeviceController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            this.device_list.push(result);
            this.saveDeviceList().catch((error: any) => {
                    this.toastr.error('ERROR ADDING DEVICE: ' + error.statusText);
                    this.dtDevices.reloadData();
                });
        });
    }

    removeDevice(dnum: number) {
        var p: angular.IPromise<any>;

        var ddesc: string;

        ddesc = this.device_list[dnum].name || this.device_list[dnum].hostname;

        p = this.ConfirmService.show(
            'DELETE DEVICE',
            'Are you sure you want to delete node ' + ddesc + ' ?'
        );

        p.then((result: any) => {
            this.device_list.splice(dnum, 1);
            this.saveDeviceList().catch((error: any) => {
                this.toastr.error('ERROR REMOVING DEVICE: ' + error.statusText);
                this.dtDevices.reloadData();
            });
        });
    }

    private saveDeviceList(): angular.IPromise<any> {
        return this.MinemeldConfigService.saveDataFile(this.cfd_device_list, this.device_list, this.nodename)
            .then((result: any) => {
                this.dtDevices.reloadData();
            });
    }

    private setupDeviceTable(): void {
        var vm: any = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            return vm.MinemeldConfigService.getDataFile(vm.cfd_device_list).then((result: any) => {
                vm.changed = false;

                if (result === null) {
                    return [];
                }

                return result;
            }, (error: any) => {
                vm.toastr.error('ERROR LOADING DEVICE LIST: ' + error.statusText);
                throw error;
            })
            .then((result: any) => {
                vm.device_list = result;

                return result;
            })
            ;
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('lengthMenu', [[50, -1], [50, 'All']])
        .withOption('createdRow', function(row: HTMLScriptElement, data: any, index: any) {
            var fc: HTMLElement;

            row.className += ' config-table-row';

            fc = <HTMLElement>(row.childNodes[6]);
            fc.setAttribute('ng-click', 'vm.removeDevice(' + index + ')');
            fc.style.textAlign = 'center';
            fc.style.verticalAlign = 'middle';
            fc.setAttribute('tooltip', 'delete device');
            fc.setAttribute('tooltip-popup-delay', '500');
            fc.className += ' config-table-clickable';

            vm.$compile(angular.element(row).contents())(vm.$scope);
        })
        .withLanguage({
            'oPaginate': {
                'sNext': '>',
                'sPrevious': '<'
            }
        })
        ;

        this.dtColumns = [
            this.DTColumnBuilder.newColumn('name').withTitle('NAME').renderWith(function(data: any, type: any, full: any) {
                return he.encode(data, { strict: true });
            }),
            this.DTColumnBuilder.newColumn('api_username').withTitle('USERNAME').renderWith(function(data: any, type: any, full: any) {
                return he.encode(data, { strict: true });
            }),
            this.DTColumnBuilder.newColumn('api_password').withTitle('PASSWORD').renderWith(function(data: any, type: any, full: any) {
                if (data) {
                    return '<em>hidden</em>';
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn('hostname').withTitle('HOSTNAME').renderWith(function(data: any, type: any, full: any) {
                return he.encode(data, { strict: true });
            }),
            this.DTColumnBuilder.newColumn('vsys').withTitle('VSYS').withOption('defaultContent', '').renderWith(function(data: any, type: any, full: any) {
                if (data) {
                    return he.encode(data, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn('serial').withTitle('SERIAL #').withOption('defaultContent', '').renderWith(function(data: any, type: any, full: any) {
                if (data) {
                    return he.encode(data, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<span class="config-table-icon glyphicon glyphicon-remove"></span>';
            }).withOption('width', '30px')
        ];
    }
}

class DagPusherAddDeviceController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    name: string;
    hostname: string;
    port: number;
    api_username: string;
    api_password: string;
    api_password2: string;
    serial: string;

    valid(): boolean {
        if (this.api_password !== this.api_password2) {
            angular.element('#fgPassword1').addClass('has-error');
            angular.element('#fgPassword2').addClass('has-error');

            return false;
        }
        angular.element('#fgPassword1').removeClass('has-error');
        angular.element('#fgPassword2').removeClass('has-error');

        if (!this.api_password) {
            return false;
        }

        if (!this.hostname) {
            return false;
        }

        if (!this.api_username) {
            return false;
        }

        return true;
    }

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance) {
        this.$modalInstance = $modalInstance;
    }

    save() {
        var result: any = {};

        result.api_username = this.api_username;
        result.api_password = this.api_password;
        result.hostname = this.hostname;

        if (this.serial) {
            result.serial = this.serial;
        }
        if (this.name) {
            result.name = this.name;
        }

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};

console.log('Loading DagPusher');
angular.module('minemeldWebui')
    .config(dagPusherRouterConfig)
    .run(dagPusherRegisterClass)
    .controller('NodeDetailDagPusherDevicesController', NodeDetailDagPusherDevicesController)
    ;
