/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldTracedService } from  '../../app/services/traced';

declare var he: any;

interface IRunningQuery {
    direction: string;
    qid: string;
    numLinesRequested: number;
    numLinesReceived: number;
}

export class LogsController {
    MinemeldTracedService: IMinemeldTracedService;
    $scope: angular.IScope;
    $modal: angular.ui.bootstrap.IModalService;
    $state: angular.ui.IStateService;

    msgTop: string;
    msgBottom: string;
    showLoader: boolean;
    showMore: boolean = true;

    logs: any[] = [];
    query: string;

    runningQuery: IRunningQuery;

    boundResizeTable: any;
    boundScrollHandler: any;
    $window: angular.IAugmentedJQuery;
    $table: angular.IAugmentedJQuery;

    lastScroll: number = 0;
    lastScrollTime: number;

    /* @ngInject */
    constructor(MinemeldTracedService: IMinemeldTracedService, $scope: angular.IScope,
                $modal: angular.ui.bootstrap.IModalService, $state: angular.ui.IStateService,
                $stateParams: angular.ui.IStateParamsService) {
        this.MinemeldTracedService = MinemeldTracedService;
        this.$scope = $scope;
        this.$modal = $modal;
        this.$state = $state;

        this.query = $stateParams['q'];

        this.$window = angular.element(window);
        this.$table = angular.element('#logs-table');

        this.boundResizeTable = this.resizeTable.bind(this);
        this.$window.resize(this.boundResizeTable);
        this.$window.resize();

        this.boundScrollHandler = this.tableScrollHandler.bind(this);
        this.$table.on('mousewheel', this.boundScrollHandler);
        // this.$table.scroll(this.boundScrollHandler);

        this.resetMessages();

        this.$scope.$on('$destroy', this.destroy.bind(this));

        this.doQuery('bottom');
    }

    submitQuery(): void {
        if (this.runningQuery) {
            return;
        }

        this.logs.splice(0, this.logs.length);
        this.doQuery('bottom');
    }

    cancelQuery(): void {
        if (!this.runningQuery) {
            return;
        }

        this.MinemeldTracedService.closeAll();
        this.showMore = true;
        this.resetQuery();
    }

    addToQuery($event: BaseJQueryEventObject) {
        var qclass: string;

        if (!this.query) {
            this.query = '';
        }

        qclass = $event.target.attributes['data-qclass'].value;
        this.query += ' ' + qclass + ':' + $event.target.textContent;

        $event.stopPropagation();
    }

    viewEntry($index: number) {
        this.$modal.open({
            templateUrl: 'app/logs/logentry.view.modal.html',
            controller: LogsEntryViewController,
            controllerAs: 'vm',
            bindToController: true,
            backdrop: 'static',
            animation: false,
            size: 'lg',
            resolve: {
                index: () => { return $index; },
                entries: () => { return this.logs; }
            }
        });
    }


    private resetMessages(): void {
        this.msgBottom = undefined;
        this.msgTop = undefined;
    }

    private resetQuery(): void {
        this.runningQuery = undefined;
        this.resetMessages();
    }

    private resizeTable(): void {
        var th, wh: number;

        wh = this.$window.height();
        th = wh - this.$table.offset().top - 20;
        this.$table.outerHeight(th);
    }

    private doQuery(direction: string) {
        var qid: string;
        var timestamp: number;
        var counter: number;
        var numLines: number;

        if (this.runningQuery) {
            return;
        }

        if (direction === 'bottom') {
            this.msgBottom = 'Loading ...';
            this.showLoader = true;
            this.msgTop = undefined;

            if (this.logs.length > 0) {
                timestamp = this.logs[this.logs.length - 1].timestamp;
                counter = this.logs[this.logs.length - 1].counter;
            } else {
                timestamp = (new Date()).getTime();
                counter = 0;
            }

            numLines = 100;
        } else {
            this.msgTop = 'Loading ...';
            this.showLoader = true;
            this.msgBottom = undefined;

            this.logs.splice(0, this.logs.length);

            timestamp = (new Date()).getTime();
            counter = 0;

            numLines = 200;
        }

        qid = this.MinemeldTracedService.generateQueryID();

        this.runningQuery = {
            qid: qid,
            direction: direction,
            numLinesRequested: numLines,
            numLinesReceived: 0
        };

        this.MinemeldTracedService.query(qid, {
            query: this.query,
            timestamp: timestamp,
            counter: counter,
            numLines: numLines,
            ondata: this.queryData.bind(this),
            onerror: this.queryError.bind(this)
        });
    }

    private tableScrollHandler(e: any): void {
        var scrollPerc: number;
        var delta: number;
        var curTime: number;

        curTime = (new Date()).getTime();
        scrollPerc = this.$table.scrollTop() / this.$table[0].scrollHeight;

        if (this.lastScrollTime && (curTime - this.lastScrollTime) < 200) {
            this.lastScrollTime = curTime;
            this.lastScroll = scrollPerc;
            return;
        }

        if (e.originalEvent.wheelDelta) {
            delta = e.originalEvent.wheelDelta;
        } else if (e.originalEvent.detail) {
            delta = e.originalEvent.detail;
        }

        if (scrollPerc !== this.lastScroll) {
            this.lastScrollTime = curTime;
            this.lastScroll = scrollPerc;
            return;
        }

        if (scrollPerc > 0.8 && delta < 0 && this.showMore) {
            this.doQuery('bottom');
        } else if (scrollPerc === 0 && delta > 0) {
            this.doQuery('top');
        }

        this.lastScroll = scrollPerc;
        this.lastScrollTime = curTime;
    }

    private queryData(qid: string, data: any) {
        var msg: string;
        var eh, tst: number;

        if (data.msg) {
            msg = data.msg;
            if (data.msg === '<EOQ>') {
                this.$scope.$apply(() => {
                    this.showMore = (this.runningQuery.numLinesReceived === this.runningQuery.numLinesRequested);
                    this.resetQuery();
                });
                return;
            }

            if (this.runningQuery.direction === 'bottom') {
                this.$scope.$apply(() => {
                    this.msgBottom = msg;
                    // present continuous -> we need a loader
                    this.showLoader = msg.indexOf('ing') !== -1;
                });
            } else {
                this.$scope.$apply(() => {
                    this.msgTop = msg;
                    this.showLoader = msg.indexOf('ing') !== -1;
                });
            }

            return;
        }

        data.parsed = JSON.parse(data.log);
        if (this.runningQuery.direction === 'bottom') {
            this.logs.push(data);
            if (this.logs.length > 200) {
                this.logs.shift();

                eh = this.$table.children(':first').outerHeight();
                tst = this.$table.scrollTop();
                this.$table.scrollTop(tst - eh);
            }
        } else {
            this.logs.push(data);
            if (this.logs.length > 200) {
                this.logs.pop();
            }
        }
        this.runningQuery.numLinesReceived += 1;
    }

    private queryError(qid: string, error: any) {
        if (this.runningQuery.qid === qid) {
            this.resetQuery();
        }
    }

    private destroy() {
        this.MinemeldTracedService.closeAll();
        this.$window.off('resize', this.boundResizeTable);
        this.$table.off('scroll', this.boundScrollHandler);
    }
}

class LogsEntryViewController {
    $modalInstance: angular.ui.bootstrap.IModalServiceInstance;
    entries: any[];
    $scope: angular.IScope;

    boundKeyUp: any;

    index: number;
    curEntry: any;
    curLogJSON: string;

    /** @ngInject */
    constructor($modalInstance: angular.ui.bootstrap.IModalServiceInstance,
                $scope: angular.IScope,
                entries: any[], index: number) {
        this.$modalInstance = $modalInstance;
        this.$scope = $scope;

        this.entries = entries;

        this.boundKeyUp = this.keyUp.bind(this);
        angular.element(document).on('keyup', this.boundKeyUp);

        this.setIndex(index);
    }

    editorLoaded(editor_: any): void {
        editor_.setShowInvisibles(false);
        editor_.$blockScrolling = Infinity;

        angular.element('.ace_text-input').on('focus', (event: any) => {
            angular.element(event.currentTarget.parentNode).addClass('ace-focus');
        });
        angular.element('.ace_text-input').on('blur', (event: any) => {
            angular.element(event.currentTarget.parentNode).removeClass('ace-focus');
        });
    }

    setIndex(index: number) {
        this.index = index;
        this.curEntry = this.entries[index];
        if (this.curEntry.parsed.log.value) {
            this.curLogJSON = JSON.stringify(this.curEntry.parsed.log.value, null, '    ');
        } else {
            this.curLogJSON = '';
        }
    }

    setNext() {
        if (this.index === this.entries.length - 1) {
            return;
        }

        this.setIndex(this.index + 1);
    }

    setPrev() {
        if (this.index === 0) {
            return;
        }

        this.setIndex(this.index - 1);
    }

    keyUp($event: any) {
        if ('ace_text-input' === document.activeElement.className) {
            return;
        }

        if ($event.keyCode === 39) {
            this.$scope.$apply(() => {
                this.setNext();
            });
            return;
        }
        if ($event.keyCode === 37) {
            this.$scope.$apply(() => {
                this.setPrev();
            });
            return;
        }
    }

    dismiss(): void {
        angular.element(document).off('keyup', this.boundKeyUp);
        this.$modalInstance.dismiss();
    }
}
