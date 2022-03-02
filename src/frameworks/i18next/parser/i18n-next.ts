import {
    isStringLiteral,
    NodeArray,
    PropertyAssignment,
    StringLiteral,
    getLineAndCharacterOfPosition,
    isObjectLiteralExpression,
} from 'typescript'
import { ParserInput, ParseNode } from '../../../type'
import { addPosition, Position } from '../../../utils/position'
import { AST, Node, parse } from 'i18next-translation-parser'
import { I18NextParsedFile, I18NextParseNodeInfo, I18NextParseNode_String } from './types'

const StartQuoteLength = 1
const TagStartLength = 1
const pluralPostfix = /(_zero|_one|_two|_few|_many|_other)$/
export function i18NextParser({ mockSourceFile, sourceFile }: ParserInput<{}>): I18NextParsedFile {
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
        visitAST(ast, (node, pos) => {
            if (node.type === 'tag') {
                tags.set(node.name, [
                    {
                        content: node.name,
                        position: addPosition(value_position, [0, pos + StartQuoteLength + TagStartLength]),
                    },
                    'JSX.Element',
                ])
            } else if (node.type === 'interpolation' || node.type === 'interpolation_unescaped') {
                let { variable, prefix } = node
                const filtered = variable.split(',')[0] // format: x, mm/DD/YYYY
                const propertyAccess = filtered.split('.')
                interpolations.set(propertyAccess[0], [
                    {
                        content: variable,
                        position: addPosition(value_position, [0, pos + prefix.length + StartQuoteLength]),
                    },
                    propertyAccess.length > 1 ? 'object' : 'string',
                    // propertyAccess.slice(1).reduce((acc, cur) => `{ ["${cur}"]: ${acc} }`, 'string'),
                ])
            }
        })
        result.set(key, propResult)
    }

    const plurals = new Map<string, Map<string, ParseNode<I18NextParseNodeInfo>>>()
    // https://www.i18next.com/translation-function/plurals
    // https://tc39.es/ecma402/#sec-pluralruleselect
    for (const [key, parsed] of result) {
        const match = key.match(pluralPostfix)
        if (!match) continue
        const pluralBase = key.slice(0, match.index)
        if (!plurals.has(pluralBase)) plurals.set(pluralBase, new Map())
        plurals.get(pluralBase)!.set(match[0].slice(1), parsed)
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
