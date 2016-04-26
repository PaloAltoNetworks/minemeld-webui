/// <reference path="../../../typings/main.d.ts" />

export class YamlConfigureShareLevelController {
    origShareLevel: string;
    indicator: string;

    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    share_level: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                indicator: string, share_level: string) {
        this.$modalInstance = $modalInstance;
        this.origShareLevel = share_level;
        this.share_level = this.origShareLevel;
        this.indicator = indicator;
    }

    save() {
        this.$modalInstance.close(this.share_level);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}

export class YamlConfigureCommentController {
    origComment: string;
    indicator: string;

    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;

    comment: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                indicator: string, comment: string) {
        this.$modalInstance = $modalInstance;
        this.origComment = comment;
        this.comment = this.origComment;
        this.indicator = indicator;
    }

    save() {
        this.$modalInstance.close(this.comment);
    }

    cancel() {
        this.$modalInstance.dismiss();
    }
}
