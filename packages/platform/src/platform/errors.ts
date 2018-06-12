import {ExtendableError} from '@jsmon/core/error';

export function getEntryPointFileNotFoundError(path: string): Error {
    return new ExtendableError('FileNotFoundError', `The entry file ${path} of the platfrom does not exist`);
}

export function getCannotLoadEntryFileError(path: string, err: Error) {
    return new ExtendableError('CannotLoadEntryFileError', `Failed to require() the entry file ${path}: ${err.message}`);
}

export function getInvalidPackageError(path: string, err: Error|string): Error {
    let msg: string = err instanceof Error
        ? err.message
        : err;
        
    return new ExtendableError('InvalidPackageError', `The package.json file is invalid: ${msg}`);
}

export function getMissingHomebotExportError(path: string): Error {
    return new ExtendableError('MissingHomebotExportError', `The module at ${path} does not export a jsmon property`);
}

export function getPluginNotFoundError(name: string, errors: Error[]): Error {
    let msg: string = `Failed to find module for plugin or platform ${name}: \n\t`;
    msg += errors.map(err => err.message).join('\n\t - ')
    return new ExtendableError(`PluginNotFoundError`, msg);
}