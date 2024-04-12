import { type Config, type ConfigFile, type BaseConfig } from './json-schema.js'
import { type EmittedFile } from './analyzer/type.js'
import { dirname, resolve } from 'path'
import { readFileSync } from 'fs'
import { watch } from 'chokidar'
import { sys, write_emitted_result } from './sys.js'
import { isAbsolute } from 'path'
import { Project } from './analyzer/project.js'
import { default_diagnostic_formatter } from './utils/typescript.js'
export * from './json-schema.js'

/**
 * Transpile a single file without cross-file knowledge.
 *
 * This method does not have IO.
 * @param config The config to be used.
 * @param jsonFileContent The JSON file to be transpiled.
 * @returns A map contains the generated result.
 */
export function transpileFilePure(config: BaseConfig, jsonFileContent: string): EmittedFile {
    const project = new Project()
    const filename = '/input.json'
    project.add_file_from_content(config, filename, jsonFileContent)
    return project.emit(filename, 'output')
}
/**
 * Transpile a single file without cross-file knowledge and write it to the file system.
 * @param config The config to be used.
 * @param configFilePath The base path of relative path in the config file. It will be an error if relative path is used but no configFilePath is provided.
 * @param diagnostics_reporter The function to report diagnostics.
 */
export function transpileFile(
    config: Config,
    configFilePath?: string,
    diagnostics_reporter = default_diagnostic_formatter,
): EmittedFile {
    const { input, output } = resolve_path(configFilePath, config.input, config.output)

    const project = new Project()
    const filename = '/input.json'
    project.add_file_from_content(config, filename, sys.readFile(input))

    const result = project.emit(filename, output)
    write_emitted_result(result, diagnostics_reporter)
    return result
}
/**
 * Transpile a single file in the watch mode without cross-file knowledge and write it to the file system.
 * @param config The config to be used.
 * @param configFilePath The base path of relative path in the config file. It will be an error if relative path is used but no configFilePath is provided.
 * @param diagnostics_reporter The function to report diagnostics.
 * @returns
 */
export function transpileFileWatch(
    config: Config,
    configFilePath?: string,
    diagnostics_reporter = default_diagnostic_formatter,
) {
    const { input, output } = resolve_path(configFilePath, config.input, config.output)
    const project = new Project()
    const watcher = watch(input, watchOptions)
    watcher.on('all', () => {
        project.add_file_from_content(config, input, sys.readFile(input))
        const result = project.emit(input, output)
        write_emitted_result(result, diagnostics_reporter)
    })
    return () => watcher.close()
}

const watchOptions = { atomic: true, awaitWriteFinish: true, ignoreInitial: false }

export function runConfigList(watchMode: true, onError: E, configs: Args[]): () => void
export function runConfigList(watchMode: false, onError: E, configs: Args[]): void
export function runConfigList(watchMode: boolean, onError: E, configs: Args[]): void | (() => void)
export function runConfigList(watchMode: boolean, onError: E, configs: Args[]) {
    if (watchMode) {
        const cancel = configs.map((x) => transpileFilePureWatch(onError, ...x))
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
export function runConfigFile(watchMode: boolean, onRecoverableError: E, configFilePath: string): void | (() => void)
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
    } else return runConfigFile(false, onError, config)
}

function resolve_path(config_file_path: string | undefined, input: string, output: string) {
    if (isAbsolute(input) && isAbsolute(output)) return { input, output }
    if (!config_file_path)
        throw new TypeError('config_file_path should be provided when input or output is not absolute.')

    const base = dirname(config_file_path)
    const absolute_input_path = resolve(base, input)
    const absolute_output_path = resolve(base, output)

    return { input: absolute_input_path, output: absolute_output_path }
}
