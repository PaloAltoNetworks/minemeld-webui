/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldTraced } from  '../../app/services/traced';

declare var he: any;

interface IRunningQuery {
    direction: string;
    qid: string;
    numLinesRequested: number;
    numLinesReceived: number;
}

export class LogsController {
    MinemeldTraced: IMinemeldTraced;
    $scope: angular.IScope;

    msgTop: string;
    msgBottom: string;
    showMore: boolean = true;

    logs: any[] = [];
    query: string = '';

    runningQuery: IRunningQuery;

    boundResizeTable: any;
    boundScrollHandler: any;
    $window: angular.IAugmentedJQuery;
    $table: angular.IAugmentedJQuery;

    lastScroll: number = 0;
    lastScrollTime: number;

    /* @ngInject */
    constructor(MinemeldTraced: IMinemeldTraced, $scope: angular.IScope) {
        this.MinemeldTraced = MinemeldTraced;
        this.$scope = $scope;

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
            console.log('query running');
            return;
        }

        this.logs.splice(0, this.logs.length);
        this.doQuery('bottom');
    }

    addToQuery($event: BaseJQueryEventObject) {
        this.query += ' ' + $event.target.textContent;

        $event.stopPropagation();
    }

    viewEntry($index: number) {
        console.log('viewEntry', $index);
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
            console.log('query already running');
            return;
        }

        if (direction === 'bottom') {
            this.msgBottom = 'LOADING ...';
            this.msgTop = undefined;

            if (this.logs.length > 0) {
                timestamp = this.logs[this.logs.length - 1].timestamp;
                counter = this.logs[this.logs.length - 1].counter - 1;
            } else {
                timestamp = (new Date()).getTime();
                counter = 0;
            }

            numLines = 100;
        } else {
            this.msgTop = 'LOADING ...';
            this.msgBottom = undefined;

            this.logs.splice(0, this.logs.length);

            timestamp = (new Date()).getTime();
            counter = 0;

            numLines = 200;
        }

        qid = this.MinemeldTraced.generateQueryID();

        this.runningQuery = {
            qid: qid,
            direction: direction,
            numLinesRequested: numLines,
            numLinesReceived: 0
        };

        this.MinemeldTraced.query(qid, {
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

        console.log(curTime - this.lastScrollTime);
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

        console.log(delta, scrollPerc, this.lastScroll);

        if (scrollPerc !== this.lastScroll) {
            this.lastScrollTime = curTime;
            this.lastScroll = scrollPerc;
            return;
        }

        if (scrollPerc > 0.8 && delta < 0) {
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
                msg = undefined;
            }

            if (this.runningQuery.direction === 'bottom') {
                console.log(msg);
                this.$scope.$apply(() => {
                    this.msgBottom = msg;
                    console.log('a', msg);
                });
            } else {
                this.$scope.$apply(() => {
                    this.msgTop = msg;
                    console.log('a', msg);
                });
            }

            if (data.msg === '<EOQ>') {
                this.showMore = (this.runningQuery.numLinesReceived === this.runningQuery.numLinesRequested);
                this.resetQuery();
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
        console.log('queryError', qid, error);
        if (this.runningQuery.qid === qid) {
            this.resetQuery();
        }
    }

    private destroy() {
        this.MinemeldTraced.closeAll();
        this.$window.off('resize', this.boundResizeTable);
        this.$table.off('scroll', this.boundScrollHandler);
    }
}
