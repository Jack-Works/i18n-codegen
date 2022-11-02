import type {
    ArrayLiteralExpression,
    BooleanLiteral,
    NullLiteral,
    NumericLiteral,
    ObjectLiteralExpression,
    StringLiteral,
} from 'typescript'

export type JSONNode =
    | ObjectLiteralExpression
    | ArrayLiteralExpression
    | BooleanLiteral
    | NumericLiteral
    | StringLiteral
    | NullLiteral
