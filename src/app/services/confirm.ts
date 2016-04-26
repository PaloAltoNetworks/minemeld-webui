/// <reference path="../../../typings/main.d.ts" />

export interface IConfirmService {
    show(title: string, msg: string): angular.IPromise<any>;
}

export class ConfirmService implements IConfirmService {
    static $inject = ['$modal'];

    $modal: angular.ui.bootstrap.IModalService;

    constructor($modal: angular.ui.bootstrap.IModalService) {
        this.$modal = $modal;
    }

    show(title: string, msg: string): angular.IPromise<any> {
        var mi: angular.ui.bootstrap.IModalServiceInstance;

        mi = this.$modal.open({
            templateUrl: 'app/services/confirm.html',
            controller: ConfirmController,
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                title: () => { return title; },
                msg: () => { return msg; }
            },
            backdrop: 'static',
            animation: false
        });

        return mi.result;
    }
}

class ConfirmController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;
    title: string;
    msg: string;

    /* @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                title: string,
                msg: string) {
        this.$modalInstance = $modalInstance;
        this.title = title;
        this.msg = msg;
    }

    ok() {
        this.$modalInstance.close('ok');
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}
