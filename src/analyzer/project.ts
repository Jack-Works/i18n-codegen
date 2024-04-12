import ts, { type Program } from 'typescript'
import { TranslateSymbol } from './symbol.js'
import { DiagnosticCode, DiagnosticMessage, type EmittedFile, type Emitter, type ParsedFile } from './type.js'
import { create_parsed_file_missing, format_diagnostic_message } from './utils.js'
import type { BaseConfig } from '../json-schema.js'
import {
    validate_parser,
    validate_generator,
    get_namespace_from_generator,
    parsers,
    generators,
} from './compiler_host.js'
import { create_parser_input_from_source_text } from './parser_input.js'

export class Project {
    root_symbol = new TranslateSymbol('ROOT', '', undefined, 'ROOT')

    parsed_files = new Map<string, ParsedFile>()
    generators = new Map<string, Emitter<any>>()
    generator_options = new Map<string, unknown>()
    old_ts_program = new Map<string, Program>()

    resolve_symbol(path: readonly string[], path_is_namespace: readonly boolean[]) {
        let symbol = [this.root_symbol]
        if (path.length !== path_is_namespace.length) {
            throw new Error('path.length !== path_is_namespace.length')
        }
        for (const [index, p] of path.entries()) {
            const is_namespace = path_is_namespace[index]
            if (is_namespace) {
                symbol = symbol.flatMap((s) => s.get_namespace(p))
            } else {
                symbol = symbol.flatMap((s) => s.get_member(p))
            }
        }
        return symbol
    }

    add_file_from_content(config: BaseConfig, filename: string, file: string | Error | ParsedFile) {
        const parser_config = validate_parser(config)
        const generator_config = validate_generator(config)
        if (file instanceof Error) {
            this.#add_missing_file(filename, file)
        } else {
            if (typeof file === 'string') {
                file = parsers[parser_config.type](
                    create_parser_input_from_source_text(filename, file, parser_config),
                    get_namespace_from_generator(generator_config),
                )
            }
            this.add_parsed_file(file, generators[generator_config.type], generator_config)
        }
    }
    add_parsed_file<Options>(parsed_file: ParsedFile, generator: Emitter<Options>, options: Options) {
        this.parsed_files.set(parsed_file.filename, parsed_file)
        this.generators.set(parsed_file.filename, generator)
        this.generator_options.set(parsed_file.filename, options)
    }

    #add_missing_file(file_name: string, error: Error) {
        this.add_parsed_file(
            create_parsed_file_missing(file_name, error),
            () => ({ diagnostics: [], files: new Map() }),
            undefined,
        )
    }

    emit(filename: string, output_base: string): EmittedFile {
        const parsed_file = this.parsed_files.get(filename)
        const generator = this.generators.get(filename)
        const options = this.generator_options.get(filename)
        if (!parsed_file || !generator || !options) {
            return {
                files: new Map(),
                diagnostics: [
                    {
                        category: ts.DiagnosticCategory.Error,
                        code: DiagnosticCode.file_0_is_not_in_the_project,
                        messageText: format_diagnostic_message(
                            DiagnosticMessage.file_0_is_not_in_the_project,
                            filename,
                        ),
                        file: undefined,
                        start: undefined,
                        length: undefined,
                    },
                ],
            }
        }
        return generator(parsed_file, options, this, output_base)
    }
    get_type_of_symbol() {
    }
}
