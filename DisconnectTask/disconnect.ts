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
var serverType = tl.getInput('serverType', true);
var serverValue = serverType == 'host' ? tl.getInput('serverHost', true) : tl.getInput('serverName', true);

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

var findServerInEM = function<T>(path: string, property: string, name: string) : q.Promise<T>{
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
				var match: string;
				if (serverType == 'host') {
					match = responseObject[property][i].host;
				} else {
					match = responseObject[property][i].name;
				}
                if ( match === name) {
                    def.resolve(responseObject[property][i]);
                    return;
                }
            }
            def.reject('Could not find server by matching "' + name + '" in ' + property + ' from ' + path);
            return;
        });
    }).on('error', (e) => {
        def.reject(e);
    });
    return def.promise;
};

findServerInEM<EMSystem>('/api/v2/servers', 'servers', serverValue).then((server: VirtServer) => {
    tl.debug('Found server ' + serverValue + 'by matching ' + serverType);
    return deleteFromEM<VirtServer>('/api/v2/servers/' + server.id);
}).then((res: VirtServer) => {
    if (res.name) {
        tl.debug('Successfully disconnected server ' + res.name);
        tl.setResult(tl.TaskResult.Succeeded, 'Successfully disconnected server ' + res.name);
    } else {
        tl.debug('Error deleting server');
        tl.setResult(tl.TaskResult.Failed, 'Error deleting server');
    }
}).catch((e) => {
    tl.error(e);
    tl.setResult(tl.TaskResult.Failed, e);
});
