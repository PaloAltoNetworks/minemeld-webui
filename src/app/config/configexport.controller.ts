/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldConfigService, IMinemeldCandidateConfigNode } from  '../../app/services/config';

declare var jsyaml: any;

export class ConfigureExportController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;
    MinemeldConfigService: IMinemeldConfigService;

    config: string;
    editor: any;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                MinemeldConfigService: IMinemeldConfigService) {
        var vm: any = this;

        this.$modalInstance = $modalInstance;
        this.MinemeldConfigService = MinemeldConfigService;

        this.dumpYaml();

        /* this is a trick, basically these callbacks are called by ui-ace
           with this set to Window. To recover *this* instance we define
           the methods in a scope with *this* captured by a local variable vm */
        vm.editorLoaded = (editor_: any) => {
            vm.editor = editor_;

            editor_.setShowInvisibles(false);

            angular.element('.ace_text-input').on('focus', (event: any) => {
                angular.element(event.currentTarget.parentNode).addClass('ace-focus');
            });
            angular.element('.ace_text-input').on('blur', (event: any) => {
                angular.element(event.currentTarget.parentNode).removeClass('ace-focus');
            });
        };
    }

    copyToClipboard(): void {
        this.editor.selectAll();
        this.editor.focus();
        document.execCommand('copy');
    }

    ok(): void {
        this.$modalInstance.dismiss();
    }

    private dumpYaml(): void {
        var oconfig: any = {};

        this.MinemeldConfigService.nodesConfig.forEach((currentNode: IMinemeldCandidateConfigNode) => {
            if (currentNode.deleted) {
                return;
            }
            oconfig[currentNode.name] = angular.copy(currentNode.properties);

            delete oconfig[currentNode.name]['node_type'];
            delete oconfig[currentNode.name]['indicator_types'];

            if (typeof oconfig[currentNode.name].inputs !== 'undefined' && !(oconfig[currentNode.name].inputs instanceof Array)) {
                delete oconfig[currentNode.name]['inputs'];
            }
        });

        this.config = jsyaml.safeDump({
            nodes: oconfig
        });
    }
}
