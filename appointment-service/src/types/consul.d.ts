declare module 'consul' {
  interface ConsulOptions {
    host?: string;
    port?: string;
    secure?: boolean;
    ca?: string[];
    defaults?: any;
  }

  interface ServiceRegisterOptions {
    id?: string;
    name: string;
    address?: string;
    port?: number;
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
        register(options: ServiceRegisterOptions, callback?: (err: any, data: any) => void): Promise<any>;
        deregister(id: string, callback?: (err: any, data: any) => void): Promise<any>;
      };
    };
  }

  export = Consul;
}