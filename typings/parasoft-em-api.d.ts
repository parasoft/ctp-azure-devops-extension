interface EMEnvironment {
    id: number;
    name: string;
    systemId: number;
    version?: string;
    description?: string;
}

interface EMEnvironmentCopyResult {
    id: number;
    originalEnvId: number;
    environmentId?: number;
    status: string;
    message?: string;
    expire?: number;
    deployFailures?: string[];
    copiedCount?: {
        totalActionCount?: number;
        copiedActionCount?: number;
        totalAssetCount?: number;
        copiedAssetCount?: number;
        totalMessageProxyCount?: number;
        copiedMessageProxyCount?: number;
    };
    componentEndpoints?: any[];
}

interface EMEnvironmentInstance {
    id: number;
    name: string;
}

interface EMProvisionResult {
    eventId: number;
    environmentId: number;
    instanceId: number;
    abortOnFailure: boolean;
    status: string;
    steps: EMProvisionStep[];
}

interface EMProvisionStep {
    stepId: number;
    name: string;
    description?: string;
    result: string;
    percent?: number;
}

interface EMSystem {
    id: number;
    name: string;
    version?: string;
    description?: string;
}

interface VirtServer {
    id: number;
    name?: string;
    host?: string;
    port?: number;
    status?: string;
}
