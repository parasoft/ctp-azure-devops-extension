/// <reference path="../typings/index.d.ts" />
/// <reference path="../typings/parasoft-em-api.d.ts" />
/// <reference path="../typings/vsts-task-lib.d.ts" />

import http = require('http');
import q = require('q');
import url = require('url');
import tl = require('vsts-task-lib/task');

// Get Environment Manager configuration

var emBaseURL = url.parse(tl.getInput('ParasoftEMEndpoint', true));

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
var instanceName = tl.getInput('Instance', true);
var instanceId;
var copyToVirtualize = tl.getInput('CopyToVirtualize', false);
var virtualizeName = tl.getInput('VirtServerName', false);
var newEnvironmentName = tl.getInput('NewEnvironmentName', false);
var virtualizeServerId;
var instancesPromise = findInEM('/api/v2/systems', 'systems', systemName).then((system: EMSystem) => {
    tl.debug('Found system ' + system.name + ' with id ' + system.id);
    systemId = system.id;
    return findInEM('/api/v2/environments', 'environments', environmentName);
}).then((environment: EMEnvironment) => {
    environmentId = environment.id;
    return findInEM('/api/v2/environments/' + environmentId + '/instances', 'instances', instanceName);
});
if (copyToVirtualize === 'true') {
    instancesPromise = instancesPromise.then((instance) => {
        return findInEM('/api/v2/servers', 'servers', virtualizeName);
    }).then((server: VirtServer) => {
        virtualizeServerId = server.id;
        return postToEM('/api/v2/environments/copy?async=false', {
            originalEnvId: environmentId,
            serverId: virtualizeServerId,
            newEnvironmentName: newEnvironmentName,
            copyDataRepo: false
        });
    }).then((copyResult: EMEnvironmentCopyResult) => {
        environmentId = copyResult.environmentId;
        return findInEM('/api/v2/environments/' + environmentId + '/instances', 'instances', instanceName);
    });
}
instancesPromise.then((instance: EMEnvironmentInstance) => {
    instanceId = instance.id;
    return postToEM('/api/v2/provisions', {
        environmentId: environmentId,
        instanceId: instanceId,
        abortOnFailure: false
    });
}).then((res: EMProvisionResult) => {
    var eventId = res.eventId;
    var status = res.status;
    var checkStatus = function() {
        getFromEM('/api/v2/provisions/' + eventId).then((res: EMProvisionResult) => {
            status = res.status;
            if (status === 'running' || status === 'waiting') {
                setTimeout(checkStatus, 1000);
            } else if (status === 'success') {
                tl.debug('Successfully provisioned ' + tl.getInput('Instance', true));
                tl.setResult(tl.TaskResult.Succeeded, 'Successfully provisioned ' + tl.getInput('Instance', true));
            } else if (status === 'canceled') {
                tl.warning('Provisioning canceled.');
                tl.setResult(tl.TaskResult.Succeeded, 'Provisioning canceled.');
            } else {
                tl.error('Provisioning failed with status:  ' + status);
                tl.setResult(tl.TaskResult.Failed, 'Provisioning failed with status:  ' + status);
            }
        });
    };
    if (status === 'running' || status === 'waiting') {
        setTimeout(checkStatus, 1000);
    }
}).catch((e) => {
    tl.error(e);
    tl.setResult(tl.TaskResult.Failed, e);
});
