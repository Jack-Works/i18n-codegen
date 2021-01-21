import { readFileSync } from 'fs'
import {
    ArrayLiteralExpression,
    BooleanLiteral,
    ExpressionStatement,
    NullLiteral,
    NumericLiteral,
    ObjectLiteralExpression,
    parseJsonText,
    StringLiteral,
} from 'typescript'

export type JSONNode =
    | ObjectLiteralExpression
    | ArrayLiteralExpression
    | BooleanLiteral
    | NumericLiteral
    | StringLiteral
    | NullLiteral
export function parseJson(fileName: string, sourceText: string) {
    const json = parseJsonText(fileName, sourceText)
    return (json.getChildAt(0).getChildAt(0) as ExpressionStatement).expression as JSONNode
}
export function parseJsonFromFile(file: string) {
    return parseJson(file, readFileSync(file, 'utf-8'))
}
