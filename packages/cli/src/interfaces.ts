/**
 * Every command that should be executable by @jsmon/cli must implement
 * the Runnable interface
 */
export interface Runnable {
    run(): Promise<void>;
}