/// <reference path="../typings/index.d.ts" />
/// <reference path="../typings/parasoft-em-api.d.ts" />

import http = require('http');
import https = require('https');
import q = require('q');
import url = require('url');
import tl = require('azure-pipelines-task-lib/task');

// Get Environment Manager configuration

var emEndpoint = tl.getInput('ParasoftEMEndpoint', true);
var emBaseURL = url.parse(tl.getEndpointUrl(emEndpoint, true));
if (emBaseURL.path === '/') {
    emBaseURL.path = '/em';
} else if (emBaseURL.path === '/em/') {
    emBaseURL.path = '/em';
}
var abortOnTimout = tl.getBoolInput('AbortOnTimeout', false);
var timeout = tl.getInput('TimeoutInMinutes', false);
var emAuthorization = tl.getEndpointAuthorization(emEndpoint, true);
var protocol : any = emBaseURL.protocol === 'https:' ? https : http;
var protocolLabel = emBaseURL.protocol || 'http:';

var getFromEM = function<T>(path: string) : q.Promise<T>{
    var def = q.defer<T>();
    var options = {
        host: emBaseURL.hostname,
        port: emBaseURL.port,
        path: emBaseURL.path + path,
        auth: undefined,
        headers: {
            'Accept': 'application/json'
        }
    }
    if (protocolLabel === 'https:') {
        options['rejectUnauthorized'] = false;
        options['agent'] = false;
    }
    if (emAuthorization && emAuthorization.parameters['username']) {
        options.auth = emAuthorization.parameters['username'] + ':' +  emAuthorization.parameters['password'];
    }
    console.log('GET ' + protocolLabel + '//' + options.host + ':' + options.port + options.path);
    var responseString = "";
    protocol.get(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            responseString += chunk;
        });
        res.on('end', () => {
            console.log('    response ' + res.statusCode + ':  ' + responseString);
            var responseObject = JSON.parse(responseString);
            def.resolve(responseObject);
        });
    }).on('error', (e) => {
        def.reject(e);
    });
    return def.promise;
};

var findInEM = function<T>(path: string, property: string, name: string) : q.Promise<T>{
    var def = q.defer<T>();
    var options = {
        host: emBaseURL.hostname,
        port: emBaseURL.port,
        path: emBaseURL.path + path,
        auth: undefined,
        headers: {
            'Accept': 'application/json'
        }
    }
    if (protocolLabel === 'https:') {
        options['rejectUnauthorized'] = false;
        options['agent'] = false;
    }
    if (emAuthorization && emAuthorization.parameters['username']) {
        options.auth = emAuthorization.parameters['username'] + ':' +  emAuthorization.parameters['password'];
    }
    console.log('GET ' + protocolLabel + '//' + options.host + ':' + options.port + options.path);
    var responseString = "";
    protocol.get(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            responseString += chunk;
        });
        res.on('end', () => {
            console.log('    response ' + res.statusCode + ':  ' + responseString);
            var responseObject = JSON.parse(responseString);
            if (typeof responseObject[property] === 'undefined') {
                def.reject(property + ' does not exist in response object from ' + path);
                return;
            }
            for (var i = 0; i < responseObject[property].length; i++) {
                if (responseObject[property][i].name === name) {
                    def.resolve(responseObject[property][i]);
                    return;
                }
            }
            def.reject('Could not find name "' + name + '" in ' + property + ' from ' + path);
            return;
        });
    }).on('error', (e) => {
        def.reject(e);
    });
    return def.promise;
};

var postToEM = function<T>(path: string, data: any) : q.Promise<T>{
    var def = q.defer<T>();
    var options = {
        host: emBaseURL.hostname,
        port: parseInt(emBaseURL.port),
        path: emBaseURL.path + path,
        method: 'POST',
        auth: undefined,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }
    if (protocolLabel === 'https:') {
        options['rejectUnauthorized'] = false;
        options['agent'] = false;
    }
    if (emAuthorization && emAuthorization.parameters['username']) {
        options.auth = emAuthorization.parameters['username'] + ':' +  emAuthorization.parameters['password'];
    }
    console.log('POST ' + protocolLabel + '//' + options.host + ':' + options.port + options.path);
    var responseString = "";
    var req = protocol.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            responseString += chunk;
        });
        res.on('end', () => {
            console.log('    response ' + res.statusCode + ':  ' + responseString);
            var responseObject = JSON.parse(responseString);
            def.resolve(responseObject);
        });
    }).on('error', (e) => {
        def.reject(e);
    });
    req.write(JSON.stringify(data));
    req.end();
    return def.promise;
};

var putToEM = function<T>(path: string, data: any) : q.Promise<T>{
    var def = q.defer<T>();
    var options = {
        host: emBaseURL.hostname,
        port: parseInt(emBaseURL.port),
        path: emBaseURL.path + path,
        method: 'PUT',
        auth: undefined,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }
    if (protocolLabel === 'https:') {
        options['rejectUnauthorized'] = false;
        options['agent'] = false;
    }
    if (emAuthorization && emAuthorization.parameters['username']) {
        options.auth = emAuthorization.parameters['username'] + ':' +  emAuthorization.parameters['password'];
    }
    console.log('PUT ' + protocolLabel + '//' + options.host + ':' + options.port + options.path);
    var responseString = "";
    var req = protocol.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            responseString += chunk;
        });
        res.on('end', () => {
            console.log('    response ' + res.statusCode + ':  ' + responseString);
            var responseObject = JSON.parse(responseString);
            def.resolve(responseObject);
        });
    }).on('error', (e) => {
        def.reject(e);
    });
    req.write(JSON.stringify(data));
    req.end();
    return def.promise;
}

var jobName = tl.getInput('Job', true);
var jobId;
findInEM<EMJob>('/api/v2/jobs', 'jobs', jobName).then((job: EMJob) => {
    tl.debug('Found job ' + job.name + ' with id ' + job.id);
    jobId = job.id;
    return postToEM<EMJobHistory>('/api/v2/jobs/' + jobId + '/histories?async=true', {

    });
}).then((res: EMJobHistory) => {
    var historyId = res.id;
    var status = res.status;
    var startTime = new Date().getTime();
    var checkStatus = function() {
        getFromEM<EMJobHistory>('/api/v2/jobs/' + jobId + '/histories/' + historyId).then((res: EMJobHistory) => {
            status = res.status;
            if (abortOnTimout) {
                var timespent = (new Date().getTime() - startTime) / 60000,
                    timeoutNum = parseInt(timeout);
                if (timespent > timeoutNum) {
                    putToEM('/api/v2/jobs/' + jobId + '/histories/' + historyId, {status : 'CANCELED'});
                    tl.error("Test execution job timed out after " + timeoutNum + " minute" + (timeoutNum > 1 ? 's' : "") + '.');
                    tl.setResult(tl.TaskResult.Failed, 'Job ' + tl.getInput('Job', true) + ' timed out.');
                    return;
                }
            }
            if (status === 'RUNNING' || status === 'WAITING') {
                setTimeout(checkStatus, 1000);
            } else if (status === 'PASSED') {
                tl.debug('Job ' + tl.getInput('Job', true) + ' passed.');
                tl.setResult(tl.TaskResult.Succeeded, 'Job ' + tl.getInput('Job', true) + ' passed.');
            } else if (status === 'CANCELED') {
                tl.warning('Job ' + tl.getInput('Job', true) + ' canceled.');
                tl.setResult(tl.TaskResult.Succeeded, 'Job ' + tl.getInput('Job', true) + ' canceled.');
            } else {
                tl.error('Job ' + tl.getInput('Job', true) + ' failed.');
                tl.setResult(tl.TaskResult.Failed, 'Job ' + tl.getInput('Job', true) + ' failed.');
            }
        });
    };
    if (status === 'RUNNING' || status === 'WAITING') {
        setTimeout(checkStatus, 1000);
    }
}).catch((e) => {
    tl.error(e);
    tl.setResult(tl.TaskResult.Failed, e);
});
