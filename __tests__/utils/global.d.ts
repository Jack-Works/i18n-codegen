declare module 'jest-snapshot' {
    export declare interface SnapshotMatchers<R extends void | Promise<void>, T> {
        toMatchFile(filename: string): void
    }
}
