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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2V4YW1wbGUuanNvbiJdLCJuYW1lcyI6WyIiLCJ0aGlzIGlzIGEgbm9ybWFsIGtleSIsIkhlbGxvLCB7e25hbWV9fSEiLCJJIGFtIHt7YXV0aG9yLm5hbWV9fSIsImF1dGhvci5uYW1lIiwiZGFuZ2Vyb3VzIHt7LSB2YXJ9fSIsIlRoZSBjdXJyZW50IGRhdGUgaXMge3tkYXRlLCBNTS9ERC9ZWVlZfX0iXSwibWFwcGluZ3MiOiJnQkFBQUEsbUI7O0lBRWtCQyxVOztJQUtBQyxVLFlBQVUsSTs7SUFFSkMsZ0IsWUFBUUMsZTs7SUFDZkMsUyxZQUFjLEc7O0lBQ2RDLFMsWUFBdUIsSTs7OztJQUh4QixRLDRDQUFFLEMiLCJmaWxlIjoiZXhhbXBsZS5kLnRzIn0=