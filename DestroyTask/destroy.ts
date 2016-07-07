/// <reference path="../typings/index.d.ts" />
/// <reference path="../typings/parasoft-em-api.d.ts" />
/// <reference path="../typings/vsts-task-lib.d.ts" />

import http = require('http');
import q = require('q');
import url = require('url');
import tl = require('vsts-task-lib/task');

// Get Environment Manager configuration

var emEndpoint = tl.getInput('ParasoftEMEndpoint', true);
var emBaseURL = url.parse(tl.getEndpointUrl(emEndpoint, true));

var getFromEM = function(path: string) {
    var def = q.defer();
    var options = {
        host: emBaseURL.hostname,
        port: emBaseURL.port,
        path: emBaseURL.path + path,
        headers: {
            'Accept': 'application/json'
        }
    }
    var responseString = "";
    http.get(options, (res) => {
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
    return def.promise;
};

var deleteFromEM = function(path: string) {
    var def = q.defer();
    var options = {
        host: emBaseURL.hostname,
        port: emBaseURL.port,
        path: emBaseURL.path + path,
        method: 'DELETE',
        headers: {
            'Accept': 'application/json'
        }
    }
    var responseString = "";
    http.get(options, (res) => {
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
    return def.promise;
};

var findInEM = function(path: string, property: string, name: string) {
    var def = q.defer();
    var options = {
        host: emBaseURL.hostname,
        port: emBaseURL.port,
        path: emBaseURL.path + path,
        headers: {
            'Accept': 'application/json'
        }
    }
    var responseString = "";
    http.get(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            responseString += chunk;
        });
        res.on('end', () => {
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

var postToEM = function(path: string, data: any) {
    var def = q.defer();
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
    var req = http.request(options, (res) => {
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
findInEM('/api/v2/systems', 'systems', systemName).then((system: EMSystem) => {
    tl.debug('Found system ' + system.name + ' with id ' + system.id);
    systemId = system.id;
    return findInEM('/api/v2/environments', 'environments', environmentName);
}).then((environment: EMEnvironment) => {
    environmentId = environment.id;
    return deleteFromEM('/api/v2/environments/' + environmentId + '?recursive=true');
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
