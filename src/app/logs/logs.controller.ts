/// <reference path="../../../typings/main.d.ts" />

import { IMinemeldTraced } from  '../../app/services/traced';

declare var he: any;

interface IRunningQuery {
    direction: string;
    qid: string;
}

export class LogsController {
    MinemeldTraced: IMinemeldTraced;
    $scope: angular.IScope;

    msgTop: string;
    msgBottom: string;

    logs: any[] = [];
    query: string;

    runningQuery: IRunningQuery;

    boundResizeTable: any;
    boundScrollHandler: any;
    $window: angular.IAugmentedJQuery;
    $table: angular.IAugmentedJQuery;

    lastScroll: number = 0;

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
        this.$table.scroll(this.boundScrollHandler);

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

    private resizeTable(): void {
        var th, wh: number;

        wh = this.$window.height();
        th = wh - this.$table.offset().top - 20;
        this.$table.outerHeight(th);
    }

    private tableScrollHandler(): void {
        var scrollPerc: number;

        scrollPerc = this.$table.scrollTop() / this.$table[0].scrollHeight;

        if (scrollPerc > this.lastScroll && scrollPerc > 0.8) {
            this.doQuery('bottom');
        }
        if (scrollPerc < this.lastScroll && scrollPerc < 0.1) {
            this.doQuery('top');
        }

        this.lastScroll = scrollPerc;
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
            timestamp = (new Date()).getTime();
            counter = 0;

            numLines = 200;
        }

        qid = this.MinemeldTraced.generateQueryID();

        this.runningQuery = {
            qid: qid,
            direction: direction
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

    private queryData(qid: string, data: any) {
        var msg: string;
        var eh, tst: number;
        var j: number;

        if (data.msg) {
            msg = data.msg;
            if (data.msg === '<EOQ>') {
                msg = undefined;
            }

            if (this.runningQuery.direction === 'bottom') {
                this.msgBottom = msg;
            } else {
                this.msgTop = msg;
            }

            if (data.msg === '<EOQ>') {
                this.runningQuery = undefined;
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
            // XXX this is stupid, we should do a better job at searching
            for (j = 0; j < this.logs.length; j++) {
                if (this.logs[j].timestamp < data.timestamp) {
                    break;
                }
                if (this.logs[j].counter < data.counter) {
                    break;
                }

                if (this.logs[j].timestamp === data.timestamp) {
                    if (this.logs[j].counter === data.counter) {
                        return;
                    }
                }
            }

            this.logs.splice(j, 0, data);
            if (this.logs.length > 200) {
                this.logs.pop();
            }
        }
    }

    private queryError(qid: string, error: any) {
        console.log('queryError', qid, error);
        if (this.runningQuery.qid === qid) {
            this.runningQuery = undefined;
        }
    }

    private destroy() {
        this.MinemeldTraced.closeAll();
        this.$window.off('resize', this.boundResizeTable);
        this.$table.off('scroll', this.boundScrollHandler);
    }
}
