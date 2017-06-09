/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldAAAService, IMinemeldAAAUsers, IMinemeldAAAUserAttributes } from '../../app/services/aaa';
import { AdminConfigureCommentController, AdminAddUserController } from './modals.controller';
import { IConfirmService } from '../../app/services/confirm';

declare var he: any;

export class AdminUsersController {
    toastr: any;
    $scope: angular.IScope;
    DTOptionsBuilder: any;
    DTColumnBuilder: any;
    $compile: angular.ICompileService;
    $modal: angular.ui.bootstrap.IModalService;
    ConfirmService: IConfirmService;
    MinemeldAAAService: IMinemeldAAAService;
    $timeout: angular.ITimeoutService;

    dtUsers: any = {};
    dtColumns: any[];
    dtOptions: any;

    enabled: boolean;
    users: any[];

    /** @ngInject */
    constructor(toastr: any, MinemeldAAAService: IMinemeldAAAService,
                $scope: angular.IScope, DTOptionsBuilder: any,
                DTColumnBuilder: any, $compile: angular.ICompileService,
                $modal: angular.ui.bootstrap.IModalService,
                ConfirmService: IConfirmService, $timeout: angular.ITimeoutService) {
        this.MinemeldAAAService = MinemeldAAAService;
        this.$scope = $scope;
        this.toastr = toastr;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.$compile = $compile;
        this.$modal = $modal;
        this.ConfirmService = ConfirmService;
        this.$timeout = $timeout;

        this.setupUsersTable();
    }

    reload(): void {
        this.dtUsers.reloadData();
    }

    delayedReload(): void {
        this.$timeout(700).then((_: any) => {
            this.dtUsers.reloadData();
        });
    }

    removeUser(unum: number): void {
        var p: angular.IPromise<any>;
        var u: string;
        var lastUser: string = '';

        u = this.users[unum].username;

        p = this.ConfirmService.show(
            'DELETE USER',
            'Are you sure you want to delete user ' + u + ' ?'
        );

        if (this.users.length == 1) {
            p = p.then((result: any) => {
                return this.ConfirmService.show(
                    'DELETE LAST ADMIN USER',
                    'Are you sure you want to delete the last admin user ?'
                );
            });
        }

        p.then((result: any) => {
            this.MinemeldAAAService.deleteUser('api', u).then((result: any) => {
                this.toastr.success('USER ' + u + ' DELETED');
                this.delayedReload();
            }, (error: any) => {
                this.toastr.error('ERROR REMOVING USER: ' + error.statusText);
                this.delayedReload();
            });
        });
    }

    configureComment(unum: number) {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/admin/admin.comment.modal.html',
            controller: AdminConfigureCommentController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                username: () => {
                    return this.users[unum].username;
                },
                comment: () => {
                    var c: string;

                    c = null;
                    if (this.users[unum].attributes.comment) {
                        c = this.users[unum].attributes.comment;
                    }
                    return c;
                }
            },
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            if (!result || result.length === 0) {
                if (this.users[unum].attributes.comment) {
                    delete this.users[unum].attributes.comment;
                }
            } else {
                this.users[unum].attributes.comment = result;
            }

            this.MinemeldAAAService.setUserAttributes(
                'api',
                this.users[unum].username,
                this.users[unum].attributes
            ).then((result: any) => {
                this.delayedReload();
            }, (error: any) => {
                this.toastr.error('ERROR SAVING COMMENT: ' + error.statusText);
                this.delayedReload();
            });
        });
    }

    setPassword(unum: number) {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/admin/admin.add.modal.html',
            controller: AdminAddUserController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                username: () => {
                    return this.users[unum].username;
                },
                users: () => {
                    return this.users;
                }
            },
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            if (!result || result.password.length === 0) {
                return;
            }

            this.MinemeldAAAService.setUserPassword(
                'api',
                this.users[unum].username,
                result.password
            ).then((ignored: any) => {
                this.toastr.success('PASSWORD FOR USER ' + result.username + ' SET');
                this.delayedReload();
            }, (error: any) => {
                this.toastr.error('ERROR SETTING PASSWORD: ' + error.statusText);
                this.delayedReload();
            });
        });
    }

    addUser(unum: number) {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/admin/admin.add.modal.html',
            controller: AdminAddUserController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                username: () => {
                    return undefined;
                },
                users: () => {
                    return this.users;
                }
            },
            backdrop: 'static',
            animation: false
        });

        mi.result.then((result: any) => {
            if (!result || result.password.length === 0) {
                return;
            }

            this.MinemeldAAAService.setUserPassword(
                'api',
                result.username,
                result.password
            ).then((ignored: any) => {
                this.toastr.success('USER ' + result.username + ' ADDED');
                this.delayedReload();
            }, (error: any) => {
                this.toastr.error('ERROR ADDING USER: ' + error.statusText);
                this.delayedReload();
            });
        });
    }

    private setupUsersTable(): void {
        var vm: AdminUsersController = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(function() {
            return vm.MinemeldAAAService.getUsers('api').then((result: IMinemeldAAAUsers) => {
                var newresult: any[] = [];

                if (result === null) {
                    return newresult;
                }

                angular.forEach(result.users, (value: IMinemeldAAAUserAttributes, key: string) => {
                    newresult.push({
                        username: key,
                        attributes: value
                    });
                });

                vm.enabled = result.enabled;

                return newresult;
            }, (error: any) => {
                if (!error.cancelled) {
                    vm.toastr.error('ERROR LOADING USERS LIST: ' + error.statusText);
                }
                throw error;
            })
            .then((result: any) => {
                vm.users = result;

                return result;
            })
            ;
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('stateSave', true)
        .withOption('deferRender', true)
        .withOption('lengthMenu', [[50, 200, -1], [50, 200, 'All']])
        .withOption('createdRow', function(row: HTMLScriptElement, data: any, index: any) {
            var fc: HTMLElement;

            row.className += ' config-table-row';

            fc = <HTMLElement>(row.childNodes[1]);
            fc.setAttribute('ng-click', 'vm.setPassword(' + index + ')');
            fc.className += ' config-table-clickable';

            fc = <HTMLElement>(row.childNodes[2]);
            fc.setAttribute('ng-click', 'vm.configureComment(' + index + ')');
            fc.className += ' config-table-clickable';

            fc = <HTMLElement>(row.childNodes[3]);
            fc.setAttribute('ng-click', 'vm.removeUser(' + index + ')');
            fc.style.textAlign = 'center';
            fc.style.verticalAlign = 'middle';
            fc.setAttribute('tooltip', 'delete user');
            fc.setAttribute('tooltip-popup-delay', '500');
            fc.setAttribute('tooltip-append-to-body', '1');
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
            this.DTColumnBuilder.newColumn('username').withTitle('USERNAME').withOption('width', '15%').renderWith(function(data: any, type: any, full: any) {
                if (data) {
                    return he.encode(data, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('PASSWORD').withOption('width', '15%').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<i>hidden</i>';
            }),
            this.DTColumnBuilder.newColumn('attributes').withTitle('COMMENT').withOption('defaultContent', ' ').renderWith(function(data: any, type: any, full: any) {
                if (data && data.comment) {
                    return he.encode(data.comment, { strict: true });
                }

                return '';
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: any) {
                return '<span class="config-table-icon glyphicon glyphicon-remove"></span>';
            }).withOption('width', '30px')
        ];
    }
}
