
interface External {
    InitTerm(cols: number, rows: number, dir: string): void;
    CopyStringToClipboard(stringToCopy: string): void;
    GetClipboard(): string;
    GetSolutionDir(): string;
    TermData(data: string): void;
    ResizeTerm(cols: number, rows: number): void;
    GetLinkRegex(): string;
    HandleLocalLink(uri: string): void;
    ValidateLocalLink(link: string): boolean;
}

declare module 'xterm' {
    interface Terminal {
        fit(): void;
    }
}