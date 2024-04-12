import { DiagnosticCode, DiagnosticMessage, type EmittedFile, type ParsedFile } from '../../../analyzer/type.js'
import ts from 'typescript'
import type { CompilerHost, CompilerOptions } from 'typescript'
const { factory, SyntaxKind, NodeFlags, ModuleKind, ScriptTarget } = ts
import type { Generator_I18Next_ReactHooks } from '../../../json-schema.js'
import {
    createPropertyName,
    NUMBER_TYPE,
    createReadonlyType,
    printer,
    isIdent,
    castStatement,
    castExpression,
    stdlib,
    pureAnnotate,
} from '../../../utils/typescript.js'
import type { Statement, TypeNode } from 'typescript'
import type { Project } from '../../../analyzer/project.js'
import { for_each_symbol_child, type TranslateSymbol } from '../../../analyzer/symbol.js'
import { format_diagnostic_message } from '../../../analyzer/utils.js'

export function i18next_react_hooks_emitter(
    parsed_file: ParsedFile,
    options: Generator_I18Next_ReactHooks,
    project: Project,
    output_base: string,
): EmittedFile {
    const emitted_file: EmittedFile = {
        diagnostics: [],
        files: new Map(),
    }
    const { root_symbol } = project

    const emitting_namespace = options?.namespace ?? 'translation'
    root_symbol.get_namespace(emitting_namespace)



    // for each translate string, more than one definition does not make sense for the runtime. We only use the first symbol and report for the rest.
    const current_namespace_strings = new Map<string, TranslateSymbol>()

    for (const symbol of current_namespace) {
        for_each_symbol_child(symbol, [], [], function visitor(type, symbol, path, path_is_namespace) {
            // namespace symbol
            if (path.length === 1) return for_each_symbol_child(symbol, [], [], visitor)
            if (path.length > 2 || path_is_namespace[1]) {
                emitted_file.diagnostics.push({
                    category: ts.DiagnosticCategory.Warning,
                    code: DiagnosticCode.nested_namespace_or_object_generation_is_not_supported_yet,
                    messageText: DiagnosticMessage.nested_namespace_or_object_generation_is_not_supported_yet,
                    file: parsed_file.source_file,
                    start: symbol.node?.pos,
                    length: symbol.node ? symbol.node.pos - symbol.node.end : undefined,
                })
                // don't report deeper
                return
            }
            for (const member_name of symbol.member_names) {
                const members = symbol.get_member(member_name)
                if (!members.length) continue
                const [{ string }] = members
                if (string === undefined) continue
                current_namespace_strings.set(member_name, members[0])

                for (const member of members.slice(1)) {
                    if (member.string === string) continue
                    emitted_file.diagnostics.push({
                        category: ts.DiagnosticCategory.Warning,
                        code: DiagnosticCode.string_0_is_defined_multiple_times_in_namespace_1_this_might_be_caused_by_misconfiguration_of_i18n_codegen_or_if_you_really_mean_it_it_might_cause_problem_in_runtime,
                        messageText: format_diagnostic_message(
                            DiagnosticMessage.string_0_is_defined_multiple_times_in_namespace_1_this_might_be_caused_by_misconfiguration_of_i18n_codegen_or_if_you_really_mean_it_it_might_cause_problem_in_runtime,
                            member.name,
                        ),
                        file: parsed_file.source_file,
                        start: member.node?.pos,
                        length: member.node ? member.node.pos - member.node.end : undefined,
                    })
                }
            }
        })
    }

    const statements: Statement[] = [
        castStatement`import { useMemo } from 'react'`,
        castStatement`import type { InterpolationOptions, TOptionsBase } from 'i18next'`,
        castStatement`import { useTranslation } from 'react-i18next'`,
        castStatement`
        type I18NextOptions<T> = (
            | T
            | {
                  /** object with vars for [interpolation](https://www.i18next.com/translation-function/interpolation) - or put them directly in options */
                  readonly replace: T
              }
        ) &
            (Pick<TOptionsBase, 'lng' | 'lngs' | 'fallbackLng' | 'postProcess' | 'interpolation'> & {
                interpolation?: SupportedInterpolationOptions
            })
        `,
        castStatement`
        type SupportedInterpolationOptions = Omit<
            InterpolationOptions,
            | 'formatSeparator'
            | 'prefix'
            | 'suffix'
            | 'prefixEscaped'
            | 'suffixEscaped'
            | 'unescapeSuffix'
            | 'unescapePrefix'
            | 'nestingPrefix'
            | 'nestingSuffix'
            | 'nestingPrefixEscaped'
            | 'nestingSuffixEscaped'
            | 'nestingOptionsSeparator'
            | 'defaultVariables'
        >
        `,
    ]
    if (options?.es6Proxy !== false) {
        statements.push(castStatement`${createProxy.toString()}`)
    }

    // Codegen
    const printedSourceFile = [
        options?.emitTS && '// @ts-nocheck',
        '/* eslint-disable */',
        printer.printFile(
            factory.createSourceFile(statements, factory.createToken(SyntaxKind.EndOfFileToken), NodeFlags.Synthesized),
        ),
    ]
        .filter(Boolean)
        .join('\n')

    if (options?.emitTS) {
        emitted_file.files.set('$base.ts', printedSourceFile)
        return emitted_file
    }

    const compiler_options: CompilerOptions = {
        declaration: true,
        strict: true,
        skipLibCheck: true,
        module: ModuleKind.ESNext,
        target: ScriptTarget.ES2015,
        lib: ['lib.es2015.d.ts', 'lib.jsx.d.ts'],
        outDir: '/out/',
    }

    const synthesized_filename = parsed_file.filename + '.ts'
    const fs: Record<string, string> = {
        [synthesized_filename]: printedSourceFile,
    }
    const host: CompilerHost = {
        fileExists: (fileName) => false,
        readFile: (fileName) => undefined,
        writeFile: (fileName, content) => (fs[fileName] = content),
        getSourceFile: (fileName, option) => {
            if (fileName.endsWith('.d.ts')) return stdlib(fileName)
            if (fs[fileName]) return ts.createSourceFile(fileName, fs[fileName], option)
            return undefined
        },
        getDefaultLibFileName: () => 'NONE',
        getCurrentDirectory: () => '/',
        getCanonicalFileName: (x) => x,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n',
    }

    const program = ts.createProgram(
        [synthesized_filename],
        compiler_options,
        host,
        project.old_ts_program.get(synthesized_filename),
        [],
    )
    project.old_ts_program.set(synthesized_filename, program)

    const result = program.emit()

    const js = fs[`/out/${parsed_file.filename}.js`]
    const dts = fs[`/out/${parsed_file.filename}.d.ts`]
    emitted_file.diagnostics.push(...result.diagnostics)
    emitted_file.files.set(`${output_base}.js`, js || '')
    emitted_file.files.set(`${output_base}.d.ts`, dts || '')
    return emitted_file
}

const createProxy = `function createProxy(initValue: (key: string) => any) {
    function define(key: string) {
        const value = initValue(key)
        Object.defineProperty(container, key, { value, configurable: true })
        return value
    }
    const container = {
        __proto__: new Proxy(
            { __proto__: null },
            {
                get(_, key) {
                    if (typeof key === 'symbol') return undefined
                    return define(key)
                },
            },
        ),
    }
    return new Proxy(container, {
        getPrototypeOf: () => null,
        setPrototypeOf: (_, v) => v === null,
        getOwnPropertyDescriptor: (_, key) => {
            if (typeof key === 'symbol') return undefined
            if (!(key in container)) define(key)
            return Object.getOwnPropertyDescriptor(container, key)
        },
    })
}`
