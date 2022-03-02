export function useMyHooks(): {
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
    /** `other` */
    key_other(): string
}
export declare const TypedMyTrans: {
    /** `<i>hi</i>` */
    with_tag: React.ComponentType<TypedTransProps<{}, { i: JSX.Element }>>
}
import { TransProps } from 'react-i18next'
type TypedTransProps<Value, Components> = Omit<TransProps<string>, 'values' | 'ns' | 'i18nKey'> & ({} extends Value ? {} : { values: Value }) & { components: Components }

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2V4YW1wbGUuanNvbiJdLCJuYW1lcyI6WyIiLCJ0aGlzIGlzIGEgbm9ybWFsIGtleSIsIkhlbGxvLCB7e25hbWV9fSEiLCJJIGFtIHt7YXV0aG9yLm5hbWV9fSIsImF1dGhvci5uYW1lIiwiZGFuZ2Vyb3VzIHt7LSB2YXJ9fSIsIlRoZSBjdXJyZW50IGRhdGUgaXMge3tkYXRlLCBNTS9ERC9ZWVlZfX0iLCJ6ZXJvIiwic2luZ3VsYXIiLCJ0d28iLCJmZXciLCJtYW55Iiwib3RoZXIiXSwibWFwcGluZ3MiOiJnQkFBQUEsVTs7SUFFa0JDLFU7O0lBS0FDLFUsWUFBVSxJOztJQUVKQyxnQixZQUFRQyxlOztJQUNmQyxTLFlBQWMsRzs7SUFDZEMsUyxZQUF1QixJOztJQUN4QkMsUTs7SUFDREMsTzs7SUFDQUMsTzs7SUFDQUMsTzs7SUFDQ0MsUTs7SUFDQ0MsUzs7OztJQVRELFEsNENBQUUsQyIsImZpbGUiOiJleGFtcGxlLW9wdGlvbnMuZC50cyJ9