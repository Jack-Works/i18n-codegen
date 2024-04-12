import { type Node, type PrefixUnaryExpression, type SourceFile } from 'typescript'
import ts from 'typescript'
const { factory, forEachChild, SyntaxKind } = ts
import { type ParsedFile, DiagnosticCode, DiagnosticMessage } from '../../../analyzer/type.js'
import { TranslateSlot } from '../../../analyzer/slot.js'
import { TranslateSymbol } from '../../../analyzer/symbol.js'
import { type AST, type StringNode, parse } from 'i18next-translation-parser'
import type { Parser_I18NextConfig } from '../../../json-schema.js'
import { STRING_TYPE, NUMBER_TYPE, DATE_TYPE } from '../../../utils/typescript.js'
import type { ParserInput } from '../../../analyzer/parser_input.js'
import { TranslateReference } from '../../../analyzer/reference.js'
import { format_diagnostic_message } from '../../../analyzer/utils.js'
import type { ExpressionStatement } from 'typescript'
import type { PropertyAssignment } from 'typescript'
import type { StringLiteral } from 'typescript'
import type { NumericLiteral } from 'typescript'
import type { ObjectLiteralExpression } from 'typescript'
import type { ArrayLiteralExpression } from 'typescript'
import type { BooleanLiteral } from 'typescript'
import type { NullLiteral } from 'typescript'

const pluralPostfixes = ['zero', 'one', 'two', 'few', 'many', 'other']

// Note: the namespace parameter should be in the parser config, but we don't want to make a big breaking change
export function i18NextParser(opts: ParserInput<Parser_I18NextConfig>, namespace: string): ParsedFile {
    const { source_file, json_node, parser_options = {} } = opts
    const parsed_file: ParsedFile = {
        source_file,
        filename: opts.source_file.fileName,
        namespaces: [],
        members: [],
        diagnostics: [],
    }

    // i18next only support declare one namespace within a JSON file
    // the namespace name is declared from the config
    const file_root_symbol = new TranslateSymbol(source_file.fileName, namespace, json_node, 'FILE_ROOT')
    parsed_file.namespaces.push(file_root_symbol)

    // the symbol we used when deep visiting the tree.
    let parent_symbol = file_root_symbol
    // the redirect_symbol (e.g. x_one can also provide a "x" in the namespace) currently used.
    let redirect_symbol: TranslateSymbol | undefined

    let current_ts_node: Node = json_node
    visitor(source_file)
    return parsed_file

    function visitor(node: Node): void {
        if (!can_appear_in_json(node)) {
            error_on_node(node, DiagnosticCode.invalid_json_content, DiagnosticMessage.invalid_json_content)
            return
        }
        if (node.kind === SyntaxKind.SourceFile) {
            if (node.statements.length !== 1) {
                error_on_node(node, DiagnosticCode.invalid_json_content, DiagnosticMessage.invalid_json_content)
                return
            }
            if (
                !ts.isExpressionStatement(node.statements[0]) ||
                node.statements[0].expression.kind !== SyntaxKind.ObjectLiteralExpression
            ) {
                error_on_node(
                    json_node,
                    DiagnosticCode.translation_file_should_contain_an_object,
                    DiagnosticMessage.translation_file_should_contain_an_object,
                )
                return
            }
            return forEachChild(node.statements[0].expression, visitor)
        }
        if (node.kind === SyntaxKind.PropertyAssignment) {
            const { initializer, name } = node
            if (!ts.isStringLiteral(initializer)) {
                error_on_node(
                    initializer,
                    DiagnosticCode.non_string_value_is_not_supported_yet,
                    DiagnosticMessage.non_string_value_is_not_supported_yet,
                )
                return
            }
            if (!ts.isStringLiteral(name)) {
                error_on_node(name, DiagnosticCode.invalid_json_content, DiagnosticMessage.invalid_json_content)
                return
            }
            const old_parent_symbol = parent_symbol
            const old_redirect_symbol = redirect_symbol

            const current_symbol = new TranslateSymbol(source_file.fileName, name.text, node, name.text)
            parent_symbol = current_symbol
            old_parent_symbol.add_member(current_symbol)
            current_symbol.string = initializer.text

            // add plural symbols
            {
                const { base, context, plural } = parse_key(parser_options, name.text)
                if (context !== undefined || plural !== undefined) {
                    redirect_symbol = new TranslateSymbol(
                        source_file.fileName,
                        base,
                        node,
                        `${base} (from ${name.text})`,
                    )
                    if (context !== undefined) redirect_symbol.contextual_symbol = [parent_symbol, context]
                    if (plural !== undefined) redirect_symbol.plural_symbol = [parent_symbol, plural]
                    old_parent_symbol.add_member(redirect_symbol)
                }
            }
            for_each_child(parse(initializer.text), string_visitor)
            parent_symbol = old_parent_symbol
            redirect_symbol = old_redirect_symbol
            return
        }
        // currently we will never reach here because only SourceFile { ObjectLiteral { StringLiteral: StringLiteral } } is allowed.
        return forEachChild(node, visitor)
    }
    function string_visitor(node: StringNode, pos: number) {
        if (node.type === 'interpolation' || node.type === 'interpolation_unescaped') {
            const slot = parse_interpolation(node.variable)
            parent_symbol.slots.push(slot)
            if (redirect_symbol) redirect_symbol.slots.push(slot)
        } else if (node.type === 'tag') {
            parent_symbol.tags.push(node.name)
            if (redirect_symbol) redirect_symbol.tags.push(node.name)
        } else if (node.type === 'nesting') {
            let string = node.content
            const result = new TranslateReference()
            parent_symbol.references.push(result)
            if (redirect_symbol) redirect_symbol.references.push(result)

            // parse the namespace first.
            namespace_parser: {
                const [before, after] = string.split(':')
                if (before.includes(',') || !after.length) break namespace_parser
                result.push_namespace_access(before.trim())
                string = after
            }

            // parse the name and parameters
            const comma = string.indexOf(',')
            if (comma === -1) {
                result.push_key_access(string.trim())
                return
            }
            const [name, params] = [string.slice(0, comma), string.slice(comma + 1)]
            result.push_key_access(name.trim())

            // params be like a JSON string but wait for interpolation
            // $t(ns:key, { "string": "Hello {{name}}", "name": "John" })
            //            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // we're parsing this part. we assume that the JSON string is valid, if not, we bail out and generate a diagnostics.

            // we do a simple regex replace here and hope it works for the most cases.
            const replaced_params = params.replaceAll(/\{\{\s*\w+(\,\s*\w+\s*)?\s*\}\}/g, '0')
            try {
                const json = JSON.parse(replaced_params)
                let type: string = typeof json
                if (json === null) type = 'null'
                if (Array.isArray(json)) type = 'array'

                if (type === 'object') {
                    result.bound_slot_names.push(...Object.keys(json))
                } else {
                    error_on_node(
                        current_ts_node,
                        DiagnosticCode.the_parameter_of_nesting_reference_must_be_a_json_object_but_found_0,
                        format_diagnostic_message(
                            DiagnosticMessage.the_parameter_of_nesting_reference_must_be_a_json_object_but_found_0,
                            type,
                        ),
                    )
                }
            } catch {
                warn_on_node(
                    current_ts_node,
                    DiagnosticCode.the_parameter_of_nesting_reference_cannot_be_parsed_as_a_valid_json_therefore_the_type_inference_of_this_string_might_be_incorrect,
                    DiagnosticMessage.the_parameter_of_nesting_reference_cannot_be_parsed_as_a_valid_json_therefore_the_type_inference_of_this_string_might_be_incorrect,
                )
            }

            // we also need to parse all interpolation in the params
            const ast = parse(params)
            for_each_child(ast, (node) => {
                if (node.type === 'interpolation' || node.type === 'interpolation_unescaped') {
                    const slot = parse_interpolation(node.variable)
                    parent_symbol.slots.push(slot)
                    if (redirect_symbol) redirect_symbol.slots.push(slot)
                }
                // not handling nested nested reference for now.
            })
        }
    }
    function error_on_node(node: Node, code: DiagnosticCode, message: string) {
        parsed_file.diagnostics.push({
            category: ts.DiagnosticCategory.Error,
            code,
            file: source_file,
            start: node.getStart(source_file),
            length: node.getWidth(source_file),
            messageText: message,
        })
    }
    function warn_on_node(node: Node, code: DiagnosticCode, message: string) {
        parsed_file.diagnostics.push({
            category: ts.DiagnosticCategory.Warning,
            code,
            file: source_file,
            start: node.getStart(source_file),
            length: node.getWidth(source_file),
            messageText: message,
        })
    }
}

function for_each_child(ast: AST, callback: (node: StringNode, position: number) => void, position = 0): number {
    for (const node of ast) {
        callback(node, position)
        if (node.type === 'text') {
            if (node.children) for_each_child(node.children, callback, position)
            position += node.content.length
        } else if (node.type === 'tag') {
            const { name, children } = node
            // we assert that tag in i18next cannot be self closed, have attrs nor nested
            position += name.length + 2 // <tag>
            position += for_each_child(children, callback, position)
            position += name.length + 3 // </tag>
        } else position += node.raw.length
    }
    return position
}

/**
 * The string is in the order of
 *
 * baseName [contextSeparator context](optional) [pluralSeparator plural](optional)
 *
 * example:
 * "base_context$one", "base$one"
 *
 * https://www.i18next.com/translation-function/plurals
 * https://www.i18next.com/translation-function/context
 * https://tc39.es/ecma402/#sec-pluralruleselect
 */
function parse_key(parserOptions: Parser_I18NextConfig, key: string): KeyParseResult {
    const { contextSeparator = '_', pluralSeparator = '_' } = parserOptions
    const result: KeyParseResult = { base: key }

    const lastPluralSeparator = key.lastIndexOf(pluralSeparator)
    if (lastPluralSeparator !== -1) {
        const restWords = key.slice(lastPluralSeparator + 1)
        if (pluralPostfixes.includes(restWords)) {
            result.plural = restWords
            key = key.slice(0, lastPluralSeparator)
        }
    }

    const lastContextSeparator = key.lastIndexOf(contextSeparator)
    if (lastContextSeparator !== -1) {
        const restWords = key.slice(lastContextSeparator + 1)
        if (restWords.length) {
            result.context = restWords
            key = key.slice(0, lastContextSeparator)
        }
    }

    result.base = key
    return result
}
// https://www.i18next.com/translation-function/formatting#built-in-formats
function parse_interpolation(x: string) {
    if (x.includes(',')) {
        const [name, ...formats] = x.split(',')
        const result: TranslateSlot = new TranslateSlot(name.split('.').map((x) => x.trim()))
        for (const format of formats) {
            const t = format.trimStart()
            if (t.startsWith('number')) result.type = NUMBER_TYPE
            else if (t.startsWith('currency')) result.type = NUMBER_TYPE
            else if (t.startsWith('datetime')) result.type = DATE_TYPE
            else if (t.startsWith('relativetime')) result.type = NUMBER_TYPE
            else if (t.startsWith('list'))
                result.type = factory.createTypeOperatorNode(
                    ts.SyntaxKind.ReadonlyKeyword,
                    factory.createArrayTypeNode(factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)),
                )
            else continue
            break
        }
        return result
    } else {
        const slot = new TranslateSlot(x.split('.').map((x) => x.trim()))
        slot.type = STRING_TYPE
        return slot
    }
}

function can_appear_in_json(
    node: Node,
): node is
    | ExpressionStatement
    | PropertyAssignment
    | StringLiteral
    | NumericLiteral
    | ObjectLiteralExpression
    | ArrayLiteralExpression
    | BooleanLiteral
    | NullLiteral
    | PrefixUnaryExpression
    | SourceFile {
    switch (node.kind) {
        case SyntaxKind.SourceFile:
        case SyntaxKind.ExpressionStatement:
        case SyntaxKind.PropertyAssignment:

        case SyntaxKind.StringLiteral:
        case SyntaxKind.NumericLiteral:
        case SyntaxKind.ObjectLiteralExpression:
        case SyntaxKind.ArrayLiteralExpression:
        case SyntaxKind.BooleanKeyword:
        case SyntaxKind.NullKeyword:
            return true
        case SyntaxKind.PrefixUnaryExpression:
            return (
                (node as PrefixUnaryExpression).operator === SyntaxKind.MinusToken &&
                (node as PrefixUnaryExpression).operand.kind === SyntaxKind.NumericLiteral
            )
        default:
            return false
    }
}
interface KeyParseResult {
    base: string
    context?: string
    plural?: string
}
