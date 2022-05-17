export function useTypedTranslation(): {
    /** `this is a normal key` */
    normal_key(): string
    /** `Hello, {{name}}!` */
    with_param(options: { name: string }): string
    /** `I am {{author.name.first}} {{author.name.last}}` */
    with_prop_access(options: { author: object }): string
    /** `dangerous {{- var}}` */
    unescaped(options: { var: string }): string
    /** `The current date is {{date, MM/DD/YYYY}}` */
    formatted(options: { date: string }): string
    /** `zero` */
    key$zero(): string
    /** `singular` */
    key$one(): string
    /** `two` */
    key$two(): string
    /** `few` */
    key$few(): string
    /** `many` */
    key$many(): string
    /** `other {{things}}` */
    key$other(options: { things: string }): string
    /** `` */
    key(options: { things: string, count: number }): string
}
export declare const TypedTrans: {
    /** `<i>hi</i>` */
    with_tag: React.ComponentType<TypedTransProps<{}, { i: JSX.Element }>>
}
import { TransProps } from 'react-i18next'
type TypedTransProps<Value, Components> = Omit<TransProps<string>, 'values' | 'ns' | 'i18nKey'> & ({} extends Value ? {} : { values: Value }) & { components: Components }
