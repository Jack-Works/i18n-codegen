// @ts-expect-error private api
import { isIdentifierText, isPropertySignature, isTypeLiteralNode, TypeNode } from 'typescript'
import ts, { factory } from 'typescript'

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

// import type { ComponentType } from 'react'
export const ImportComponentTypeFromReact = factory.createImportDeclaration(
    undefined,
    undefined,
    factory.createImportClause(
        true,
        undefined,
        factory.createNamedImports([
            factory.createImportSpecifier(false, undefined, factory.createIdentifier('ComponentType')),
        ]),
    ),
    factory.createStringLiteral('react'),
    undefined,
)

export function createPropertyName(x: string): string | ts.PropertyName {
    if (isIdentifierText(x)) return x
    return factory.createComputedPropertyName(factory.createStringLiteral(x))
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
