export interface Options {
    root: string;
    entry: string;
    output: 'ascii' | 'html';
}
export declare const generateAsciiTree: ({ root, entry }: Options) => Promise<string>;
export declare const generateHtmlTree: ({ root, entry }: Options) => Promise<string>;
