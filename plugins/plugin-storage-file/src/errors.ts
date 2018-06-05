import {ExtendableError} from '@homebot/core/error';

export class ErrStoragePathNotExist extends ExtendableError {
    constructor(path: string) {
        super('ErrStoragePathNotExist', `The storage path does not exist`, {path});
    }
}

export class ErrStoragePathNotDirectory extends ExtendableError {
    constructor(path: string) {
        super('ErrStoragePathNotDirectory', 'The storage path is not a directory', {path})
    }
}

export class ErrSensorSchemaChanged extends ExtendableError {
    constructor(deviceName: string, sensorName: string) {
        super('ErrSensorSchemaChanged', 'The device sensor schema has changed', {deviceName, sensorName});
    }
}

export function getStoragePathNotExistError(path: string): ErrStoragePathNotExist {
    return new ErrStoragePathNotExist(path);
}

export function getStoragePathNotDirectoryError(path: string): ErrStoragePathNotDirectory {
    return new ErrStoragePathNotDirectory(path);
}

// TODO: move to @hombot/platform/storage
export function getSensorSchemaChangedError(deviceName: string, sensorName: string): ErrSensorSchemaChanged {
    return new ErrSensorSchemaChanged(deviceName, sensorName);
}