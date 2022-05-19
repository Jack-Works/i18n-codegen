import type { ComponentType } from "react";
import type { TransProps } from "react-i18next";
type TypedTransProps<Value, Components> = Omit<TransProps<string>, "values" | "ns" | "i18nKey"> & ({} extends Value ? {} : {
    values: Value;
}) & {
    components: Components;
};
export function useMyHooks(): {
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
    introprolations_simple(options: Readonly<{
        firstName: string;
        lastName: string;
    }>): string;
    /**
      * `I am {{author.name.first}} {{author.name.last}}`
      */
    introprolations_complex(options: {
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
    introprolations_mixed(options: {
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
    formatted_number(options: {
        readonly date: string | number | bigint;
    }): string;
    /**
      * `The current date is {{date, datetime}}`
      */
    formatted_Date(options: {
        readonly date: Date;
    }): string;
    /**
      * `Lorem {{val, relativetime(quarter)}}`
      */
    formatted_Date2(options: {
        readonly val: string | number | bigint;
    }): string;
    /**
      * `It costs {{date, currency(USD)}}`
      */
    formatted_currency(options: {
        readonly date: string | number | bigint;
    }): string;
    /**
      * `A list of {{val, list}}`
      */
    formatted_list(options: {
        readonly val: readonly string[];
    }): string;
    /**
      * `No box`
      */
    ["box@zero"](): string;
    /**
      * `1 box`
      */
    ["box@one"](): string;
    /**
      * `{{count}} boxes`
      */
    ["box@other"](options: {
        readonly count: string;
    }): string;
    /**
      * `1 orange box`
      */
    ["box@orange@one"](): string;
    /**
      * `{{count}} orange boxes`
      */
    ["box@orange@other"](options: {
        readonly count: string;
    }): string;
    /**
    
      */
    box(options: Readonly<{
        count: string | number | bigint;
        box: "orange";
    }>): string;
};
export declare const TypedMyTrans: {
    /**
      * `<i>hi</i>`
      */
    html_tag: ComponentType<TypedTransProps<Readonly<{}>, {
        i: JSX.Element;
    }>>;
};
