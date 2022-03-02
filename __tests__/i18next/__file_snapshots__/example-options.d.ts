export function useMyHooks(): {
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
    key_zero(): string
    /** `singular` */
    key_one(): string
    /** `two` */
    key_two(): string
    /** `few` */
    key_few(): string
    /** `many` */
    key_many(): string
    /** `other {{things}}` */
    key_other(options: { things: string }): string
    /** `` */
    key(options: { things: string, count: number }): string
}
export declare const TypedMyTrans: {
    /** `<i>hi</i>` */
    with_tag: React.ComponentType<TypedTransProps<{}, { i: JSX.Element }>>
}
import { TransProps } from 'react-i18next'
type TypedTransProps<Value, Components> = Omit<TransProps<string>, 'values' | 'ns' | 'i18nKey'> & ({} extends Value ? {} : { values: Value }) & { components: Components }

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2V4YW1wbGUuanNvbiJdLCJuYW1lcyI6WyIiLCJ0aGlzIGlzIGEgbm9ybWFsIGtleSIsIkhlbGxvLCB7e25hbWV9fSEiLCJJIGFtIHt7YXV0aG9yLm5hbWUuZmlyc3R9fSB7e2F1dGhvci5uYW1lLmxhc3R9fSIsImRhbmdlcm91cyB7ey0gdmFyfX0iLCJUaGUgY3VycmVudCBkYXRlIGlzIHt7ZGF0ZSwgTU0vREQvWVlZWX19IiwiemVybyIsInNpbmd1bGFyIiwidHdvIiwiZmV3IiwibWFueSIsIm90aGVyIHt7dGhpbmdzfX0iXSwibWFwcGluZ3MiOiJnQkFBQUEsVTs7SUFFa0JDLFU7O0lBS0FDLFUsWUFBVSxJOztJQUVKQyxnQixZQUE4QixNOztJQUNyQ0MsUyxZQUFjLEc7O0lBQ2RDLFMsWUFBdUIsSTs7SUFDeEJDLFE7O0lBQ0RDLE87O0lBQ0FDLE87O0lBQ0FDLE87O0lBQ0NDLFE7O0lBQ0NDLFMsWUFBUyxNOzttQkFBQSxNOzs7O0lBVFYsUSw0Q0FBRSxDIiwiZmlsZSI6ImV4YW1wbGUtb3B0aW9ucy5kLnRzIn0=