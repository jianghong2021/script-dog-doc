declare const dog: {
    version: string
    backupAuth(hash: string): Promise<void>
    installScript(url: string)
}