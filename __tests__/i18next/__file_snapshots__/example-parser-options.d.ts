import { type ComponentType } from "react";
import { type TransProps } from "react-i18next";
declare type TypedTransProps<Value, Components> = Omit<TransProps<string>, "values" | "ns" | "i18nKey"> & ({} extends Value ? {} : {
    values: Value;
}) & {
    components: Components;
};
export declare function useMyHooks(): {
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
        readonly count: string | number | bigint;
    }): string;
    /**
      * `1 blue box`
      */
    ["box@blue@one"](): string;
    /**
      * `{{count}} blue boxes`
      */
    ["box@blue@other"](options: {
        readonly count: (string | number | bigint) & (string | number | bigint);
    }): string;
    /**
      * `{{x.data}}`
    
      * - merge_props@other: `{{x.data2}}`
      */
    merge_props(options: Readonly<{
        x: {
            readonly data: string;
        } & {
            readonly data2: string;
        };
        count?: string | number | bigint;
    }>): string;
    /**
      * `{{x.data2}}`
      */
    ["merge_props@other"](options: {
        readonly x: {
            readonly data2: string;
        };
    }): string;
    /**
      * - box@zero: `No box`
    
      * - box@one: `1 box`
    
      * - box@other: `{{count}} boxes`
    
      * - box@orange@one: `1 orange box`
    
      * - box@orange@other: `{{count}} orange boxes`
    
      * - box@blue@one: `1 blue box`
    
      * - box@blue@other: `{{count}} blue boxes`
      */
    box(options: Readonly<{
        count?: string | number | bigint;
        context?: "orange" | "blue";
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
export {};
