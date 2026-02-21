declare module 'consul' {
    interface ConsulOptions {
        host?: string;
        port?: string | number;  // ← Change this to accept both string and number
        secure?: boolean;
        ca?: string[];
        defaults?: any;
    }

    interface ServiceRegisterOptions {
        id?: string;
        name: string;
        address?: string;
        port?: number;  // Keep this as number for service registration
        tags?: string[];
        check?: {
            http?: string;
            tcp?: string;
            interval?: string;
            timeout?: string;
            deregistercriticalserviceafter?: string;
        };
    }

    class Consul {
        constructor(options?: ConsulOptions);
        agent: {
            service: {
                register(options: ServiceRegisterOptions): Promise<any>;
                deregister(id: string): Promise<any>;
            };
        };
    }

    export = Consul;
}