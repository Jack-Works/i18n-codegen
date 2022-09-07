import type { NodeArray, PropertyAssignment, StringLiteral, TypeNode } from 'typescript'
import ts from 'typescript'
const { isStringLiteral, isObjectLiteralExpression, factory, getLineAndCharacterOfPosition } = ts
import type { ParserInput, ParseNode } from '../../../type.js'
import { addPosition, Position } from '../../../utils/position.js'
import { AST, Node, parse } from 'i18next-translation-parser'
import type { I18NextParsedFile, I18NextParseNodeInfo, I18NextParseNode_String } from './types.js'
import type { Parser_I18NextConfig } from '../../../json-schema.js'
import {
    STRING_TYPE,
    NUMBER_TYPE,
    DATE_TYPE,
    createPropertyName,
    createReadonlyType,
} from '../../../utils/typescript.js'

const StartQuoteLength = 1
const TagStartLength = 1
const pluralPostfixes = ['zero', 'one', 'two', 'few', 'many', 'other']

export function i18NextParser(opts: ParserInput<Parser_I18NextConfig>): I18NextParsedFile {
    const { mockSourceFile, sourceFile, parserOptions = {} } = opts

    const result = new Map<string, ParseNode<I18NextParseNodeInfo>>()

    if (!isObjectLiteralExpression(sourceFile)) return makeResult()

    for (const prop of sourceFile.properties as NodeArray<PropertyAssignment>) {
        const key = (prop.name as StringLiteral).text
        if (!isStringLiteral(prop.initializer)) continue
        const value = prop.initializer.text
        const propResult: I18NextParseNode_String = {
            type: 'key',
            value,
            position: posToPosition(prop.name.getStart(mockSourceFile)),
            value_position: posToPosition(prop.initializer.getStart(mockSourceFile)),
            interpolations: new Map(),
            tags: new Map(),
        }
        const ast = parse(value)
        const { tags, interpolations, value_position } = propResult

        const interpolationMap = new Map<string, [Position, CombinePropertyAccessChain]>()
        visitAST(ast, (node, pos) => {
            if (node.type === 'tag') {
                tags.set(node.name, addPosition(value_position, [0, pos + StartQuoteLength + TagStartLength]))
            } else if (node.type === 'interpolation' || node.type === 'interpolation_unescaped') {
                let { variable, prefix } = node
                const { name, usedAs } = parseInterpolation(variable)
                const [propertyAccess] = name.split('.', 1)

                if (!interpolationMap.has(propertyAccess)) {
                    interpolationMap.set(propertyAccess, [
                        addPosition(value_position, [0, pos + prefix.length + StartQuoteLength]),
                        new CombinePropertyAccessChain(usedAs),
                    ])
                }

                if (propertyAccess.length === name.length) {
                    interpolationMap.get(propertyAccess)![1].usedAsFinal = true
                } else {
                    interpolationMap.get(propertyAccess)![1].add(name.slice(propertyAccess.length + 1), usedAs)
                }
            }
        })

        for (const [baseName, [pos, rec]] of interpolationMap) {
            interpolations.set(baseName, [pos, rec.toType(), true])
        }

        result.set(key, propResult)
    }

    const plurals = new Map<string, Map<string, ParseNode<I18NextParseNodeInfo>>>()
    const contexts = new Map<string, Map<string, ParseNode<I18NextParseNodeInfo>>>()
    const variantList = new Map<string, [string, string][]>()
    // https://www.i18next.com/translation-function/plurals
    // https://www.i18next.com/translation-function/context
    // https://tc39.es/ecma402/#sec-pluralruleselect
    for (const [key, parsed] of result) {
        const { base, context, plural } = parseKey(parserOptions, key)

        if (plural) {
            if (!plurals.has(base)) plurals.set(base, new Map())
            plurals.get(base)!.set(plural, parsed)
        }
        if (context) {
            if (!contexts.has(base)) contexts.set(base, new Map())
            contexts.get(base)!.set(context, parsed)
        }
        if (parsed.type === 'key') {
            if (!variantList.has(base)) variantList.set(base, [])
            variantList.get(base)!.push([key, parsed.value])
        }
    }
    return makeResult()

    function posToPosition(pos: number): Position {
        const x = getLineAndCharacterOfPosition(mockSourceFile, pos)
        return [x.line + 1, x.character]
    }
    function makeResult(): I18NextParsedFile {
        return {
            root: { type: 'object', position: [0, 0], items: result },
            plurals,
            contexts,
            variantList,
        }
    }
}

function visitAST(ast: AST, callback: (node: Node, position: number) => void, position = 0): number {
    for (const node of ast) {
        callback(node, position)
        if (node.type === 'text') {
            if (node.children) visitAST(node.children, callback, position)
            position += node.content.length
        } else if (node.type === 'tag') {
            const { name, children } = node
            // we assert that tag in i18next cannot be self closed, have attrs nor nested
            position += name.length + 2 // <tag>
            position += visitAST(children, callback, position)
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
 */
function parseKey(parserOptions: Parser_I18NextConfig, key: string): KeyParseResult {
    const { contextSeparator = '_', pluralSeparator = '_' } = parserOptions
    const result: KeyParseResult = { base: key }

    if (key.lastIndexOf(pluralSeparator) !== -1) {
        const restWords = key.slice(key.lastIndexOf(pluralSeparator) + 1)
        if (pluralPostfixes.includes(restWords)) {
            result.plural = restWords
            key = key.slice(0, key.lastIndexOf(pluralSeparator))
        }
    }

    if (key.lastIndexOf(contextSeparator) !== -1) {
        const restWords = key.slice(key.lastIndexOf(contextSeparator) + 1)
        if (restWords.length > 0) {
            result.context = restWords
            key = key.slice(0, key.lastIndexOf(contextSeparator))
        }
    }

    result.base = key
    return result
}
type KeyParseResult = { base: string; context?: string; plural?: string }

// https://www.i18next.com/translation-function/formatting#built-in-formats
function parseInterpolation(x: string) {
    const result: InterpolationParseResult = { name: x, usedAs: STRING_TYPE }
    if (x.includes(',')) {
        const [name, ...format] = x.split(',')
        result.name = name
        const formats = format.join(',').trim()

        if (formats.startsWith('number')) result.usedAs = NUMBER_TYPE
        else if (formats.startsWith('currency')) result.usedAs = NUMBER_TYPE
        else if (formats.startsWith('datetime')) result.usedAs = DATE_TYPE
        else if (formats.startsWith('relativetime')) result.usedAs = NUMBER_TYPE
        else if (formats.startsWith('list'))
            result.usedAs = factory.createTypeOperatorNode(
                ts.SyntaxKind.ReadonlyKeyword,
                factory.createArrayTypeNode(factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)),
            )
    }
    return result
}
type InterpolationParseResult = { name: string; usedAs: TypeNode }

class CombinePropertyAccessChain {
    usedAsFinal = false
    constructor(private type: TypeNode) {}
    private items: Partial<Record<string, CombinePropertyAccessChain>> = Object.create(null)
    add(path: string, usedAs: TypeNode) {
        path.split('.')
            .map((x) => x.trim())
            .reduce((currentObject, currentKey, index, array) => {
                if (!currentObject[currentKey]) currentObject[currentKey] = new CombinePropertyAccessChain(usedAs)
                if (index === array.length - 1) currentObject[currentKey]!.usedAsFinal = true
                return currentObject[currentKey]!.items
            }, this.items)
    }
    toType(): TypeNode {
        if (Object.keys(this.items).length === 0) return this.type
        const elements = Object.entries(this.items).map(([key, val]) => {
            return factory.createPropertySignature(undefined, createPropertyName(key), undefined, val!.toType())
        })
        const objectShape = createReadonlyType(factory.createTypeLiteralNode(elements))
        if (this.usedAsFinal) return factory.createIntersectionTypeNode([this.type, objectShape])
        return objectShape
    }
}
