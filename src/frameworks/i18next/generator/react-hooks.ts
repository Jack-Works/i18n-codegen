import { GeneratorInput, ParseNode } from '../../../type'
import ts, { Statement, factory, addSyntheticLeadingComment, TypeNode } from 'typescript'
import { I18NextParsedFile, I18NextParseNode, I18NextParseNodeInfo } from '../parser/types'
import { Generator_I18Next_ReactHooks } from '../../../json-schema'
import {
    createPropertyName,
    NUMBER_TYPE,
    createReadonlyType,
    printer,
    ImportComponentTypeFromReact,
} from '../../../utils/typescript'

type GenType = GeneratorInput<I18NextParsedFile, Generator_I18Next_ReactHooks>

export function i18NextReactHooksGenerator(gen: GenType) {
    // nested key not supported yet.
    const items = getTopLevelKeys(gen.parseResult)
    return new Map([
        //
        [gen.outputBase + '.js', generateJS(gen, items)],
        ...Object.entries(generateDTS(gen, items)),
    ])
}

//#region Generate .d.ts
function generateDTS(gen: GenType, [items, comments]: ReturnType<typeof getTopLevelKeys>) {
    const statements: Statement[] = []

    const htmlTags: typeof items = new Map()

    // useTypedTranslation
    {
        const elements: ts.TypeElement[] = []

        for (const [key, detail] of items) {
            if (detail.type !== 'key') continue // TODO
            if (detail.tags.size) {
                htmlTags.set(key, detail)
                continue
            }

            const params: ts.ParameterDeclaration[] = []
            if (detail.interpolations.size) {
                params.push(
                    factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        undefined,
                        'options',
                        undefined,
                        createInterpolationType(detail.interpolations),
                    ),
                )
            }
            // TODO: maybe support return JSX from the hooks, then this should be a JSXElement
            const returnType = factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)

            // key(...params): type
            const node = factory.createMethodSignature(
                undefined,
                createPropertyName(key),
                undefined,
                undefined,
                params,
                returnType,
            )
            const comment = getCommentForKey(key)
            comment && addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, comment, true)
            elements.push(node)
        }

        // export function useTypedTranslation(): { elements... }
        statements.push(
            factory.createFunctionDeclaration(
                undefined,
                factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
                undefined,
                gen.generatorOptions?.hooks || 'useTypedTranslation',
                undefined,
                [],
                factory.createTypeLiteralNode(elements),
                undefined,
            ),
        )
    }

    // TypedTrans
    if (htmlTags.size) {
        statements.unshift(ImportComponentTypeFromReact, TransProps, TypedTransProps)

        const elements: ts.TypeElement[] = []
        for (const [key, detail] of htmlTags) {
            if (detail.type !== 'key') continue // TODO
            const node = factory.createPropertySignature(
                undefined,
                createPropertyName(key),
                undefined,
                createTagType(createInterpolationType(detail.interpolations), [...detail.tags.keys()]),
            )
            const comment = getCommentForKey(key)
            comment && addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, comment, true)
            elements.push(node)
        }
        statements.push(
            factory.createVariableStatement(
                [
                    factory.createModifier(ts.SyntaxKind.ExportKeyword),
                    factory.createModifier(ts.SyntaxKind.DeclareKeyword),
                ],
                factory.createVariableDeclarationList(
                    [
                        factory.createVariableDeclaration(
                            factory.createIdentifier(gen.generatorOptions?.trans || 'TypedTrans'),
                            undefined,
                            factory.createTypeLiteralNode(elements),
                            undefined,
                        ),
                    ],
                    ts.NodeFlags.Const,
                ),
            ),
        )
    }

    const file = ts.createSourceFile('index.d.ts', '', ts.ScriptTarget.ESNext, false, ts.ScriptKind.TS)
    return {
        [gen.outputBase + '.d.ts']: printer.printFile(ts.factory.updateSourceFile(file, statements, true)),
    }

    function getCommentForKey(key: string) {
        const comment = comments.get(key)
        if (!comment) return null
        const string = comment.map((x) => `  * ${x}`).join('\n\n')
        if (string.includes('*/')) return null
        return `*\n${string}\n  `
    }
}

// type TypedTransProps<Value, Components> = Omit<TransProps<string>, 'values' | 'ns' | 'i18nKey'> & ({} extends Value ? {} : { values: Value }) & { components: Components }
const TypedTransProps = factory.createTypeAliasDeclaration(
    undefined,
    undefined,
    factory.createIdentifier('TypedTransProps'),
    [
        factory.createTypeParameterDeclaration(factory.createIdentifier('Value'), undefined, undefined),
        factory.createTypeParameterDeclaration(factory.createIdentifier('Components'), undefined, undefined),
    ],
    factory.createIntersectionTypeNode([
        factory.createTypeReferenceNode(factory.createIdentifier('Omit'), [
            factory.createTypeReferenceNode(factory.createIdentifier('TransProps'), [
                factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            ]),
            factory.createUnionTypeNode([
                factory.createLiteralTypeNode(factory.createStringLiteral('values')),
                factory.createLiteralTypeNode(factory.createStringLiteral('ns')),
                factory.createLiteralTypeNode(factory.createStringLiteral('i18nKey')),
            ]),
        ]),
        factory.createParenthesizedType(
            factory.createConditionalTypeNode(
                factory.createTypeLiteralNode([]),
                factory.createTypeReferenceNode(factory.createIdentifier('Value'), undefined),
                factory.createTypeLiteralNode([]),
                factory.createTypeLiteralNode([
                    factory.createPropertySignature(
                        undefined,
                        factory.createIdentifier('values'),
                        undefined,
                        factory.createTypeReferenceNode(factory.createIdentifier('Value'), undefined),
                    ),
                ]),
            ),
        ),
        factory.createTypeLiteralNode([
            factory.createPropertySignature(
                undefined,
                factory.createIdentifier('components'),
                undefined,
                factory.createTypeReferenceNode(factory.createIdentifier('Components'), undefined),
            ),
        ]),
    ]),
)

// import type { TransProps } from 'react-i18next'
const TransProps = factory.createImportDeclaration(
    undefined,
    undefined,
    factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([
            factory.createImportSpecifier(false, undefined, factory.createIdentifier('TransProps')),
        ]),
    ),
    factory.createStringLiteral('react-i18next'),
)

function createTagType(props: TypeNode, tagNames: string[]) {
    return factory.createTypeReferenceNode(factory.createIdentifier('ComponentType'), [
        factory.createTypeReferenceNode(factory.createIdentifier('TypedTransProps'), [
            props,
            factory.createTypeLiteralNode(
                tagNames.map((tag) =>
                    factory.createPropertySignature(
                        undefined,
                        createPropertyName(tag),
                        undefined,
                        factory.createTypeReferenceNode(
                            factory.createQualifiedName(
                                factory.createIdentifier('JSX'),
                                factory.createIdentifier('Element'),
                            ),
                            undefined,
                        ),
                    ),
                ),
            ),
        ]),
    ])
}
function createInterpolationType(interpolations: I18NextParseNodeInfo['interpolations']) {
    return createReadonlyType(
        factory.createTypeLiteralNode(
            [...interpolations].map(([key, [, type, required]]) =>
                factory.createPropertySignature(
                    undefined,
                    key,
                    required ? undefined : factory.createToken(ts.SyntaxKind.QuestionToken),
                    type,
                ),
            ),
        ),
    )
}

//#endregion

//#region Generate JS
function generateJS(gen: GenType, [items]: ReturnType<typeof getTopLevelKeys>): string {
    const ns = gen.generatorOptions?.namespace
    const useProxy = gen.generatorOptions?.es6Proxy !== false
    return `/* eslint-disable */
import { createElement, useMemo } from 'react'
import { useTranslation, Trans } from 'react-i18next'
const bind = (i18nKey) => (props) => createElement(Trans, { i18nKey, ${
        ns ? `ns: ${JSON.stringify(ns)}, ` : ''
    }...props })
export function ${gen.generatorOptions?.hooks || 'useTypedTranslation'}() {
    const { t } = useTranslation(${ns ? JSON.stringify(ns) : ''})
    return useMemo(
        ${
            useProxy
                ? proxyBasedHooks.toString() + ','
                : `() => ({
            ${[...items]
                .map(generateUseTKeys)
                .filter((x) => x)
                .join(', ')}
        }),`
        }
        [t],
    )
}
export const ${gen.generatorOptions?.trans || 'TypedTrans'} = ${
        useProxy
            ? proxyBasedTrans.toString() + '()'
            : `{${[...items]
                  .map(generateComponentBinding)
                  .filter((x) => x)
                  .join(', ')}}`
    }`
}
function generateUseTKeys([k, r]: [k: string, r: I18NextParseNode]) {
    if (r.type !== 'key') return null
    const key = JSON.stringify(k)
    const prop = `[${key}]` // { ["key"]: ... }
    if (r.tags.size) return null
    if (r.interpolations.size) return `${prop}: x => t(${key}, x)`
    return `${prop}: () => t(${key})`
}
function generateComponentBinding([k, r]: [k: string, r: I18NextParseNode]) {
    if (r.type !== 'key') return null
    const key = JSON.stringify(k)
    const prop = `[${key}]` // { ["key"]: ... }
    if (!r.tags.size) return null
    return `${prop}: bind(${key})`
}
//#endregion

function getTopLevelKeys(x: I18NextParsedFile) {
    if (x.root.type !== 'object') throw new Error()
    const realNodes: ReadonlyMap<string, ParseNode<I18NextParseNode>> = x.root.items
    const nodes = new Map(realNodes)
    const comments = new Map<string, string[]>()
    function appendComment(key: string, content: string) {
        if (!comments.has(key)) comments.set(key, [])
        return comments.get(key)!.push(content)
    }

    for (const [key, node] of realNodes) {
        if (node.type !== 'key') continue
        appendComment(key, '`' + node.value + '`')
    }
    for (const [key, variants] of x.variantList) {
        for (const [k, v] of variants) {
            if (k === key) continue
            appendComment(key, '- ' + k + ': `' + v + '`')
        }
    }

    // setup all synthetic nodes
    for (const [base, details] of [...x.plurals, ...x.contexts]) {
        if (!nodes.has(base)) {
            nodes.set(base, {
                type: 'key',
                interpolations: new Map(),
                tags: new Map(),
                value: '',
                position: [null, null],
                value_position: [null, null],
            })
        }

        const baseNode = nodes.get(base)!
        for (const [_, detail] of details) {
            if (detail.type !== 'key') continue

            if (baseNode.type === 'key') {
                // append all interpolation/tags of the plural version to the base version
                detail.interpolations.forEach((t, k) => {
                    if (k === 'count') t[1] = NUMBER_TYPE
                    if (!baseNode.interpolations.has(k)) baseNode.interpolations.set(k, t)
                    else {
                        const orig = baseNode.interpolations.get(k)!
                        if (orig[2] || t[2]) orig[2] = true
                        orig[1] = factory.createIntersectionTypeNode([orig[1], t[1]])
                    }
                })
                detail.tags.forEach((t, k) => baseNode.tags.set(k, t))
            }
        }
    }

    // TODO: should calculate if context and plural is required property.
    for (const [pluralBase] of x.plurals) {
        const baseNode = nodes.get(pluralBase)!

        if (baseNode.type === 'key') {
            baseNode.interpolations.set('count', [[null, null], NUMBER_TYPE, false])
        }
    }

    for (const [contextBase, contextNodes] of x.contexts) {
        const baseNode = nodes.get(contextBase)!

        if (baseNode.type === 'key') {
            baseNode.interpolations.set('context', [
                [null, null],
                factory.createUnionTypeNode(
                    [...contextNodes.keys()]
                        .map(String)
                        .map((string) => factory.createLiteralTypeNode(factory.createStringLiteral(string))),
                ),
                false,
            ])
        }
    }
    return [nodes, comments] as const
}

function proxyBasedHooks() {
    // @ts-ignore
    declare const t: any
    return new Proxy({ __proto__: null } as any, {
        get(target, key) {
            if (target[key]) return target[key]
            return (target[key] = t.bind(null, key))
        },
    })
}
function proxyBasedTrans() {
    // @ts-ignore
    declare const bind: any
    return new Proxy({ __proto__: null } as any, {
        get(target, key) {
            if (target[key]) return target[key]
            return (target[key] = bind(key))
        },
    })
}
