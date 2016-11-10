/// <reference path="../../../typings/main.d.ts" />

export class AdminConfigureCommentController {
    origComment: string;
    username: string;

    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    comment: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                username: string, comment: string) {
        this.$modalInstance = $modalInstance;
        this.origComment = comment;
        this.comment = this.origComment;
        this.username = username;
    }

    save() {
        this.$modalInstance.close(this.comment);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}

export class AdminConfigureTagsController {
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
    }

    save() {
        this.$modalInstance.close(this.tags);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}

export class AdminAddUserController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    users: string[];

    set_password: boolean;
    title: string;

    username: string;
    password: string;
    password2: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                users: string[], username: string) {
        this.$modalInstance = $modalInstance;

        this.users = users;

        this.title = 'Add User';
        this.set_password = false;
        if (username) {
            this.username = username;
            this.set_password = true;
            this.title = 'Set Password';
        }
    }

    valid(): boolean {
        var result: boolean;

        result = true;

        angular.element('#fgPassword1').removeClass('has-error');
        angular.element('#fgPassword2').removeClass('has-error');
        angular.element('#fgUsername').removeClass('has-error');

        if (this.password !== this.password2) {
            angular.element('#fgPassword1').addClass('has-error');
            angular.element('#fgPassword2').addClass('has-error');

            result = false;
        }

        if (!this.password) {
            result = false;
        }

        if (this.set_password) {
            return result;
        }

        if (!this.username) {
            angular.element('#fgUsername').addClass('has-error');

            result = false;
        }

        if (this.users.indexOf(this.username) !== -1) {
            angular.element('#fgUsername').addClass('has-error');

            result = false;
        }

        return result;
    }

    save() {
        var result: any = {};

        result.username = this.username;
        result.password = this.password;

        this.$modalInstance.close(result);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
};
