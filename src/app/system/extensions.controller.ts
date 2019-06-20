/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldExtensionsService, IMineMeldExtension } from '../services/extensions';
import { IMineMeldJobsService } from '../services/jobs';
import { IMinemeldPrototypeService } from '../services/prototype';
import { IConfirmService } from '../services/confirm';

declare var he: any;

export interface IMineMeldExtensionTagged extends IMineMeldExtension {
    tags: string[];
}

export class SystemExtensionsController {
    MineMeldExtensionsService: IMineMeldExtensionsService;
    MineMeldJobsService: IMineMeldJobsService;
    MinemeldPrototypeService: IMinemeldPrototypeService;
    ConfirmService: IConfirmService;
    toastr: any;
    $scope: angular.IScope;
    $compile: angular.ICompileService;
    $state: angular.ui.IStateService;
    DTColumnBuilder: any;
    DTOptionsBuilder: any;
    $modal: angular.ui.bootstrap.IModalService;

    dtExtensions: any = {};
    dtColumns: any[];
    dtOptions: any;

    extensions: IMineMeldExtensionTagged[];

    /** @ngInject */
    constructor(toastr: any,
        MineMeldExtensionsService: IMineMeldExtensionsService,
        MinemeldPrototypeService: IMinemeldPrototypeService,
        ConfirmService: IConfirmService,
        moment: moment.MomentStatic, $scope: angular.IScope, DTOptionsBuilder: any,
        DTColumnBuilder: any, $compile: angular.ICompileService, $state: angular.ui.IStateService,
        $modal: angular.ui.bootstrap.IModalService,
        MineMeldJobsService: IMineMeldJobsService) {
        this.MineMeldExtensionsService = MineMeldExtensionsService;
        this.MinemeldPrototypeService = MinemeldPrototypeService;
        this.ConfirmService = ConfirmService;
        this.toastr = toastr;
        this.$scope = $scope;
        this.DTColumnBuilder = DTColumnBuilder;
        this.DTOptionsBuilder = DTOptionsBuilder;
        this.MineMeldJobsService = MineMeldJobsService;
        this.$compile = $compile;
        this.$state = $state;
        this.$modal = $modal;

        (<any>this.$scope.$parent).vm.tabs = [false, true];

        this.setupExtensionsTable();
    }

    reload(): void {
        this.dtExtensions.reloadData();
    }

    activate(index: number): void {
        var extension: IMineMeldExtensionTagged;

        extension = this.extensions[index];

        this.ConfirmService.show(
            'ACTIVATE EXTENSION',
            'Are you sure you want to activate extension ' + extension.name + ' v' + extension.version + ' ?'
        ).then((result: any) => {
            this.MineMeldExtensionsService.activate(
                extension.name,
                extension.version,
                extension.path
            ).then((result: any) => {
                this.toastr.success('ACTIVATION OF ' + extension.name + ' SCHEDULED');
                this.reload();

                return this.MineMeldJobsService.monitor('extensions', result).finally(() => {
                    this.reload();
                    this.additionalActions(extension);
                });
            }, (error: any) => {
                if (error.status === 400) {
                    this.toastr.error('ERROR SCHEDULING ACTIVATION OF ' + extension.name + ': ' + error.data.error.messsage);
                    return;
                }
                this.toastr.error('ERROR SCHEDULING ACTIVATION OF ' + extension.name + ': ' + error.statusText);
            });
        });
    }

    deactivate(index: number): void {
        var extension: IMineMeldExtensionTagged;

        extension = this.extensions[index];

        this.ConfirmService.show(
            'DEACTIVATE EXTENSION',
            'Are you sure you want to deactivate extension ' + extension.name + ' v' + extension.version + ' ?'
        ).then((result: any) => {
            this.MineMeldExtensionsService.deactivate(
                extension.name,
                extension.version,
                extension.path
            ).then((result: any) => {
                this.toastr.success('DEACTIVATION OF ' + extension.name + ' SCHEDULED');
                this.reload();

                return this.MineMeldJobsService.monitor('extensions', result).finally(() => {
                    this.reload();
                    this.additionalActions(extension);
                });
            }, (error: any) => {
                if (error.status === 400) {
                    this.toastr.error('ERROR SCHEDULING DEACTIVATION OF ' + extension.name + ': ' + error.data.error.messsage);
                    return;
                }
                this.toastr.error('ERROR SCHEDULING DEACTIVATION OF ' + extension.name + ': ' + error.statusText);
            });
        });
    }

    uninstall(index: number): void {
        var extension: IMineMeldExtensionTagged;

        extension = this.extensions[index];

        this.ConfirmService.show(
            'UNINSTALL EXTENSION',
            'Are you sure you want to uninstall extension ' + extension.name + ' v' + extension.version + ' ?'
        ).then((result: any) => {
            this.MineMeldExtensionsService.uninstall(
                extension.name,
                extension.version,
                extension.path
            ).then((result: any) => {
                this.toastr.success('UNINSTALL OF ' + extension.name + ' v' + extension.version + ' SUCCESSFULL');
                this.reload();
            }, (error: any) => {
                this.toastr.error('ERROR IN UNINSTALLING ' + extension.name + ' v' + extension.version + ': ' + error.statusText);
                this.reload();
            });
        });
    }

    installExtension(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        this.ConfirmService.show(
            'UNTRUSTED SOURCES',
            'Installing extensions from untrusted sources could harm the security of your network and compromise your data. Are you sure you want to continue ?'
        ).then((result: any) => {
            mi = this.$modal.open({
                templateUrl: 'app/system/uploadextension.modal.html',
                controller: UploadExtensionController,
                controllerAs: 'vm',
                bindToController: true,
                backdrop: 'static',
                animation: false
            });

            mi.result.finally(() => {
                this.reload();
            });
        });
    }

    installExtensionFromGit(): void {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        this.ConfirmService.show(
            'UNTRUSTED SOURCES',
            'Installing extensions from untrusted sources could harm the security of your network and compromise your data. Are you sure you want to continue ?'
        ).then((result: any) => {
            mi = this.$modal.open({
                templateUrl: 'app/system/installextensionfromgit.modal.html',
                controller: InstallExtensionGitController,
                controllerAs: 'vm',
                bindToController: true,
                backdrop: 'static',
                animation: false
            });

            mi.result.finally(() => {
                this.reload();
            });
        });
    }

    private additionalActions(extension: IMineMeldExtensionTagged): void {
        if (extension.tags.indexOf('api') !== -1) {
            this.toastr.success(
                '<a href="/#/system/dashboard">RELOAD</a> API SUBSYSTEM TO APPLY API CHANGES',
                { allowHtml: true }
            );
        }
        if (extension.tags.indexOf('prototypes') !== -1) {
            this.toastr.success('REFRESHING THE BROWSER TO UPDATE THE PROTOTYPE LIBRARY');
            this.MinemeldPrototypeService.invalidateCache();
            this.$state.go(this.$state.$current, { reload: true });
        }
    }

    private setupExtensionsTable() {
        var vm: SystemExtensionsController = this;

        this.dtOptions = this.DTOptionsBuilder.fromFnPromise(() => {
            return this.MineMeldExtensionsService.list().then((result: IMineMeldExtension[]) => {
                this.extensions = result.map((extension: IMineMeldExtension) => {
                    var textension: IMineMeldExtensionTagged = <IMineMeldExtensionTagged>angular.copy(extension);
                    textension.tags = [];

                    if (!extension.path) {
                        return textension;
                    }

                    if (extension.path.indexOf('.whl') !== -1) {
                        textension.tags.push('wheel');
                    } else {
                        textension.tags.push('git');
                    }

                    if (extension.entry_points) {
                        angular.forEach(extension.entry_points, (epgroup: any, epgroupname: string) => {
                            var toks: string[];

                            toks = epgroupname.split('_', 2);

                            if (toks[0] === 'minemeld') {
                                textension.tags.push(he.encode(toks[1], {strict: true}));
                            }
                        });
                    }

                    return textension;
                });

                return this.extensions;
            }, (error: any) => {
                if (!error.cancelled) {
                    this.toastr.error('ERROR RETRIEVING EXTENSIONS LIST: ' + error.statusText);
                    throw error;
                }

                this.extensions = [];

                return [];
            });
        })
        .withBootstrap()
        .withPaginationType('simple_numbers')
        .withOption('aaSorting', [])
        .withOption('aaSortingFixed', [])
        .withOption('stateSave', true)
        .withOption('lengthMenu', [[50, -1], [50, 'All']])
        .withOption('createdRow', (row: HTMLScriptElement, data: IMineMeldExtension, index: any) => {
            var nchildren: number;
            var rc: HTMLElement;

            row.className += ' config-table-row';

            if (!data.activated) {
                angular.forEach(Array.prototype.slice.call(row.children), (child: HTMLElement) => {
                    child.className += ' extensions-disabled';
                });
            }

            nchildren = row.children.length;

            if (row.children[nchildren - 2].childNodes.length !== 0) {
                rc = <HTMLElement><HTMLElement>row.children[nchildren - 2];

                rc.className += ' config-table-clickable';
                rc.style.textAlign = 'center';
                rc.style.verticalAlign = 'middle';
                rc.setAttribute('tooltip-popup-delay', '500');
                rc.setAttribute('tooltip-append-to-body', 'true');
                rc.setAttribute('tooltip', 'uninstall');
                rc.setAttribute('ng-click', 'vm.uninstall(' + index + ')');
            }

            if (row.children[nchildren - 1].childNodes.length !== 0) {
                rc = <HTMLElement><HTMLElement>row.children[nchildren - 1];

                rc.className += ' config-table-clickable';
                rc.style.textAlign = 'center';
                rc.style.verticalAlign = 'middle';
                rc.setAttribute('tooltip-popup-delay', '500');
                rc.setAttribute('tooltip-append-to-body', 'true');

                if (rc.innerHTML.indexOf('unchecked') !== -1) {
                    rc.setAttribute('tooltip', 'deactivate');
                    rc.setAttribute('ng-click', 'vm.deactivate(' + index + ')');
                } else {
                    rc.setAttribute('tooltip', 'activate');
                    rc.setAttribute('ng-click', 'vm.activate(' + index + ')');
                }
            }

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
            this.DTColumnBuilder.newColumn('name').withTitle('NAME').renderWith(function(data: any, type: any, full: IMineMeldExtension) {
                var r: string;
                var sname: string;
                var aemail: string = 'no email provided';

                sname = he.encode(data, { strict: true });
                r = '<div class="extensions-name">';
                r += sname;
                r += '</div>';

                if (full.author_email) {
                    aemail = he.encode(full.author_email, { strict: true });
                }

                if (full.author) {
                    r += '<div tooltip="' + he.encode(full.author_email, { strict: true}) + '" class="extensions-author">' + he.encode(full.author.toUpperCase(), { strict: true });

                    r += '</div>';
                }

                return r;
            }).withOption('width', '20%'),
            this.DTColumnBuilder.newColumn('version').withTitle('VERSION').renderWith(function(data: any, type: any, full: IMineMeldExtension) {
                if (!data) {
                    return '';
                }

                return he.encode(data, { strict: true });
            }).withOption('width', '10%'),
            this.DTColumnBuilder.newColumn('description').withTitle('DESCRIPTION').notSortable().renderWith(function(data: any, type: any, full: IMineMeldExtensionTagged) {
                var r: string;

                if (!data) {
                    return '';
                }

                r = '<div class="m-b-xs">' + he.encode(data, { strict: true }) + '</div>';

                if (full.tags.indexOf('git') !== -1) {
                    r += '<div class="prototypes-author m-t-xs">PATH</div>';
                    r += '<div class="m-b-xs">' + he.encode(full.path, { strict: true }) + '</div>';
                }

                if (full.tags.length > 0) {
                    r += '<div class="prototypes-author m-t-xs">TAGS</div>';
                    r += '<div class="label-container">';
                    angular.forEach(full.tags, (tag: string) => {
                        r += '<span class="label tag-prototype">' + he.encode(tag) + '</span> ';
                    });
                    r += '</div>';
                }

                return r;
            }),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: IMineMeldExtension) {
                if (full.running_job) {
                    return '';
                }

                if (full.activated) {
                    return '';
                }

                if (!full.activated) {
                    return '<span class="config-table-icon glyphicon glyphicon-remove"></span>';
                }
            }).withOption('width', '30px'),
            this.DTColumnBuilder.newColumn(null).withTitle('').notSortable().renderWith(function(data: any, type: any, full: IMineMeldExtension) {
                if (full.running_job) {
                    return '<div class="extensions-running-job-icon"></div>';
                }

                if (!full.installed) {
                    return '';
                }

                if (full.activated) {
                    return '<span class="config-table-icon glyphicon glyphicon-unchecked"></span>';

                }
                return '<span class="config-table-icon glyphicon glyphicon-check"></span>';
            }).withOption('width', '30px')
        ];
    }
}

export class UploadExtensionController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    uploader: any;
    added: boolean = false;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                FileUploader: any,
                toastr: any) {
        this.$modalInstance = $modalInstance;
        this.uploader = new FileUploader({
            url: '/extensions',
            queueLimit: 1,
            removeAfterUpload: true,
            filters: [{
                name: 'wheelName',
                fn: (item: any) => {
                    var result: boolean;

                    result = item.name.indexOf('.whl') == (item.name.length - 4);
                    if (!result) {
                        toastr.error('File should be a python wheel');
                        return false;
                    }

                    return true;
                }
            }]
        });
        this.uploader.onErrorItem = (item: any, response: any, status: any) => {
            if (status === 400) {
                toastr.error('ERROR UPLOADING: ' + response.error.message);
                return;
            }

            toastr.error('ERROR UPLOADING: ' + status);
        };
        this.uploader.onSuccessItem = (item: any) => {
            toastr.success('EXTENSION SUCCESSFULLY UPLOADED');
            this.$modalInstance.close('ok');
        };
    }

    cancel() {
        this.$modalInstance.dismiss('cancel');
    }
}

export class InstallExtensionGitController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;
    MineMeldExtensionsService: IMineMeldExtensionsService;
    MineMeldJobsService: IMineMeldJobsService;
    toastr: any;
    $interval: angular.IIntervalService;

    availableReferences: string[];
    endpoint: string;
    retrieving: boolean = false;
    invalidUrl: boolean = true;
    ref: string;

    progressMax: number = 80;
    progressValue: number;
    progressPromise: any;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                MineMeldExtensionsService: IMineMeldExtensionsService,
                MineMeldJobsService: IMineMeldJobsService,
                toastr: any,
                $interval: angular.IIntervalService) {
        this.MineMeldExtensionsService = MineMeldExtensionsService;
        this.MineMeldJobsService = MineMeldJobsService;
        this.$modalInstance = $modalInstance;
        this.toastr = toastr;
        this.$interval = $interval;
    }

    retrieveRefs(): void {
        this.retrieving = true;
        this.progressValue = 0;
        this.progressPromise = this.$interval(() => {
            this.progressValue = this.progressValue + 1;
        }, 20000 / this.progressMax, this.progressMax);

        this.MineMeldExtensionsService.gitRefs(this.endpoint).then((result: string[]) => {
            this.availableReferences = result;
        }, (error: any) => {
            if (error.status === 400) {
                this.toastr.error('ERROR ACCESSING GIT REPO: ' + error.data.error.message);
                return;
            }

            this.toastr.error('ERROR ACCESSING GIT REPO: ' + error.statusText);
        }).finally(() => {
            this.retrieving = false;
            this.$interval.cancel(this.progressPromise);
        });
    }

    urlChanged(): void {
        this.availableReferences = undefined;
        this.ref = undefined;
    }

    install(): void {
        this.MineMeldExtensionsService.gitInstall(this.endpoint, this.ref).then((result: string) => {
            this.toastr.success('INSTALLATION SCHEDULED');
            this.$modalInstance.close(
                this.MineMeldJobsService.monitor('extensions-git', result)
            );
        }, (error: any) => {
            if (error.status == 400) {
                this.toastr.error('ERROR SCHEDULING INSTALLATION: ' + error.data.error.message);
                return;
            }
            this.toastr.error('ERROR SCHEDULING INSTALLATION: ' + error.statusText);
        });
    }

    valid(): boolean {
        var result: boolean = true;
        var a: HTMLAnchorElement;

        angular.element('#fgEndpoint').removeClass('has-error');
        this.invalidUrl = false;

        if (!this.endpoint) {
            result = false;
            this.invalidUrl = true;
        } else {
            // XXX leads to memory leak ?
            a = document.createElement('a');
            a.href = this.endpoint;
            if (!a.protocol || !a.host || a.pathname.indexOf('.git') !== (a.pathname.length - 4)) {
                result = false;
                this.invalidUrl = true;
                angular.element('#fgEndpoint').addClass('has-error');
            }
        }

        if (!this.ref) {
            result = false;
        }

        return result;
    }

    cancel() {
        this.$modalInstance.dismiss('cancel');
    }
}
