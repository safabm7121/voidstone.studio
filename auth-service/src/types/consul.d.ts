declare module 'consul' {
  interface ConsulOptions {
    host?: string;
    port?: string | number;  // Allow both string and number
    secure?: boolean;
    ca?: string[];
    defaults?: any;
  }

  interface ServiceRegisterOptions {
    id?: string;
    name: string;
    address?: string;
    port?: number;  // This should stay as number for service registration
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
        register(options: ServiceRegisterOptions, callback?: (err: any, data: any) => void): void;
        deregister(id: string, callback?: (err: any, data: any) => void): void;
      };
    };
  }

  export = Consul;
}