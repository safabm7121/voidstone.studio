declare module 'consul' {
  interface ConsulOptions {
    host?: string;
    port?: string;
  }

  interface ServiceRegisterOptions {
    id?: string;
    name: string;
    address?: string;
    port?: number;
    tags?: string[];
    check?: {
      http?: string;
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