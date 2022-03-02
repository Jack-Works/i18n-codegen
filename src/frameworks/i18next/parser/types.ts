import { ParseNode, StringParseNode, Token } from '../../../type'

export type I18NextParseNodeInfo = {
    interpolations: Map<string,  readonly [Token, string]>
    tags: Map<string, readonly [Token, string]>
    comments?: string
}
export type I18NextParsedFile = {
    root: ParseNode<I18NextParseNodeInfo>
    plurals: Map<string, Map<string, ParseNode<I18NextParseNodeInfo>>>
}
export type I18NextParseNode = ParseNode<I18NextParseNodeInfo>
export type I18NextParseNode_String = StringParseNode<I18NextParseNodeInfo>
