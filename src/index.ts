import { i18NextParser } from './frameworks/i18next/parser/i18n-next'
import { Config, ConfigFile, GeneratorList, ParserList } from './json-schema'
import { GeneratorInput, ParserInput } from './type'
import { dirname, resolve } from 'path'
import { i18next_reactHooksGenerator } from './frameworks/i18next'
import { readFileSync, writeFileSync } from 'fs'
import { watch } from 'chokidar'
export * from './json-schema'

export function runOneConfig(config: Config, configBaseURL: string, onError: (e: any) => void) {
    try {
        let { generator, input, output, parser } = config
        if (typeof generator === 'string') generator = { type: generator }
        if (typeof parser === 'string') parser = { type: parser }

        input = resolve(configBaseURL, input)
        output = resolve(configBaseURL, output)

        const table = { [ParserList.i18next]: i18NextParser }
        const table2 = { [GeneratorList.i18next_reactHooks]: i18next_reactHooksGenerator }

        const result = table[parser.type](ParserInput.fromFileSystem(input, parser))
        const files = table2[generator.type](new GeneratorInput(result, input, output, generator))

        for (const [file, content] of files) {
            writeFileSync(file, content)
        }
    } catch (e) {
        onError(e)
    }
    return () => {}
}
export function watchOneConfig(config: Config, configBaseURL: string, onError: (e: any) => void) {
    const watcher = watch(resolve(configBaseURL, config.input))
    watcher.on('all', () => runOneConfig(config, configBaseURL, onError))
    return () => watcher.close()
}
export function runConfigList(watchMode: boolean, configs: Config[], configBaseURL: string, onError = console.error) {
    const cancel = configs.map((x) => (watchMode ? runOneConfig : watchOneConfig)(x, configBaseURL, onError))
    return () => cancel.forEach((x) => x())
}
export function runConfig(watchMode: boolean, x: ConfigFile, configBaseURL: string, onError = console.error) {
    if (x.version !== 1) return onError(new Error('Unknown version')), () => {}
    return runConfigList(watchMode, x.list, configBaseURL, onError)
}
export function runConfigFile(configFilePath: string, onError = console.error) {
    try {
        const config = JSON.parse(readFileSync(configFilePath, 'utf-8'))
        const base = dirname(configFilePath)
        return runConfig(true, config, base, onError)
    } catch (e) {
        onError(e)
    }
    return () => {}
}
export function watchConfigFile(configFilePath: string, onError = console.error) {
    const watcher = watch(configFilePath)
    console.log('running in watch mode')

    const cancel: Function[] = []
    watcher.on('all', () => {
        cancel.forEach((x) => x())
        cancel.length = 0
        cancel.push(runConfigFile(configFilePath, onError))
    })
    runConfigFile(configFilePath, onError)
}
export function runCli(argv: { config?: string; cwd?: string; watch?: boolean }, onError = console.error) {
    const config = resolve(process.cwd(), argv.config || './.i18n-codegen.json')
    if (argv.watch) watchConfigFile(config, onError)
    else runConfigFile(config, onError)
}
