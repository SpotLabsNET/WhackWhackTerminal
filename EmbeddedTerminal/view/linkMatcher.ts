const LOCAL_LINK_PRIORITY = -2;

class TerminalLinkHandler {
    private terminal: Terminal;
    private localLinkRegex: RegExp;

    constructor(terminal: Terminal) {
        this.terminal = terminal;
        this.localLinkRegex = new RegExp(window.external.GetLinkRegex());
    }

    public registerLocalLinkHandler(): number {
         return this.terminal.registerLinkMatcher(this.localLinkRegex, this.handleLocalLink, {
            validationCallback: this.validateLocalLink,
            priority: LOCAL_LINK_PRIORITY
        });
    }

    private handleLocalLink(event: MouseEvent, uri: string) {
        // We call the handle function on a small timeout to cause it to happen after the click event has fully
		// propogated. This ensures that focus properly transfers to the editor.
        setTimeout(function() { window.external.HandleLocalLink(uri); }, 1);
		event.preventDefault();
    }

    private validateLocalLink(link: string, _element: HTMLElement, callback) {
        if (window.external.ValidateLocalLink(link)) {
            callback(true);
        } else {
            callback(false);
        }
    }
}

export function registerLinkMatcher(xterm: Terminal) {
    
    var linkHandler = new TerminalLinkHandler(xterm);
    linkHandler.registerLocalLinkHandler();
}