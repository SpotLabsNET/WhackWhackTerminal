﻿'use strict';
import * as pty from 'node-pty';

// you may need to edit a file that gets pulled down, was a bug when i did. search and remove the obvious 'noif'
import * as rpc from 'vscode-jsonrpc';

const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');

const powerShellPath = `${process.env.windir}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}\\WindowsPowerShell\\v1.0\\powershell.exe`;
const cmdPath = `${process.env.windir}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}\\cmd.exe`;
const bashPath = `${process.env.windir}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}\\bash.exe`;

function ServicePty(stream: NodeJS.ReadWriteStream, _host) {
    this.connection = rpc.createMessageConnection(stream, stream, console);
    this.ptyConnection = null;

    this.connection.onRequest('initTerm', (shell, cols, rows, start) => this.initTerm(shell, cols, rows, start));
    this.connection.onRequest('termData', (data) => this.termData(data));
    this.connection.onRequest('resizeTerm', (cols, rows) => this.resizeTerm(cols, rows));
    this.connection.listen();
}

ServicePty.prototype.initTerm = function (shell, cols, rows, startDir) {
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

ServicePty.prototype.termData = function (data) {
    if (this.ptyConnection != null) {
        this.ptyConnection.write(data);
    }
}

ServicePty.prototype.resizeTerm = function (cols, rows) {
    if (this.ptyConnection != null) {
        this.ptyConnection.resize(cols, rows);
    }
}

ServicePty.prototype.ptyData = function (data) {
    this.connection.sendRequest('PtyData', [data]);
}

ServicePty.prototype.ptyExit = function (code) {
    this.connection.sendRequest('ReInitTerm', [code]);
}

exports.ServicePty = ServicePty;