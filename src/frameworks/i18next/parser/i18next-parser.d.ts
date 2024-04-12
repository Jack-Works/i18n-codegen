declare module 'i18next-translation-parser' {
    export interface TagNode {
        type: 'tag'
        name: string
        voidElement: boolean
        attrs: unknown
        children: AST
    }
    export interface TextNode {
        type: 'text'
        content: string
        children: AST
    }
    export interface InterpolationOrNestingNode {
        type: 'interpolation' | 'interpolation_unescaped' | 'nesting'
        raw: string
        prefix: string
        suffix: string
        content: string
        /** warn: may contain invalid var "a.b" or "a, format" */
        variable: string
    }
    export type StringNode = TagNode | TextNode | InterpolationOrNestingNode
    export type AST = StringNode[]
    export function parse(str: string): AST
    export function stringify(ast: AST): string
    export function astStats(
        ast: AST,
    ): {
        interpolation: number
        interpolation_unescaped: number
        nesting: number
        tags: number
    }
}
