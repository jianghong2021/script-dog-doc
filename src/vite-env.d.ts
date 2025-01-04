/// <reference types="vite/client" />

declare const dog: {
    version: string
    backupAuth(hash: string): Promise<void>
}