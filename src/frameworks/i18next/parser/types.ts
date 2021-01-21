import { Result, StringResult, Token } from '../../../type'

export type I18NextResultExtra = {
    interpolations: Map<string, Token>
    tags: Map<string, Token>
}
export type I18NextResult = Result<I18NextResultExtra>
export type I18NextString = StringResult<I18NextResultExtra>
