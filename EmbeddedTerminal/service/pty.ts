/// <reference path="../node_modules/vscode-jsonrpc/lib/main.d.ts" />

'use strict';

var pty = require('node-pty');
var rpc = require('vscode-jsonrpc');

// you may need to edit a file that gets pulled down, was a bug when i did. search and remove the obvious 'noif'

const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');

const powerShellPath = `${process.env.windir}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}\\WindowsPowerShell\\v1.0\\powershell.exe`;
const cmdPath = `${process.env.windir}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}\\cmd.exe`;
const bashPath = `${process.env.windir}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}\\bash.exe`;

class ServicePty {
    private connection: any;
    private ptyConnection: any | null;

    constructor(stream: NodeJS.ReadWriteStream, _host) {
        this.connection = rpc.createMessageConnection(stream, stream, console);
        this.ptyConnection = null;

        this.connection.onRequest('initTerm', (shell, cols, rows, start) => this.initTerm(shell, cols, rows, start));
        this.connection.onRequest('termData', (data) => this.termData(data));
        this.connection.onRequest('resizeTerm', (cols, rows) => this.resizeTerm(cols, rows));
        this.connection.listen();
    }

    private initTerm(shell: string, cols: number, rows: number, startDir: string): void {
        switch (shell) {
            case 'Powershell':
                var shelltospawn = powerShellPath;
                break;
            case 'CMD':
                var shelltospawn = cmdPath;
                break;
            case 'WSLBash':
                var shelltospawn = bashPath;
                break;
            default:
                var shelltospawn = powerShellPath;
        }

        if (this.ptyConnection != null) {
            // We dont want the exit listeners firing, otherwise we could get an infinite reinit loop
            
            this.ptyConnection.removeAllListeners('exit');
            this.ptyConnection.destroy();
        }

        this.ptyConnection = pty.spawn(shelltospawn, [], {
            name: 'vs-integrated-terminal',
            cols: cols,
            rows: rows,
            cwd: startDir,
            env: process.env
        });
        this.ptyConnection.on('data', (data) => this.ptyData(data));
        this.ptyConnection.on('exit', (code) => this.ptyExit(code));
    }

    private termData(data: string) {
        if (this.ptyConnection != null) {
            this.ptyConnection.write(data);
        }
    }

    private resizeTerm(cols: number, rows: number) {
        if (this.ptyConnection != null) {
            this.ptyConnection.resize(cols, rows);
        }
    }

    private ptyData(data: string) {
        this.connection.sendRequest('PtyData', [data]);
    }

    private ptyExit(code: number) {
        this.connection.sendRequest('ReInitTerm', [code]);
    }
}

exports.ServicePty = ServicePty;