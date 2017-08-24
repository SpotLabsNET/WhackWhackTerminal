//import { Terminal } from 'xterm';
import * as link from './linkMatcher';

class TermView { 
    private resizeTimeout: number | null;
    private term: Terminal;

    constructor() {
        this.resizeTimeout = null;
        this.term = new Terminal({
            cursorBlink: true,
            cols: 80,
            rows: 24
        });

        this.term.open(document.getElementById('content')!);
        this.term.fit();
        this.term.on('data', this.termData.bind(this));

        window.addEventListener("resize", this.resizeHandler.bind(this), false);

        this.initTerm();
        this.registerKeyboardHandlers();
        link.registerLinkMatcher(this.term);
    }

    private solutionDir(): string {
        return window.external.GetSolutionDir();
    }

    private copyString(stringToCopy): void {
        window.external.CopyStringToClipboard(stringToCopy);
    }

    private getClipboard(): string {
        return window.external.GetClipboard();
    }

    private ptyData(data): void {
        this.term.write(data);
    }

    private initTerm(): void {
        var term = this.term;

        window.external.InitTerm(term.cols, term.rows, this.solutionDir());
    }

    private reInitTerm(code) {
        if (code != null) {
            this.term.write('terminal exited with code: ' + code + ', restarting the terminal\n\r');
        } else {
            this.term.write('terminal was exited, restarting terminal instance\n\r');
        }
        this.initTerm();
    }

    private termData(data) {
        window.external.TermData(data);
    }

    private focus = function() {
	    this.term.focus();
    }

    private resizeHandler() {
        var term = this.term;
        var actualHandler = function () {
            term.fit();
            window.external.ResizeTerm(term.cols, term.rows);
        };

        var timeoutCallBack = function () {
            this.resizeTimeout = null;
            actualHandler();
        }

        // ignore resize events as long as an actualResizeHandler execution is in the queue
        if (!this.resizeTimeout) {
            this.resizeTimeout = setTimeout(timeoutCallBack.bind(this), 66);
        }
    }

    private registerKeyboardHandlers() {
        var term = this.term;
        var copy = this.copyString.bind(this);
        var getClipboard = this.getClipboard.bind(this);
        var termData = this.termData.bind(this);

        term.attachCustomKeyEventHandler(function (event) {
            // capture Ctrl+C
            if (event.ctrlKey && event.keyCode == 67 && term.hasSelection()) {
                copy(term.getSelection());
                term.clearSelection();
                return false;
            // capture Ctrl+V
            } else if (event.ctrlKey && event.keyCode == 86) {
                return false;
            }

            return true;
        });

        window.addEventListener('contextmenu', function (event) {
            if (term.hasSelection()) {
                copy(term.getSelection());
                term.clearSelection();
            } else {
                var content = getClipboard()
                termData(content);
            }
        });
    }
}

(<any>window).termView = new TermView();

document.addEventListener("DOMContentLoaded", function (event) {
    //termView = 
});

