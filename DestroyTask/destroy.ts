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

var deleteFromEM = function<T>(path: string) : q.Promise<T>{
    var def = q.defer<T>();
    var options = {
        host: emBaseURL.hostname,
        port: emBaseURL.port,
        path: emBaseURL.path + path,
        method: 'DELETE',
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
    console.log('DELETE ' + protocolLabel + '//' + options.host + ':' + options.port + options.path);
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
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }
    var responseString = "";
    var req = protocol.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            responseString += chunk;
        });
        res.on('end', () => {
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

var systemName = tl.getInput('System', true);
var systemId;
var environmentName = tl.getInput('Environment', true);
var environmentId;
findInEM<EMSystem>('/api/v2/systems', 'systems', systemName).then((system: EMSystem) => {
    tl.debug('Found system ' + system.name + ' with id ' + system.id);
    systemId = system.id;
    return findInEM<EMEnvironment>('/api/v2/environments', 'environments', environmentName);
}).then((environment: EMEnvironment) => {
    environmentId = environment.id;
    return deleteFromEM<EMEnvironment>('/api/v2/environments/' + environmentId + '?recursive=true');
}).then((res: EMEnvironment) => {
    if (res.name) {
        tl.debug('Successfully deleted ' + res.name);
        tl.setResult(tl.TaskResult.Succeeded, 'Successfully deleted ' + res.name);
    } else {
        tl.debug('Error deleting environment');
        tl.setResult(tl.TaskResult.Failed, 'Error deleting environment');
    }
}).catch((e) => {
    tl.error(e);
    tl.setResult(tl.TaskResult.Failed, e);
});
