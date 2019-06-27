/// <reference path="../../../typings/main.d.ts" />

import { IMineMeldAPIService, IMineMeldAPIResource } from './minemeldapi';

export interface IMineMeldJob {
    description: string;
    status: string;
    returncode: number;
    logfile: string;
}

export interface IMineMeldJobMonitor {
    monitor?: angular.IPromise<any>;
    job_group: string;
    jobid: string;
}

export interface IMineMeldJobsService {
    monitor(job_group: string, jobid: string): angular.IPromise<IMineMeldJob>;
    get(job_group: string, jobid: string): angular.IPromise<any>;
}

export class MineMeldJobsService implements IMineMeldJobsService {
    MineMeldAPIService: IMineMeldAPIService;
    toastr: any;
    $interval: angular.IIntervalService;
    $q: angular.IQService;

    monitors: IMineMeldJobMonitor[] = [];

    /* @ngInject */
    constructor(toastr: any,
                $interval: angular.IIntervalService,
                MineMeldAPIService: IMineMeldAPIService,
                $q: angular.IQService) {
        this.MineMeldAPIService = MineMeldAPIService;
        this.toastr = toastr;
        this.$interval = $interval;
        this.$q = $q;

        this.MineMeldAPIService.onLogout(this.destroyJobsMonitor.bind(this));
    }

    monitor(job_group: string, jobid: string): angular.IPromise<IMineMeldJob> {
        var monitor: IMineMeldJobMonitor = {
            job_group: job_group,
            jobid: jobid
        };
        var deferred: angular.IDeferred<IMineMeldJob> = this.$q.defer();

        monitor.monitor = this.$interval(
            this.checkJob.bind(this),
            3000, 1, false,
            monitor, job_group, jobid, deferred
        );

        this.monitors.push(monitor);

        return deferred.promise;
    }

    get(job_group: string, jobid: string): angular.IPromise<any> {
        var api: IMineMeldAPIResource;
        var params: any = {
            job_group: job_group,
            jobid: jobid
        };

        api = this.MineMeldAPIService.getAPIResource(
            '/jobs/:job_group/:jobid', {},
            {
                get: {
                    method: 'GET'
                }
            }
        );

        return api.get(params).$promise.then((result: any) => {
            if ('result' in result) {
                return result.result;
            }

            return undefined;
        });
    }

    private destroyJobsMonitor(): void {
        angular.forEach(this.monitors, (monitor: IMineMeldJobMonitor) => {
            this.$interval.cancel(monitor.monitor);
        });
        this.monitors = [];
    }

    private checkJob(monitor: IMineMeldJobMonitor,
                     job_group: string,
                     jobid: string,
                     deferred: angular.IDeferred<IMineMeldJob>): void {
        this.get(job_group, jobid).then((result: IMineMeldJob) => {
            var joburl: string;

            if (result.status === 'RUNNING') {
                monitor.monitor = this.$interval(
                    this.checkJob.bind(this),
                    3000, 1, false,
                    monitor, job_group, jobid, deferred
                );

                return;
            }

            joburl = '/jobs/' + job_group + '/' + jobid + '/log';
            if (result.status === 'DONE') {
                this.toastr.success(
                    'JOB ' + result.description + ' COMPLETED SUCCESSFULLY. LOG <a target="_blank" href="' + joburl + '">HERE</a>',
                    { allowHtml: true }
                );
            }
            if (result.status === 'ERROR') {
                this.toastr.error(
                    'JOB ' + result.description + ' FAILED. LOG <a target="_blank" href="' + joburl + '">HERE</a>',
                    { allowHtml: true }
                );
            }
            deferred.resolve(result);
        }, (error: any) => {
            this.toastr.error('ERROR CHECKING STATUS OF JOB ' + job_group + ' ' + jobid + ': ' + error.statusText);
            this.monitors = this.monitors.filter((monitor: IMineMeldJobMonitor) => {
                if (monitor.jobid != jobid) {
                    return true;
                }

                if (monitor.job_group != job_group) {
                    return true;
                }

                this.$interval.cancel(monitor.monitor);
                return false;
            });
            deferred.reject(error);
        });
    }
}
