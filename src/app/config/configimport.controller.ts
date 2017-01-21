/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldConfigService, IMinemeldCandidateConfigNode } from  '../../app/services/config';
import { IMinemeldPrototypeService, IMinemeldPrototypeLibrary } from '../../app/services/prototype';
import { IConfirmService } from '../../app/services/confirm';

declare var jsyaml: any;

class ConfigAnnotations {
    private _annotations: { [key: number]: string[] } = {};

    constructor() {
        /* empty */
    }

    addAnnotation(row: number, annotation: string): void {
        if (!(row in this._annotations)) {
            this._annotations[row] = [];
        }
        this._annotations[row].push(annotation);
    }

    getAnnotations(): any[] {
        var result: any[] = [];
        var vm: ConfigAnnotations = this;

        Object.keys(this._annotations).forEach((row: string) => {
            result.push({
                row: +row,
                column: 0,
                type: 'error',
                text: vm._annotations[row].join('\n')
            });
        });

        return result;
    }

    length(): number {
        return Object.keys(this._annotations).length;
    }

    firstRowNumber(): number {
        var rows: number[];

        rows = Object.keys(this._annotations).map((v: string): number => { return +v; });
        if (rows.length !== 0) {
            return Math.min.apply(null, rows) + 1;
        }

        return 0;
    }
}

export class ConfigureImportController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;
    MinemeldConfigService: IMinemeldConfigService;
    toastr: any;
    $q: angular.IQService;
    ConfirmService: IConfirmService;
    MinemeldPrototypeService: IMinemeldPrototypeService;

    prototypeLibrary: IMinemeldPrototypeLibrary;

    config: string;
    pconfig: any;

    editor: any;
    valid: boolean = false;
    syntaxValid: boolean = false;
    processing: boolean = true;
    numAnnotations: number = 0;
    firstAnnotation: number = 0;

    progressMax: number;
    progressValue: number;

    /** @ngInject */
    constructor($scope: angular.IScope,
                $modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                MinemeldConfigService: IMinemeldConfigService,
                MinemeldPrototypeService: IMinemeldPrototypeService,
                toastr: any,
                $q: angular.IQService,
                ConfirmService: IConfirmService) {
        var vm: any = this;

        this.$modalInstance = $modalInstance;
        this.MinemeldConfigService = MinemeldConfigService;
        this.MinemeldPrototypeService = MinemeldPrototypeService;
        this.toastr = toastr;
        this.$q = $q;
        this.ConfirmService = ConfirmService;

        MinemeldPrototypeService.getPrototypeLibraries().then((result: any) => {
            this.prototypeLibrary = result;
            this.processing = false;
        }, (error: any) => {
            if (!error.cancelled) {
                this.toastr.error('ERROR RETRIEVING PROTOTYPES: ' + error.statusText);
            }
            this.$modalInstance.dismiss();
        });

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

            editor_.getSession().setOption('useWorker', false);

            vm.validYaml();
        };
        vm.aceChanged = vm.validYaml.bind(this);
    }

    validYaml(): boolean {
        var nodeNames: string[];
        var annotations: ConfigAnnotations = new ConfigAnnotations();
        var namere = /^[a-zA-Z0-9_\-]+$/;

        if (!this.editor) {
            return;
        }

        this.valid = false;

        try {
            this.pconfig = jsyaml.safeLoad(this.config);
        } catch (err) {
            this.syntaxValid = false;
            return false;
        }
        this.syntaxValid = true;

        this.editor.getSession().clearAnnotations();
        this.numAnnotations = 0;

        if (!this.pconfig || !this.config || this.config.length === 0) {
            return false;
        }

        if (typeof this.pconfig.nodes === 'undefined' || typeof this.pconfig.nodes !== 'object') {
            this.editor.getSession().setAnnotations([{
                row: 0,
                column: 0,
                text: 'Nodes list not defined',
                type: 'error' // also warning and information
            }]);

            return false;
        }

        if (!this.pconfig.nodes) {
            this.editor.getSession().setAnnotations([{
                row: 0,
                column: 0,
                text: 'Invalid nodes list',
                type: 'error' // also warning and information
            }]);

            return false;
        }

        nodeNames = Object.keys(this.pconfig.nodes);
        if (nodeNames.length === 0) {
            this.editor.getSession().setAnnotations([{
                row: 0,
                column: 0,
                text: 'Invalid nodes list',
                type: 'error' // also warning and information
            }]);

            return false;
        }

        angular.forEach(nodeNames, (nodeName: string) => {
            var node: any;
            var nodeRow: number;
            var toks: string[];

            node = this.pconfig.nodes[nodeName];

            if (!namere.test(nodeName)) {
                annotations.addAnnotation(0, nodeName + ': invalid node name');

                return;
            }

            if (typeof node !== 'object' || node === null) {
                annotations.addAnnotation(0, nodeName + ': invalid node format');

                return;
            }

            nodeRow = this.findNode(nodeName);

            if (typeof node.inputs !== 'undefined') {
                if (!(node.inputs instanceof Array)) {
                    annotations.addAnnotation(
                        nodeRow,
                        nodeName +  ': wrong inputs list'
                    );
                } else {
                    node.inputs.forEach((i: any) => {
                        if (typeof i !== 'string') {
                            annotations.addAnnotation(
                                nodeRow,
                                nodeName + ': invalid input ' + i
                            );
                        }
                    });
                }
            }
            if (typeof node.output !== 'boolean') {
                annotations.addAnnotation(
                    nodeRow,
                    nodeName +  ': wrong or missing output field'
                );
            }
            if (typeof node.class !== 'undefined' && typeof node.class !== 'string') {
                annotations.addAnnotation(
                    nodeRow,
                    nodeName +  ': class field if defined should be a string'
                );
            }
            if (typeof node.config !== 'undefined') {
                if (typeof node.config !== 'object' || !node.config) {
                    annotations.addAnnotation(
                        nodeRow,
                        nodeName +  ': config field if defined should be a dictionary'
                    );
                }
            }
            if (typeof node.prototype !== 'undefined') {
                if (typeof node.prototype !== 'string') {
                    annotations.addAnnotation(
                        nodeRow,
                        nodeName +  ': prototype field if defined should be a string'
                    );
                } else {
                    toks = node.prototype.split('.');
                    if (!(toks[0] in this.prototypeLibrary)) {
                        annotations.addAnnotation(
                            nodeRow,
                            nodeName +  ': unknown prototype library'
                        );
                    } else {
                        if (!(toks[1] in this.prototypeLibrary[toks[0]].prototypes)) {
                            annotations.addAnnotation(
                                nodeRow,
                                nodeName +  ': unknown prototype'
                            );
                        }
                    }
                }
            }
            if (typeof node.prototype === 'undefined' && (typeof node.config === 'undefined' || typeof node.class === 'undefined')) {
                annotations.addAnnotation(
                    nodeRow,
                    nodeName +  ': prototype field or class and config fields should be defined'
                );
            }
        });

        if (Object.keys(this.pconfig).length > 1) {
            annotations.addAnnotation(
                0,
                'Unknown top level attributes: ' + Object.keys(this.pconfig).filter((a: string) => { return a !== 'nodes'; }).join(' ,')
            );
        }

        this.numAnnotations = annotations.length();
        this.firstAnnotation = annotations.firstRowNumber();
        if (annotations.length() !== 0) {
            this.editor.getSession().setAnnotations(
                annotations.getAnnotations()
            );

            return false;
        }

        this.valid = true;

        return true;
    }

    errorClick(): void {
        this.editor.gotoLine(this.firstAnnotation, 0, true);
    }

    append(): void {
        var numRow: number;
        var duplicate: boolean = false;
        var annotations: ConfigAnnotations = new ConfigAnnotations();
        var node: IMinemeldCandidateConfigNode;

        this.progressMax = Object.keys(this.pconfig.nodes).length;
        this.progressValue = 0;
        this.processing = true;

        for (node of this.MinemeldConfigService.nodesConfig) {
            if (node.name in this.pconfig.nodes) {
                duplicate = true;
                numRow = this.findNode(node.name);
                annotations.addAnnotation(
                    numRow,
                    'Node with name ' + node.name + ' already exists in candidate config, please rename'
                );
            }
        }
        if (duplicate) {
            this.editor.getSession().setAnnotations(annotations.getAnnotations());
            this.toastr.error('ERROR APPENDING CONFIG: NAME CONFLICTS');
            this.processing = false;
            return;
        }

        this.appendNodes().then(() => {
            this.toastr.success('CONFIG APPENDED');

            delete this['editor'];
            this.$modalInstance.close('ok');
            this.processing = false;
        }, (error: any) => {
            this.toastr.error('ERROR ADDING NODES: ' + error.statusText);
            this.processing = false;
        });
    }

    replace(): void {
        this.progressMax = Object.keys(this.pconfig.nodes).length + Object.keys(this.MinemeldConfigService.nodesConfig).length;
        this.progressValue = 0;
        this.processing = true;

        this.ConfirmService.show(
            'REPLACE CONFIG',
            'REPLACE EXISTING CANDIDATE CONFIG ?'
        ).then((result: any) => {
            this.deleteAllNodes().then((result: any) => {
                return this.appendNodes()
                    .then((result: any) => {
                        this.toastr.success('CANDIDATE CONFIG REPLACED');
                        this.processing = false;

                        delete this['editor'];
                        this.$modalInstance.close('ok');
                    }, (error: any) => {
                        this.toastr.error('ERROR REPLACING CONFIG: ' + error.statusText);
                        this.processing = false;
                    });
            });
        }, (error: any) => {
            this.processing = false;
        });
    }

    cancel(): void {
        delete this['editor'];

        this.$modalInstance.dismiss();
    }

    private deleteAllNodes(): angular.IPromise<any> {
        return this.MinemeldConfigService.nodesConfig.reduce((prevPromise: angular.IPromise<any>, currentNode: IMinemeldCandidateConfigNode, currentIndex: number) => {
            this.progressValue += 1;

            if (currentNode.deleted) {
                return prevPromise;
            }

            return prevPromise.then((result: any) => {
                return this.MinemeldConfigService.deleteNode(currentIndex);
            });
        }, this.$q.when('<delete-all>'));
    }

    private appendNodes(): angular.IPromise<any> {
        return Object.keys(this.pconfig.nodes).reduce((prevPromise: angular.IPromise<any>, currentName: string) => {
            return prevPromise.then((result: any) => {
                this.progressValue += 1;
                return this.MinemeldConfigService.addNode(currentName, this.pconfig.nodes[currentName]);
            });
        }, this.$q.when('<append>'));
    }

    private findNode(nodename: any): any {
        var clines: string[];
        var line: string;
        var regexp: RegExp = new RegExp('^\\s+' +  nodename + ':\s*$');

        clines = this.config.split('\n');
        for (var row in clines) {
            line = clines[row];
            if (regexp.test(line)) {
                return row;
            }
        }

        return 0;
    }
}
