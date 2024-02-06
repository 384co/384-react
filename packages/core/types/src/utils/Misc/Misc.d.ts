export declare function bytesToMegabytes(bytes: number): number;
export declare function _sb_assert(val: unknown, msg: string): asserts val is NonNullable<unknown>;
export declare function generateHash(data: ArrayBuffer): Promise<{
    id: string;
    key: string;
} | null>;
export declare function text2Thumbnail(text: string, element: HTMLElement & {
    getContext: (s: string) => CanvasRenderingContext2D;
}): void;
