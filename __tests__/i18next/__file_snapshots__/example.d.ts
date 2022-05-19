import type { ComponentType } from "react";
import type { TransProps } from "react-i18next";
type TypedTransProps<Value, Components> = Omit<TransProps<string>, "values" | "ns" | "i18nKey"> & ({} extends Value ? {} : {
    values: Value;
}) & {
    components: Components;
};
export function useTypedTranslation(): {
    /**
      * `this is a normal key`
      */
    normal(): string;
    /**
      * `I am {{firstName}}`
      */
    introprolation(options: {
        readonly firstName: string;
    }): string;
    /**
      * `I am {{firstName}} {{lastName}}`
      */
    introprolationsSimple(options: Readonly<{
        firstName: string;
        lastName: string;
    }>): string;
    /**
      * `I am {{author.name.first}} {{author.name.last}}`
      */
    introprolationsComplex(options: {
        readonly author: {
            readonly name: Readonly<{
                first: string;
                last: string;
            }>;
        };
    }): string;
    /**
      * `I am {{author.name}} {{author}}`
      */
    introprolationsMixed(options: {
        readonly author: string & {
            readonly name: string;
        };
    }): string;
    /**
      * `dangerous {{- var}}`
      */
    unescaped(options: {
        readonly var: string;
    }): string;
    /**
      * `The number is {{date, number}}`
      */
    formattedNumber(options: {
        readonly date: string | number | bigint;
    }): string;
    /**
      * `The current date is {{date, datetime}}`
      */
    formattedDate(options: {
        readonly date: Date;
    }): string;
    /**
      * `Lorem {{val, relativetime(quarter)}}`
      */
    formattedDate2(options: {
        readonly val: string | number | bigint;
    }): string;
    /**
      * `It costs {{date, currency(USD)}}`
      */
    formattedCurrency(options: {
        readonly date: string | number | bigint;
    }): string;
    /**
      * `A list of {{val, list}}`
      */
    formattedList(options: {
        readonly val: readonly string[];
    }): string;
    /**
      * `No box`
      */
    box_zero(): string;
    /**
      * `1 box`
      */
    box_one(): string;
    /**
      * `{{count}} boxes`
      */
    box_other(options: {
        readonly count: string;
    }): string;
    /**
      * `1 orange box`
      */
    box_orange_one(): string;
    /**
      * `{{count}} orange boxes`
      */
    box_orange_other(options: {
        readonly count: string;
    }): string;
    /**
    
      */
    box(options: Readonly<{
        count: string | number | bigint;
        box: "orange";
    }>): string;
};
export declare const TypedTrans: {
    /**
      * `<i>hi</i>`
      */
    htmlTag: ComponentType<TypedTransProps<Readonly<{}>, {
        i: JSX.Element;
    }>>;
};
