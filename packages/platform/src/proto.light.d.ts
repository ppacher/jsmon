import * as $protobuf from "protobufjs";

/** ParameterType enum. */
export enum ParameterType {
    STRING = 0,
    NUMBER = 1,
    BOOLEAN = 2,
    OBJECT = 3,
    ARRAY = 4,
    STRING_ARRAY = 5,
    NUMBER_ARRAY = 6,
    BOOLEAN_ARRAY = 7,
    OBJECT_ARRAY = 8,
    ANY = 9
}

/** SIUnit enum. */
export enum SIUnit {
    Custom = 0,
    Kilogram = 1,
    Seconds = 2,
    Ampere = 3,
    Celcius = 4,
    Kelvin = 5,
    Mole = 6,
    Candela = 7,
    Lux = 8,
    Radiant = 9,
    Hertz = 10,
    Newton = 11,
    Pascal = 12,
    Joule = 13,
    Watt = 14,
    Coulomb = 15,
    Volt = 16,
    Farad = 17,
    Ohm = 18,
    Siemens = 19,
    Weber = 20,
    Tesla = 21,
    Henry = 22,
    Lumen = 23,
    Gray = 24,
    Sievert = 25,
    Katal = 26,
    Meter = 27
}

/** DeviceHealthState enum. */
export enum DeviceHealthState {
    ONLINE = 0,
    OFFLINE = 1,
    ERROR = 2,
    UNKNOWN = 3
}

/** Properties of a SensorSchema. */
export interface ISensorSchema {

    /** SensorSchema name */
    name?: (string|null);

    /** SensorSchema description */
    description?: (string|null);

    /** SensorSchema type */
    type?: (ParameterType|null);

    /** SensorSchema unit */
    unit?: (SIUnit|null);

    /** SensorSchema customUnit */
    customUnit?: (string|null);
}

/** Represents a SensorSchema. */
export class SensorSchema implements ISensorSchema {

    /**
     * Constructs a new SensorSchema.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISensorSchema);

    /** SensorSchema name. */
    public name: string;

    /** SensorSchema description. */
    public description: string;

    /** SensorSchema type. */
    public type: ParameterType;

    /** SensorSchema unit. */
    public unit: SIUnit;

    /** SensorSchema customUnit. */
    public customUnit: string;

    /**
     * Creates a SensorSchema message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SensorSchema
     */
    public static fromObject(object: { [k: string]: any }): SensorSchema;

    /**
     * Creates a plain object from a SensorSchema message. Also converts values to other types if specified.
     * @param message SensorSchema
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SensorSchema, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SensorSchema to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a ParameterDefinition. */
export interface IParameterDefinition {

    /** ParameterDefinition name */
    name?: (string|null);

    /** ParameterDefinition types */
    types?: (ParameterType[]|null);

    /** ParameterDefinition optional */
    optional?: (boolean|null);

    /** ParameterDefinition description */
    description?: (string|null);
}

/** Represents a ParameterDefinition. */
export class ParameterDefinition implements IParameterDefinition {

    /**
     * Constructs a new ParameterDefinition.
     * @param [properties] Properties to set
     */
    constructor(properties?: IParameterDefinition);

    /** ParameterDefinition name. */
    public name: string;

    /** ParameterDefinition types. */
    public types: ParameterType[];

    /** ParameterDefinition optional. */
    public optional: boolean;

    /** ParameterDefinition description. */
    public description: string;

    /**
     * Creates a ParameterDefinition message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns ParameterDefinition
     */
    public static fromObject(object: { [k: string]: any }): ParameterDefinition;

    /**
     * Creates a plain object from a ParameterDefinition message. Also converts values to other types if specified.
     * @param message ParameterDefinition
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: ParameterDefinition, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this ParameterDefinition to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a CommandDefinition. */
export interface ICommandDefinition {

    /** CommandDefinition name */
    name?: (string|null);

    /** CommandDefinition parameters */
    parameters?: (IParameterDefinition[]|null);

    /** CommandDefinition shortDescription */
    shortDescription?: (string|null);

    /** CommandDefinition longDescription */
    longDescription?: (string|null);
}

/** Represents a CommandDefinition. */
export class CommandDefinition implements ICommandDefinition {

    /**
     * Constructs a new CommandDefinition.
     * @param [properties] Properties to set
     */
    constructor(properties?: ICommandDefinition);

    /** CommandDefinition name. */
    public name: string;

    /** CommandDefinition parameters. */
    public parameters: IParameterDefinition[];

    /** CommandDefinition shortDescription. */
    public shortDescription: string;

    /** CommandDefinition longDescription. */
    public longDescription: string;

    /**
     * Creates a CommandDefinition message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns CommandDefinition
     */
    public static fromObject(object: { [k: string]: any }): CommandDefinition;

    /**
     * Creates a plain object from a CommandDefinition message. Also converts values to other types if specified.
     * @param message CommandDefinition
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: CommandDefinition, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this CommandDefinition to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a SensorValue. */
export interface ISensorValue {

    /** SensorValue deviceName */
    deviceName?: (string|null);

    /** SensorValue sensorName */
    sensorName?: (string|null);

    /** SensorValue type */
    type?: (ParameterType|null);

    /** SensorValue value */
    value?: (string|null);
}

/** Represents a SensorValue. */
export class SensorValue implements ISensorValue {

    /**
     * Constructs a new SensorValue.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISensorValue);

    /** SensorValue deviceName. */
    public deviceName: string;

    /** SensorValue sensorName. */
    public sensorName: string;

    /** SensorValue type. */
    public type: ParameterType;

    /** SensorValue value. */
    public value: string;

    /**
     * Creates a SensorValue message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns SensorValue
     */
    public static fromObject(object: { [k: string]: any }): SensorValue;

    /**
     * Creates a plain object from a SensorValue message. Also converts values to other types if specified.
     * @param message SensorValue
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: SensorValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this SensorValue to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a DeviceDefinition. */
export interface IDeviceDefinition {

    /** DeviceDefinition name */
    name?: (string|null);

    /** DeviceDefinition deviceType */
    deviceType?: (string|null);

    /** DeviceDefinition description */
    description?: (string|null);

    /** DeviceDefinition sensors */
    sensors?: (ISensorSchema[]|null);

    /** DeviceDefinition commands */
    commands?: (ICommandDefinition[]|null);
}

/** Represents a DeviceDefinition. */
export class DeviceDefinition implements IDeviceDefinition {

    /**
     * Constructs a new DeviceDefinition.
     * @param [properties] Properties to set
     */
    constructor(properties?: IDeviceDefinition);

    /** DeviceDefinition name. */
    public name: string;

    /** DeviceDefinition deviceType. */
    public deviceType: string;

    /** DeviceDefinition description. */
    public description: string;

    /** DeviceDefinition sensors. */
    public sensors: ISensorSchema[];

    /** DeviceDefinition commands. */
    public commands: ICommandDefinition[];

    /**
     * Creates a DeviceDefinition message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns DeviceDefinition
     */
    public static fromObject(object: { [k: string]: any }): DeviceDefinition;

    /**
     * Creates a plain object from a DeviceDefinition message. Also converts values to other types if specified.
     * @param message DeviceDefinition
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: DeviceDefinition, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this DeviceDefinition to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of an InitiateDeviceDiscovery. */
export interface IInitiateDeviceDiscovery {

    /** InitiateDeviceDiscovery origin */
    origin?: (string|null);
}

/** Represents an InitiateDeviceDiscovery. */
export class InitiateDeviceDiscovery implements IInitiateDeviceDiscovery {

    /**
     * Constructs a new InitiateDeviceDiscovery.
     * @param [properties] Properties to set
     */
    constructor(properties?: IInitiateDeviceDiscovery);

    /** InitiateDeviceDiscovery origin. */
    public origin: string;

    /**
     * Creates an InitiateDeviceDiscovery message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns InitiateDeviceDiscovery
     */
    public static fromObject(object: { [k: string]: any }): InitiateDeviceDiscovery;

    /**
     * Creates a plain object from an InitiateDeviceDiscovery message. Also converts values to other types if specified.
     * @param message InitiateDeviceDiscovery
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: InitiateDeviceDiscovery, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this InitiateDeviceDiscovery to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a DeviceDiscoveryAnnouncement. */
export interface IDeviceDiscoveryAnnouncement {

    /** DeviceDiscoveryAnnouncement device */
    device?: (IDeviceDefinition|null);

    /** DeviceDiscoveryAnnouncement sensorValues */
    sensorValues?: (ISensorValue[]|null);
}

/** Represents a DeviceDiscoveryAnnouncement. */
export class DeviceDiscoveryAnnouncement implements IDeviceDiscoveryAnnouncement {

    /**
     * Constructs a new DeviceDiscoveryAnnouncement.
     * @param [properties] Properties to set
     */
    constructor(properties?: IDeviceDiscoveryAnnouncement);

    /** DeviceDiscoveryAnnouncement device. */
    public device?: (IDeviceDefinition|null);

    /** DeviceDiscoveryAnnouncement sensorValues. */
    public sensorValues: ISensorValue[];

    /**
     * Creates a DeviceDiscoveryAnnouncement message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns DeviceDiscoveryAnnouncement
     */
    public static fromObject(object: { [k: string]: any }): DeviceDiscoveryAnnouncement;

    /**
     * Creates a plain object from a DeviceDiscoveryAnnouncement message. Also converts values to other types if specified.
     * @param message DeviceDiscoveryAnnouncement
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: DeviceDiscoveryAnnouncement, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this DeviceDiscoveryAnnouncement to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}
