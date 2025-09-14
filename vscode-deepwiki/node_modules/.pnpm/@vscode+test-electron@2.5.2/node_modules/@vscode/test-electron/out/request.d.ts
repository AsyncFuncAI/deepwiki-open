import { IncomingMessage } from 'http';
export declare function getStream(api: string, timeout: number): Promise<IncomingMessage>;
export declare function getJSON<T>(api: string, timeout: number): Promise<T>;
export declare class TimeoutController {
    private readonly timeout;
    private handle;
    private readonly ctrl;
    get signal(): AbortSignal;
    constructor(timeout: number);
    touch(): void;
    dispose(): void;
    private readonly reject;
}
export declare class TimeoutError extends Error {
    constructor(duration: number);
}
