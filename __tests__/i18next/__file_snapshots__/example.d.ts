export function useTypedTranslation(): {
    /** `this is a normal key` */
    normal_key(): string
    /** `Hello, {{name}}!` */
    with_param(options: { name: string }): string
    /** `I am {{author.name}}` */
    with_prop_access(options: { ["author.name"]: string }): string
    /** `dangerous {{- var}}` */
    unescaped(options: { var: string }): string
    /** `The current date is {{date, MM/DD/YYYY}}` */
    formatted(options: { date: string }): string
}
export declare const TypedTrans: {
    /** `<i>hi</i>` */
    with_tag: React.ComponentType<TypedTransProps<{}, { i: JSX.Element }>>
}
import { TransProps } from 'react-i18next'
type TypedTransProps<Value, Components> = Omit<TransProps<string>, 'values' | 'ns' | 'i18nKey'> & ({} extends Value ? {} : { values: Value }) & { components: Components }
