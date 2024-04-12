import type { Diagnostic, Expression, ExpressionStatement, SourceFile, Statement, TypeNode } from 'typescript'
import { readFileSync } from 'fs'
import { createRequire } from 'module'
import ts from 'typescript'
const { factory, isPropertySignature, isTypeLiteralNode } = ts

export const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
})
export const STRING_TYPE = factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
export const NUMBER_TYPE = factory.createUnionTypeNode([
    STRING_TYPE,
    factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
    factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword),
])
export const DATE_TYPE = factory.createTypeReferenceNode('Date')

export function createPropertyName(x: string): string | ts.PropertyName {
    if (isIdent(x)) return x
    return factory.createComputedPropertyName(factory.createStringLiteral(x))
}

const scanner = ts.createScanner(ts.ScriptTarget.ESNext, false, ts.LanguageVariant.Standard, '')
const isIdentCache = new Map<string, boolean>()
export function isIdent(text: string) {
    if (isIdentCache.has(text)) return isIdentCache.get(text)!
    scanner.setText(text, 0)
    const result = scanner.scan() === ts.SyntaxKind.Identifier && scanner.scan() === ts.SyntaxKind.EndOfFileToken
    isIdentCache.set(text, result)
    return result
}

export function createReadonlyType(x: TypeNode) {
    // emit `readonly x` in this case will make it easier to read.
    if (isTypeLiteralNode(x) && x.members.length === 1 && isPropertySignature(x.members[0])) {
        return factory.createTypeLiteralNode([
            factory.createPropertySignature(
                factory.createModifiersFromModifierFlags(ts.ModifierFlags.Readonly),
                x.members[0].name,
                undefined,
                x.members[0].type,
            ),
        ])
    }
    return factory.createTypeReferenceNode('Readonly', [x])
}

function getAST(source: string) {
    const sourceFile = ts.createSourceFile('index.ts', source, ts.ScriptTarget.ESNext, false)
    ts.forEachChild(sourceFile, function visitor(node): void {
        ;(node as any).flags |= ts.NodeFlags.Synthesized
        return ts.forEachChild(node, visitor)
    })
    return sourceFile.statements
}

export function castStatement<T extends Statement>(source: TemplateStringsArray, ...args: string[]): T {
    const ast = getAST(String.raw(source, ...args))
    const functionDeclaration = ast[0] as T
    return functionDeclaration
}

export function castExpression<T extends Expression>(source: TemplateStringsArray, ...args: string[]): T {
    const ast = castStatement<ExpressionStatement>(source, ...args)
    return ast.expression as T
}

export function pureAnnotate<T extends ts.Node>(node: T) {
    return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, '#__PURE__', false)
}

let stdlibs = new Map<string, SourceFile>()
export function stdlib(libName: string) {
    if (stdlibs.has(libName)) return stdlibs.get(libName)!
    const sourceFile = ts.createSourceFile(libName, getLibDTS(libName), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS)
    stdlibs.set(libName, sourceFile)
    return sourceFile
}

function getLibDTS(libName: string) {
    libName.startsWith('ES') && (libName = 'lib.' + libName.toLowerCase())
    if (libName === 'lib.jsx.d.ts') return `namespace JSX { export interface Element {} }`
    const require = createRequire(import.meta.url)
    const target = 'typescript/lib/' + libName
    if (!target.endsWith('.d.ts')) throw new Error('lib.d.ts failed to reach')
    const text = readFileSync(require.resolve(target), 'utf-8')
    return text
}

export function default_diagnostic_formatter(diagnostics: readonly Diagnostic[]) {
    console.log(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
            getCanonicalFileName: (x) => x,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => ts.sys.newLine,
        }),
    )
}
