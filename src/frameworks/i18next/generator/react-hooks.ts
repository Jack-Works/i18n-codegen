import type { GeneratorInput, ParseNode } from '../../../type.js'
import ts from 'typescript'
import type { CompilerHost, CompilerOptions } from 'typescript'
const { factory, SyntaxKind, NodeFlags, ModuleKind, ScriptTarget } = ts
import type { I18NextParsedFile, I18NextParseNode, I18NextParseNodeInfo } from '../parser/types.js'
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

type GenType = GeneratorInput<I18NextParsedFile, Generator_I18Next_ReactHooks>

export function i18NextReactHooksGenerator(gen: GenType) {
    // nested key not supported yet.
    const [items, comments] = getTopLevelKeys(gen.parseResult)

    const statements: Statement[] = [
        castStatement`import { useMemo } from 'react'`,
        castStatement`import { useTranslation } from 'react-i18next'`,
    ]
    if (gen.generatorOptions?.es6Proxy !== false) {
        statements.push(castStatement`${createProxy.toString()}`)
    }

    const htmlTags: typeof items = new Map()
    let hooksReturnType: TypeNode
    // hooks return type
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
                        'options',
                        undefined,
                        createInterpolationType(detail.interpolations),
                    ),
                )
            }
            // TODO: maybe support return JSX from the hooks, then this should be a JSXElement
            const returnType = factory.createKeywordTypeNode(SyntaxKind.StringKeyword)

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
            comment && ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, comment, true)
            elements.push(node)
        }
        hooksReturnType = factory.createTypeLiteralNode(elements)
    }
    const hooksCode = [
        // const { t } = useTranslation(ns)
        factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
                [
                    factory.createVariableDeclaration(
                        factory.createObjectBindingPattern([
                            factory.createBindingElement(
                                undefined,
                                undefined,
                                factory.createIdentifier('t'),
                                undefined,
                            ),
                        ]),
                        undefined,
                        undefined,
                        factory.createCallExpression(
                            factory.createIdentifier('useTranslation'),
                            undefined,
                            gen.generatorOptions?.namespace
                                ? [factory.createStringLiteral(gen.generatorOptions.namespace)]
                                : [],
                        ),
                    ),
                ],
                ts.NodeFlags.Const,
            ),
        ),
        factory.createReturnStatement(
            gen.generatorOptions?.es6Proxy === false
                ? castExpression`useMemo(() => ({
                        ${[...items].map(generateUseTKeys).filter(Boolean).join(', ')}
                    }), [t])`
                : castExpression`useMemo(() => createProxy((key) => t.bind(null, key)), [t])`,
        ),
    ]

    // create hooks function
    statements.push(
        factory.createFunctionDeclaration(
            [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            undefined,
            factory.createIdentifier(gen.generatorOptions?.hooks || 'useTypedTranslation'),
            undefined,
            [],
            hooksReturnType,
            factory.createBlock(hooksCode, false),
        ),
    )

    // create TypedTranslate
    if (htmlTags.size) {
        statements[0] = castStatement`import { createElement, useMemo, type ComponentType } from 'react'`
        statements[1] = castStatement`import { useTranslation, Trans, type TransProps } from 'react-i18next'`
        statements.push(
            ...statements.splice(
                2,
                statements.length - 2,
                castStatement`
                    type TypedTransProps<Value, Components> =
                        Omit<TransProps<string>, 'values' | 'ns' | 'i18nKey'> &
                        ({} extends Value ? {} : { values: Value }) & { components: Components }
                `,
            ),
        )
        statements.push(castStatement`
            function createComponent(i18nKey: string) {
                return (props) => createElement(Trans, { i18nKey ${
                    gen.generatorOptions?.namespace ? ', ns:' + JSON.stringify(gen.generatorOptions.namespace) : ''
                }, ...props })
            }
        `)

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
            comment && ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, comment, true)
            elements.push(node)
        }
        statements.push(
            factory.createVariableStatement(
                [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                factory.createVariableDeclarationList(
                    [
                        factory.createVariableDeclaration(
                            factory.createIdentifier(gen.generatorOptions?.trans || 'TypedTrans'),
                            undefined,
                            factory.createTypeLiteralNode(elements),
                            gen.generatorOptions?.es6Proxy === false
                                ? factory.createObjectLiteralExpression(
                                      [...htmlTags]
                                          .map(([k, r]): ts.PropertyAssignment => {
                                              if (r.type !== 'key') return null!
                                              return factory.createPropertyAssignment(
                                                  createPropertyName(k),
                                                  pureAnnotate(castExpression`createComponent(${JSON.stringify(k)})`),
                                              )
                                          })
                                          .filter(Boolean),
                                      true,
                                  )
                                : pureAnnotate(castExpression`createProxy(createComponent)`),
                        ),
                    ],
                    ts.NodeFlags.Const,
                ),
            ),
        )
    }

    // Codegen
    const printedSourceFile = [
        gen.generatorOptions?.emitTS && '// @ts-nocheck',
        '/* eslint-disable */',
        printer.printFile(
            factory.createSourceFile(statements, factory.createToken(SyntaxKind.EndOfFileToken), NodeFlags.Synthesized),
        ),
    ]
        .filter(Boolean)
        .join('\n')

    if (gen.generatorOptions?.emitTS) return new Map([[gen.outputBase + '.ts', printedSourceFile]])

    const options: CompilerOptions = {
        declaration: true,
        strict: true,
        skipLibCheck: true,
        module: ModuleKind.ESNext,
        target: ScriptTarget.ES2015,
        lib: ['lib.es2015.d.ts', 'lib.jsx.d.ts'],
        outDir: '/out/',
    }
    const fs: Record<string, string> = {
        ['/index.ts']: printedSourceFile,
    }
    const host: CompilerHost = {
        fileExists: (fileName) => false,
        readFile: (fileName) => undefined,
        writeFile: (fileName, content) => (fs[fileName] = content),
        getSourceFile: (fileName, option) => {
            if (fileName.endsWith('.d.ts')) return stdlib(fileName)
            if (fs[fileName]) return ts.createSourceFile(fileName, fs[fileName], option)
            console.trace('get', fileName)
            return undefined
        },
        getDefaultLibFileName: () => 'NONE',
        getCurrentDirectory: () => '/',
        getCanonicalFileName: (x) => x,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n',
    }

    const program = ts.createProgram(['/index.ts'], options, host, undefined, [])
    const result = program.emit()

    const js = fs['/out/index.js']
    const dts = fs['/out/index.d.ts']
    if (!js || !dts) {
        console.log(
            ts.formatDiagnostics(result.diagnostics, {
                getCanonicalFileName: (x) => x,
                getCurrentDirectory: () => '/',
                getNewLine: () => '\n',
            }),
        )
        throw new Error('internal error: file not emitted')
    }
    return new Map([
        [gen.outputBase + '.js', js],
        [gen.outputBase + '.d.ts', dts],
    ])

    function getCommentForKey(key: string) {
        const comment = comments.get(key)
        if (!comment) return null
        const string = comment.map((x) => `  * ${x}`).join('\n\n')
        if (string.includes('*/')) return null
        return `*\n${string}\n  `
    }
}

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

function getPropertyKeyTextFromText(text: string) {
    if (isIdent(text)) return text
    return `[${JSON.stringify(text)}]`
}
function generateUseTKeys([k, r]: [k: string, r: I18NextParseNode]) {
    if (r.type !== 'key') return null
    if (r.tags.size) return null
    const key = JSON.stringify(k)
    const prop = getPropertyKeyTextFromText(k)
    if (r.interpolations.size) return `${prop}: x => t(${key}, x)`
    return `${prop}: () => t(${key})`
}

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
