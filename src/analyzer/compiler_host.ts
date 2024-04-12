import { i18next_parser, i18next_react_hooks_emitter } from '../frameworks/i18next/index.js'
import { GeneratorList, ParserList, type BaseConfig } from '../json-schema.js'
import type { Project } from './project.js'
import type { Emitter, ParsedFile, Parser } from './type.js'

export const parsers: Record<ParserList, Parser> = { [ParserList.i18next]: i18next_parser }
export const generators: Record<GeneratorList, Emitter> = {
    [GeneratorList.i18next_reactHooks]: i18next_react_hooks_emitter,
}
export class CompilerHost {
    constructor(project: Project) {
        this.#project = project
    }
    #project: Project
    add_file(filename: string, config: BaseConfig, file: Error | ParsedFile | string) {
        this.#project.add_file_from_content(config, filename, file)
    }
    emit_file(filename: string, output_base: string) {}
}

export function validate_parser({ parser }: BaseConfig) {
    if (typeof parser === 'string') parser = { type: parser }
    if (!(parser.type in parsers)) throw new TypeError(`Unknown parser: ${parser.type}`)
    return parser
}
export function validate_generator({ generator }: BaseConfig) {
    if (typeof generator === 'string') generator = { type: generator }
    if (!(generator.type in generators)) throw new TypeError(`Unknown generator: ${generator.type}`)
    return generator
}
export function get_namespace_from_generator(generator: ReturnType<typeof validate_generator>) {
    if (typeof generator === 'string') generator = { type: generator }
    return generator.namespace || 'translation'
}
