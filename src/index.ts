import { i18NextParser } from './frameworks/i18next/parser/i18n-next.js'
import { type Config, type ConfigFile, GeneratorList, ParserList } from './json-schema.js'
import { GeneratorInput, ParserInput } from './type.js'
import { dirname, resolve } from 'node:path'
import { i18next_reactHooksGenerator } from './frameworks/i18next/index.js'
import { readFileSync, writeFileSync } from 'node:fs'
import { watch } from 'chokidar'
export * from './json-schema.js'

type Args = [config: Pick<Config, 'generator' | 'parser'>, absoluteInputPath: string, absoluteOutputPath: string]
type E = (error: unknown, ...args: Args) => void
export function handleConfig(...[config, input, output]: Args) {
    let { generator, parser } = config
    if (typeof generator === 'string') generator = { type: generator }
    if (typeof parser === 'string') parser = { type: parser }

    const table = { [ParserList.i18next]: i18NextParser }
    const table2 = { [GeneratorList.i18next_reactHooks]: i18next_reactHooksGenerator }

    const result = table[parser.type](ParserInput.fromFileSystem(input, parser))
    const files = table2[generator.type](new GeneratorInput(result, input, output, generator))

    for (const [file, content] of files) {
        writeFileSync(file, content)
    }
}

const watchOptions = { atomic: true, awaitWriteFinish: true, ignoreInitial: false }
export function watchConfig(onError: E, ...[config, input, output]: Args) {
    const watcher = watch(input, watchOptions)
    watcher.on('all', () => {
        try {
            handleConfig(config, input, output)
        } catch (e) {
            onError(e, config, input, output)
        }
    })
    return () => watcher.close()
}

export function runConfigList(watchMode: true, onError: E, configs: Args[]): () => void
export function runConfigList(watchMode: false, onError: E, configs: Args[]): void
export function runConfigList(watchMode: boolean, onError: E, configs: Args[]): undefined | (() => void)
export function runConfigList(watchMode: boolean, onError: E, configs: Args[]) {
    if (watchMode) {
        const cancel = configs.map((x) => watchConfig(onError, ...x))
        // biome-ignore lint/complexity/noForEach: <explanation>
        return () => cancel.forEach((x) => x())
    }
    for (const x of configs) {
        try {
            handleConfig(...x)
        } catch (e) {
            onError(e, ...x)
        }
    }
    return
}
export function runConfigFile(watchMode: true, onRecoverableError: E, configFilePath: string): () => void
export function runConfigFile(watchMode: false, onRecoverableError: E, configFilePath: string): void
export function runConfigFile(
    watchMode: boolean,
    onRecoverableError: E,
    configFilePath: string,
): undefined | (() => void)
export function runConfigFile(watchMode: boolean, onRecoverableError: E, configFilePath: string) {
    const config: ConfigFile = JSON.parse(readFileSync(configFilePath, 'utf-8'))
    if (config.version !== 1) return
    const base = dirname(configFilePath)
    const configList = config.list.map(({ input, output, ...rest }) => {
        const absoluteInputPath = resolve(base, input)
        const absoluteOutputPath = resolve(base, output)
        return [rest, absoluteInputPath, absoluteOutputPath] as Args
    })
    return runConfigList(watchMode, onRecoverableError, configList)
}
export function runCli(argv: { config?: string; cwd?: string; watch?: boolean }, onError: E) {
    const config = resolve(process.cwd(), argv.config || './.i18n-codegen.json')
    if (argv.watch) {
        const watcher = watch(config, watchOptions)
        let r = runConfigFile(true, onError, config)
        watcher.addListener('all', () => {
            r()
            r = runConfigFile(true, onError, config)
        })
        return () => watcher.close()
    }
    return runConfigFile(false, onError, config)
}
