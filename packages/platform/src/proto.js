/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

/**
 * ParameterType enum.
 * @exports ParameterType
 * @enum {string}
 * @property {number} STRING=0 STRING value
 * @property {number} NUMBER=1 NUMBER value
 * @property {number} BOOLEAN=2 BOOLEAN value
 * @property {number} OBJECT=3 OBJECT value
 * @property {number} ARRAY=4 ARRAY value
 * @property {number} STRING_ARRAY=5 STRING_ARRAY value
 * @property {number} NUMBER_ARRAY=6 NUMBER_ARRAY value
 * @property {number} BOOLEAN_ARRAY=7 BOOLEAN_ARRAY value
 * @property {number} OBJECT_ARRAY=8 OBJECT_ARRAY value
 * @property {number} ANY=9 ANY value
 */
$root.ParameterType = (function() {
    var valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "STRING"] = 0;
    values[valuesById[1] = "NUMBER"] = 1;
    values[valuesById[2] = "BOOLEAN"] = 2;
    values[valuesById[3] = "OBJECT"] = 3;
    values[valuesById[4] = "ARRAY"] = 4;
    values[valuesById[5] = "STRING_ARRAY"] = 5;
    values[valuesById[6] = "NUMBER_ARRAY"] = 6;
    values[valuesById[7] = "BOOLEAN_ARRAY"] = 7;
    values[valuesById[8] = "OBJECT_ARRAY"] = 8;
    values[valuesById[9] = "ANY"] = 9;
    return values;
})();

/**
 * DeviceHealthState enum.
 * @exports DeviceHealthState
 * @enum {string}
 * @property {number} ONLINE=0 ONLINE value
 * @property {number} OFFLINE=1 OFFLINE value
 * @property {number} ERROR=2 ERROR value
 * @property {number} UNKNOWN=3 UNKNOWN value
 */
$root.DeviceHealthState = (function() {
    var valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "ONLINE"] = 0;
    values[valuesById[1] = "OFFLINE"] = 1;
    values[valuesById[2] = "ERROR"] = 2;
    values[valuesById[3] = "UNKNOWN"] = 3;
    return values;
})();

$root.SensorSchema = (function() {

    /**
     * Properties of a SensorSchema.
     * @exports ISensorSchema
     * @interface ISensorSchema
     * @property {string|null} [name] SensorSchema name
     * @property {string|null} [description] SensorSchema description
     * @property {ParameterType|null} [type] SensorSchema type
     */

    /**
     * Constructs a new SensorSchema.
     * @exports SensorSchema
     * @classdesc Represents a SensorSchema.
     * @implements ISensorSchema
     * @constructor
     * @param {ISensorSchema=} [properties] Properties to set
     */
    function SensorSchema(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SensorSchema name.
     * @member {string} name
     * @memberof SensorSchema
     * @instance
     */
    SensorSchema.prototype.name = "";

    /**
     * SensorSchema description.
     * @member {string} description
     * @memberof SensorSchema
     * @instance
     */
    SensorSchema.prototype.description = "";

    /**
     * SensorSchema type.
     * @member {ParameterType} type
     * @memberof SensorSchema
     * @instance
     */
    SensorSchema.prototype.type = 0;

    /**
     * Creates a new SensorSchema instance using the specified properties.
     * @function create
     * @memberof SensorSchema
     * @static
     * @param {ISensorSchema=} [properties] Properties to set
     * @returns {SensorSchema} SensorSchema instance
     */
    SensorSchema.create = function create(properties) {
        return new SensorSchema(properties);
    };

    /**
     * Encodes the specified SensorSchema message. Does not implicitly {@link SensorSchema.verify|verify} messages.
     * @function encode
     * @memberof SensorSchema
     * @static
     * @param {ISensorSchema} message SensorSchema message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SensorSchema.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && message.hasOwnProperty("name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        if (message.description != null && message.hasOwnProperty("description"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.description);
        if (message.type != null && message.hasOwnProperty("type"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.type);
        return writer;
    };

    /**
     * Encodes the specified SensorSchema message, length delimited. Does not implicitly {@link SensorSchema.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SensorSchema
     * @static
     * @param {ISensorSchema} message SensorSchema message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SensorSchema.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SensorSchema message from the specified reader or buffer.
     * @function decode
     * @memberof SensorSchema
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SensorSchema} SensorSchema
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SensorSchema.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SensorSchema();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.name = reader.string();
                break;
            case 2:
                message.description = reader.string();
                break;
            case 3:
                message.type = reader.int32();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SensorSchema message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SensorSchema
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SensorSchema} SensorSchema
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SensorSchema.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SensorSchema message.
     * @function verify
     * @memberof SensorSchema
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SensorSchema.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        if (message.type != null && message.hasOwnProperty("type"))
            switch (message.type) {
            default:
                return "type: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
                break;
            }
        return null;
    };

    /**
     * Creates a SensorSchema message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SensorSchema
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SensorSchema} SensorSchema
     */
    SensorSchema.fromObject = function fromObject(object) {
        if (object instanceof $root.SensorSchema)
            return object;
        var message = new $root.SensorSchema();
        if (object.name != null)
            message.name = String(object.name);
        if (object.description != null)
            message.description = String(object.description);
        switch (object.type) {
        case "STRING":
        case 0:
            message.type = 0;
            break;
        case "NUMBER":
        case 1:
            message.type = 1;
            break;
        case "BOOLEAN":
        case 2:
            message.type = 2;
            break;
        case "OBJECT":
        case 3:
            message.type = 3;
            break;
        case "ARRAY":
        case 4:
            message.type = 4;
            break;
        case "STRING_ARRAY":
        case 5:
            message.type = 5;
            break;
        case "NUMBER_ARRAY":
        case 6:
            message.type = 6;
            break;
        case "BOOLEAN_ARRAY":
        case 7:
            message.type = 7;
            break;
        case "OBJECT_ARRAY":
        case 8:
            message.type = 8;
            break;
        case "ANY":
        case 9:
            message.type = 9;
            break;
        }
        return message;
    };

    /**
     * Creates a plain object from a SensorSchema message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SensorSchema
     * @static
     * @param {SensorSchema} message SensorSchema
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SensorSchema.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.name = "";
            object.description = "";
            object.type = options.enums === String ? "STRING" : 0;
        }
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = options.enums === String ? $root.ParameterType[message.type] : message.type;
        return object;
    };

    /**
     * Converts this SensorSchema to JSON.
     * @function toJSON
     * @memberof SensorSchema
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SensorSchema.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SensorSchema;
})();

$root.ParameterDefinition = (function() {

    /**
     * Properties of a ParameterDefinition.
     * @exports IParameterDefinition
     * @interface IParameterDefinition
     * @property {string|null} [name] ParameterDefinition name
     * @property {Array.<ParameterType>|null} [types] ParameterDefinition types
     * @property {boolean|null} [optional] ParameterDefinition optional
     * @property {string|null} [description] ParameterDefinition description
     */

    /**
     * Constructs a new ParameterDefinition.
     * @exports ParameterDefinition
     * @classdesc Represents a ParameterDefinition.
     * @implements IParameterDefinition
     * @constructor
     * @param {IParameterDefinition=} [properties] Properties to set
     */
    function ParameterDefinition(properties) {
        this.types = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ParameterDefinition name.
     * @member {string} name
     * @memberof ParameterDefinition
     * @instance
     */
    ParameterDefinition.prototype.name = "";

    /**
     * ParameterDefinition types.
     * @member {Array.<ParameterType>} types
     * @memberof ParameterDefinition
     * @instance
     */
    ParameterDefinition.prototype.types = $util.emptyArray;

    /**
     * ParameterDefinition optional.
     * @member {boolean} optional
     * @memberof ParameterDefinition
     * @instance
     */
    ParameterDefinition.prototype.optional = false;

    /**
     * ParameterDefinition description.
     * @member {string} description
     * @memberof ParameterDefinition
     * @instance
     */
    ParameterDefinition.prototype.description = "";

    /**
     * Creates a new ParameterDefinition instance using the specified properties.
     * @function create
     * @memberof ParameterDefinition
     * @static
     * @param {IParameterDefinition=} [properties] Properties to set
     * @returns {ParameterDefinition} ParameterDefinition instance
     */
    ParameterDefinition.create = function create(properties) {
        return new ParameterDefinition(properties);
    };

    /**
     * Encodes the specified ParameterDefinition message. Does not implicitly {@link ParameterDefinition.verify|verify} messages.
     * @function encode
     * @memberof ParameterDefinition
     * @static
     * @param {IParameterDefinition} message ParameterDefinition message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ParameterDefinition.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && message.hasOwnProperty("name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        if (message.types != null && message.types.length) {
            writer.uint32(/* id 2, wireType 2 =*/18).fork();
            for (var i = 0; i < message.types.length; ++i)
                writer.int32(message.types[i]);
            writer.ldelim();
        }
        if (message.optional != null && message.hasOwnProperty("optional"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.optional);
        if (message.description != null && message.hasOwnProperty("description"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.description);
        return writer;
    };

    /**
     * Encodes the specified ParameterDefinition message, length delimited. Does not implicitly {@link ParameterDefinition.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ParameterDefinition
     * @static
     * @param {IParameterDefinition} message ParameterDefinition message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ParameterDefinition.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ParameterDefinition message from the specified reader or buffer.
     * @function decode
     * @memberof ParameterDefinition
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ParameterDefinition} ParameterDefinition
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ParameterDefinition.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.ParameterDefinition();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.name = reader.string();
                break;
            case 2:
                if (!(message.types && message.types.length))
                    message.types = [];
                if ((tag & 7) === 2) {
                    var end2 = reader.uint32() + reader.pos;
                    while (reader.pos < end2)
                        message.types.push(reader.int32());
                } else
                    message.types.push(reader.int32());
                break;
            case 3:
                message.optional = reader.bool();
                break;
            case 4:
                message.description = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a ParameterDefinition message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ParameterDefinition
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ParameterDefinition} ParameterDefinition
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ParameterDefinition.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ParameterDefinition message.
     * @function verify
     * @memberof ParameterDefinition
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ParameterDefinition.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.types != null && message.hasOwnProperty("types")) {
            if (!Array.isArray(message.types))
                return "types: array expected";
            for (var i = 0; i < message.types.length; ++i)
                switch (message.types[i]) {
                default:
                    return "types: enum value[] expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                    break;
                }
        }
        if (message.optional != null && message.hasOwnProperty("optional"))
            if (typeof message.optional !== "boolean")
                return "optional: boolean expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        return null;
    };

    /**
     * Creates a ParameterDefinition message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ParameterDefinition
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ParameterDefinition} ParameterDefinition
     */
    ParameterDefinition.fromObject = function fromObject(object) {
        if (object instanceof $root.ParameterDefinition)
            return object;
        var message = new $root.ParameterDefinition();
        if (object.name != null)
            message.name = String(object.name);
        if (object.types) {
            if (!Array.isArray(object.types))
                throw TypeError(".ParameterDefinition.types: array expected");
            message.types = [];
            for (var i = 0; i < object.types.length; ++i)
                switch (object.types[i]) {
                default:
                case "STRING":
                case 0:
                    message.types[i] = 0;
                    break;
                case "NUMBER":
                case 1:
                    message.types[i] = 1;
                    break;
                case "BOOLEAN":
                case 2:
                    message.types[i] = 2;
                    break;
                case "OBJECT":
                case 3:
                    message.types[i] = 3;
                    break;
                case "ARRAY":
                case 4:
                    message.types[i] = 4;
                    break;
                case "STRING_ARRAY":
                case 5:
                    message.types[i] = 5;
                    break;
                case "NUMBER_ARRAY":
                case 6:
                    message.types[i] = 6;
                    break;
                case "BOOLEAN_ARRAY":
                case 7:
                    message.types[i] = 7;
                    break;
                case "OBJECT_ARRAY":
                case 8:
                    message.types[i] = 8;
                    break;
                case "ANY":
                case 9:
                    message.types[i] = 9;
                    break;
                }
        }
        if (object.optional != null)
            message.optional = Boolean(object.optional);
        if (object.description != null)
            message.description = String(object.description);
        return message;
    };

    /**
     * Creates a plain object from a ParameterDefinition message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ParameterDefinition
     * @static
     * @param {ParameterDefinition} message ParameterDefinition
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ParameterDefinition.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.types = [];
        if (options.defaults) {
            object.name = "";
            object.optional = false;
            object.description = "";
        }
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.types && message.types.length) {
            object.types = [];
            for (var j = 0; j < message.types.length; ++j)
                object.types[j] = options.enums === String ? $root.ParameterType[message.types[j]] : message.types[j];
        }
        if (message.optional != null && message.hasOwnProperty("optional"))
            object.optional = message.optional;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        return object;
    };

    /**
     * Converts this ParameterDefinition to JSON.
     * @function toJSON
     * @memberof ParameterDefinition
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ParameterDefinition.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return ParameterDefinition;
})();

$root.CommandDefinition = (function() {

    /**
     * Properties of a CommandDefinition.
     * @exports ICommandDefinition
     * @interface ICommandDefinition
     * @property {string|null} [name] CommandDefinition name
     * @property {Array.<IParameterDefinition>|null} [parameters] CommandDefinition parameters
     * @property {string|null} [shortDescription] CommandDefinition shortDescription
     * @property {string|null} [longDescription] CommandDefinition longDescription
     */

    /**
     * Constructs a new CommandDefinition.
     * @exports CommandDefinition
     * @classdesc Represents a CommandDefinition.
     * @implements ICommandDefinition
     * @constructor
     * @param {ICommandDefinition=} [properties] Properties to set
     */
    function CommandDefinition(properties) {
        this.parameters = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CommandDefinition name.
     * @member {string} name
     * @memberof CommandDefinition
     * @instance
     */
    CommandDefinition.prototype.name = "";

    /**
     * CommandDefinition parameters.
     * @member {Array.<IParameterDefinition>} parameters
     * @memberof CommandDefinition
     * @instance
     */
    CommandDefinition.prototype.parameters = $util.emptyArray;

    /**
     * CommandDefinition shortDescription.
     * @member {string} shortDescription
     * @memberof CommandDefinition
     * @instance
     */
    CommandDefinition.prototype.shortDescription = "";

    /**
     * CommandDefinition longDescription.
     * @member {string} longDescription
     * @memberof CommandDefinition
     * @instance
     */
    CommandDefinition.prototype.longDescription = "";

    /**
     * Creates a new CommandDefinition instance using the specified properties.
     * @function create
     * @memberof CommandDefinition
     * @static
     * @param {ICommandDefinition=} [properties] Properties to set
     * @returns {CommandDefinition} CommandDefinition instance
     */
    CommandDefinition.create = function create(properties) {
        return new CommandDefinition(properties);
    };

    /**
     * Encodes the specified CommandDefinition message. Does not implicitly {@link CommandDefinition.verify|verify} messages.
     * @function encode
     * @memberof CommandDefinition
     * @static
     * @param {ICommandDefinition} message CommandDefinition message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommandDefinition.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && message.hasOwnProperty("name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        if (message.parameters != null && message.parameters.length)
            for (var i = 0; i < message.parameters.length; ++i)
                $root.ParameterDefinition.encode(message.parameters[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.shortDescription != null && message.hasOwnProperty("shortDescription"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.shortDescription);
        if (message.longDescription != null && message.hasOwnProperty("longDescription"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.longDescription);
        return writer;
    };

    /**
     * Encodes the specified CommandDefinition message, length delimited. Does not implicitly {@link CommandDefinition.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CommandDefinition
     * @static
     * @param {ICommandDefinition} message CommandDefinition message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommandDefinition.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CommandDefinition message from the specified reader or buffer.
     * @function decode
     * @memberof CommandDefinition
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CommandDefinition} CommandDefinition
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommandDefinition.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.CommandDefinition();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.name = reader.string();
                break;
            case 2:
                if (!(message.parameters && message.parameters.length))
                    message.parameters = [];
                message.parameters.push($root.ParameterDefinition.decode(reader, reader.uint32()));
                break;
            case 3:
                message.shortDescription = reader.string();
                break;
            case 4:
                message.longDescription = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a CommandDefinition message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CommandDefinition
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CommandDefinition} CommandDefinition
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommandDefinition.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CommandDefinition message.
     * @function verify
     * @memberof CommandDefinition
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CommandDefinition.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.parameters != null && message.hasOwnProperty("parameters")) {
            if (!Array.isArray(message.parameters))
                return "parameters: array expected";
            for (var i = 0; i < message.parameters.length; ++i) {
                var error = $root.ParameterDefinition.verify(message.parameters[i]);
                if (error)
                    return "parameters." + error;
            }
        }
        if (message.shortDescription != null && message.hasOwnProperty("shortDescription"))
            if (!$util.isString(message.shortDescription))
                return "shortDescription: string expected";
        if (message.longDescription != null && message.hasOwnProperty("longDescription"))
            if (!$util.isString(message.longDescription))
                return "longDescription: string expected";
        return null;
    };

    /**
     * Creates a CommandDefinition message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CommandDefinition
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CommandDefinition} CommandDefinition
     */
    CommandDefinition.fromObject = function fromObject(object) {
        if (object instanceof $root.CommandDefinition)
            return object;
        var message = new $root.CommandDefinition();
        if (object.name != null)
            message.name = String(object.name);
        if (object.parameters) {
            if (!Array.isArray(object.parameters))
                throw TypeError(".CommandDefinition.parameters: array expected");
            message.parameters = [];
            for (var i = 0; i < object.parameters.length; ++i) {
                if (typeof object.parameters[i] !== "object")
                    throw TypeError(".CommandDefinition.parameters: object expected");
                message.parameters[i] = $root.ParameterDefinition.fromObject(object.parameters[i]);
            }
        }
        if (object.shortDescription != null)
            message.shortDescription = String(object.shortDescription);
        if (object.longDescription != null)
            message.longDescription = String(object.longDescription);
        return message;
    };

    /**
     * Creates a plain object from a CommandDefinition message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CommandDefinition
     * @static
     * @param {CommandDefinition} message CommandDefinition
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CommandDefinition.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.parameters = [];
        if (options.defaults) {
            object.name = "";
            object.shortDescription = "";
            object.longDescription = "";
        }
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.parameters && message.parameters.length) {
            object.parameters = [];
            for (var j = 0; j < message.parameters.length; ++j)
                object.parameters[j] = $root.ParameterDefinition.toObject(message.parameters[j], options);
        }
        if (message.shortDescription != null && message.hasOwnProperty("shortDescription"))
            object.shortDescription = message.shortDescription;
        if (message.longDescription != null && message.hasOwnProperty("longDescription"))
            object.longDescription = message.longDescription;
        return object;
    };

    /**
     * Converts this CommandDefinition to JSON.
     * @function toJSON
     * @memberof CommandDefinition
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CommandDefinition.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return CommandDefinition;
})();

$root.SensorValue = (function() {

    /**
     * Properties of a SensorValue.
     * @exports ISensorValue
     * @interface ISensorValue
     * @property {string|null} [deviceName] SensorValue deviceName
     * @property {string|null} [sensorName] SensorValue sensorName
     * @property {ParameterType|null} [type] SensorValue type
     * @property {string|null} [value] SensorValue value
     */

    /**
     * Constructs a new SensorValue.
     * @exports SensorValue
     * @classdesc Represents a SensorValue.
     * @implements ISensorValue
     * @constructor
     * @param {ISensorValue=} [properties] Properties to set
     */
    function SensorValue(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SensorValue deviceName.
     * @member {string} deviceName
     * @memberof SensorValue
     * @instance
     */
    SensorValue.prototype.deviceName = "";

    /**
     * SensorValue sensorName.
     * @member {string} sensorName
     * @memberof SensorValue
     * @instance
     */
    SensorValue.prototype.sensorName = "";

    /**
     * SensorValue type.
     * @member {ParameterType} type
     * @memberof SensorValue
     * @instance
     */
    SensorValue.prototype.type = 0;

    /**
     * SensorValue value.
     * @member {string} value
     * @memberof SensorValue
     * @instance
     */
    SensorValue.prototype.value = "";

    /**
     * Creates a new SensorValue instance using the specified properties.
     * @function create
     * @memberof SensorValue
     * @static
     * @param {ISensorValue=} [properties] Properties to set
     * @returns {SensorValue} SensorValue instance
     */
    SensorValue.create = function create(properties) {
        return new SensorValue(properties);
    };

    /**
     * Encodes the specified SensorValue message. Does not implicitly {@link SensorValue.verify|verify} messages.
     * @function encode
     * @memberof SensorValue
     * @static
     * @param {ISensorValue} message SensorValue message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SensorValue.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.deviceName != null && message.hasOwnProperty("deviceName"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.deviceName);
        if (message.sensorName != null && message.hasOwnProperty("sensorName"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.sensorName);
        if (message.type != null && message.hasOwnProperty("type"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.type);
        if (message.value != null && message.hasOwnProperty("value"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.value);
        return writer;
    };

    /**
     * Encodes the specified SensorValue message, length delimited. Does not implicitly {@link SensorValue.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SensorValue
     * @static
     * @param {ISensorValue} message SensorValue message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SensorValue.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SensorValue message from the specified reader or buffer.
     * @function decode
     * @memberof SensorValue
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SensorValue} SensorValue
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SensorValue.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.SensorValue();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.deviceName = reader.string();
                break;
            case 2:
                message.sensorName = reader.string();
                break;
            case 3:
                message.type = reader.int32();
                break;
            case 4:
                message.value = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SensorValue message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SensorValue
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SensorValue} SensorValue
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SensorValue.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SensorValue message.
     * @function verify
     * @memberof SensorValue
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SensorValue.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.deviceName != null && message.hasOwnProperty("deviceName"))
            if (!$util.isString(message.deviceName))
                return "deviceName: string expected";
        if (message.sensorName != null && message.hasOwnProperty("sensorName"))
            if (!$util.isString(message.sensorName))
                return "sensorName: string expected";
        if (message.type != null && message.hasOwnProperty("type"))
            switch (message.type) {
            default:
                return "type: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
                break;
            }
        if (message.value != null && message.hasOwnProperty("value"))
            if (!$util.isString(message.value))
                return "value: string expected";
        return null;
    };

    /**
     * Creates a SensorValue message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SensorValue
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SensorValue} SensorValue
     */
    SensorValue.fromObject = function fromObject(object) {
        if (object instanceof $root.SensorValue)
            return object;
        var message = new $root.SensorValue();
        if (object.deviceName != null)
            message.deviceName = String(object.deviceName);
        if (object.sensorName != null)
            message.sensorName = String(object.sensorName);
        switch (object.type) {
        case "STRING":
        case 0:
            message.type = 0;
            break;
        case "NUMBER":
        case 1:
            message.type = 1;
            break;
        case "BOOLEAN":
        case 2:
            message.type = 2;
            break;
        case "OBJECT":
        case 3:
            message.type = 3;
            break;
        case "ARRAY":
        case 4:
            message.type = 4;
            break;
        case "STRING_ARRAY":
        case 5:
            message.type = 5;
            break;
        case "NUMBER_ARRAY":
        case 6:
            message.type = 6;
            break;
        case "BOOLEAN_ARRAY":
        case 7:
            message.type = 7;
            break;
        case "OBJECT_ARRAY":
        case 8:
            message.type = 8;
            break;
        case "ANY":
        case 9:
            message.type = 9;
            break;
        }
        if (object.value != null)
            message.value = String(object.value);
        return message;
    };

    /**
     * Creates a plain object from a SensorValue message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SensorValue
     * @static
     * @param {SensorValue} message SensorValue
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SensorValue.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.deviceName = "";
            object.sensorName = "";
            object.type = options.enums === String ? "STRING" : 0;
            object.value = "";
        }
        if (message.deviceName != null && message.hasOwnProperty("deviceName"))
            object.deviceName = message.deviceName;
        if (message.sensorName != null && message.hasOwnProperty("sensorName"))
            object.sensorName = message.sensorName;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = options.enums === String ? $root.ParameterType[message.type] : message.type;
        if (message.value != null && message.hasOwnProperty("value"))
            object.value = message.value;
        return object;
    };

    /**
     * Converts this SensorValue to JSON.
     * @function toJSON
     * @memberof SensorValue
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SensorValue.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return SensorValue;
})();

$root.DeviceDefinition = (function() {

    /**
     * Properties of a DeviceDefinition.
     * @exports IDeviceDefinition
     * @interface IDeviceDefinition
     * @property {string|null} [name] DeviceDefinition name
     * @property {string|null} [deviceType] DeviceDefinition deviceType
     * @property {string|null} [description] DeviceDefinition description
     * @property {Array.<ISensorSchema>|null} [sensors] DeviceDefinition sensors
     * @property {Array.<ICommandDefinition>|null} [commands] DeviceDefinition commands
     */

    /**
     * Constructs a new DeviceDefinition.
     * @exports DeviceDefinition
     * @classdesc Represents a DeviceDefinition.
     * @implements IDeviceDefinition
     * @constructor
     * @param {IDeviceDefinition=} [properties] Properties to set
     */
    function DeviceDefinition(properties) {
        this.sensors = [];
        this.commands = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * DeviceDefinition name.
     * @member {string} name
     * @memberof DeviceDefinition
     * @instance
     */
    DeviceDefinition.prototype.name = "";

    /**
     * DeviceDefinition deviceType.
     * @member {string} deviceType
     * @memberof DeviceDefinition
     * @instance
     */
    DeviceDefinition.prototype.deviceType = "";

    /**
     * DeviceDefinition description.
     * @member {string} description
     * @memberof DeviceDefinition
     * @instance
     */
    DeviceDefinition.prototype.description = "";

    /**
     * DeviceDefinition sensors.
     * @member {Array.<ISensorSchema>} sensors
     * @memberof DeviceDefinition
     * @instance
     */
    DeviceDefinition.prototype.sensors = $util.emptyArray;

    /**
     * DeviceDefinition commands.
     * @member {Array.<ICommandDefinition>} commands
     * @memberof DeviceDefinition
     * @instance
     */
    DeviceDefinition.prototype.commands = $util.emptyArray;

    /**
     * Creates a new DeviceDefinition instance using the specified properties.
     * @function create
     * @memberof DeviceDefinition
     * @static
     * @param {IDeviceDefinition=} [properties] Properties to set
     * @returns {DeviceDefinition} DeviceDefinition instance
     */
    DeviceDefinition.create = function create(properties) {
        return new DeviceDefinition(properties);
    };

    /**
     * Encodes the specified DeviceDefinition message. Does not implicitly {@link DeviceDefinition.verify|verify} messages.
     * @function encode
     * @memberof DeviceDefinition
     * @static
     * @param {IDeviceDefinition} message DeviceDefinition message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DeviceDefinition.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.name != null && message.hasOwnProperty("name"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
        if (message.deviceType != null && message.hasOwnProperty("deviceType"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.deviceType);
        if (message.description != null && message.hasOwnProperty("description"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.description);
        if (message.sensors != null && message.sensors.length)
            for (var i = 0; i < message.sensors.length; ++i)
                $root.SensorSchema.encode(message.sensors[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        if (message.commands != null && message.commands.length)
            for (var i = 0; i < message.commands.length; ++i)
                $root.CommandDefinition.encode(message.commands[i], writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified DeviceDefinition message, length delimited. Does not implicitly {@link DeviceDefinition.verify|verify} messages.
     * @function encodeDelimited
     * @memberof DeviceDefinition
     * @static
     * @param {IDeviceDefinition} message DeviceDefinition message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DeviceDefinition.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a DeviceDefinition message from the specified reader or buffer.
     * @function decode
     * @memberof DeviceDefinition
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {DeviceDefinition} DeviceDefinition
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DeviceDefinition.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.DeviceDefinition();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.name = reader.string();
                break;
            case 2:
                message.deviceType = reader.string();
                break;
            case 3:
                message.description = reader.string();
                break;
            case 4:
                if (!(message.sensors && message.sensors.length))
                    message.sensors = [];
                message.sensors.push($root.SensorSchema.decode(reader, reader.uint32()));
                break;
            case 5:
                if (!(message.commands && message.commands.length))
                    message.commands = [];
                message.commands.push($root.CommandDefinition.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a DeviceDefinition message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof DeviceDefinition
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {DeviceDefinition} DeviceDefinition
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DeviceDefinition.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a DeviceDefinition message.
     * @function verify
     * @memberof DeviceDefinition
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    DeviceDefinition.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.deviceType != null && message.hasOwnProperty("deviceType"))
            if (!$util.isString(message.deviceType))
                return "deviceType: string expected";
        if (message.description != null && message.hasOwnProperty("description"))
            if (!$util.isString(message.description))
                return "description: string expected";
        if (message.sensors != null && message.hasOwnProperty("sensors")) {
            if (!Array.isArray(message.sensors))
                return "sensors: array expected";
            for (var i = 0; i < message.sensors.length; ++i) {
                var error = $root.SensorSchema.verify(message.sensors[i]);
                if (error)
                    return "sensors." + error;
            }
        }
        if (message.commands != null && message.hasOwnProperty("commands")) {
            if (!Array.isArray(message.commands))
                return "commands: array expected";
            for (var i = 0; i < message.commands.length; ++i) {
                var error = $root.CommandDefinition.verify(message.commands[i]);
                if (error)
                    return "commands." + error;
            }
        }
        return null;
    };

    /**
     * Creates a DeviceDefinition message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof DeviceDefinition
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {DeviceDefinition} DeviceDefinition
     */
    DeviceDefinition.fromObject = function fromObject(object) {
        if (object instanceof $root.DeviceDefinition)
            return object;
        var message = new $root.DeviceDefinition();
        if (object.name != null)
            message.name = String(object.name);
        if (object.deviceType != null)
            message.deviceType = String(object.deviceType);
        if (object.description != null)
            message.description = String(object.description);
        if (object.sensors) {
            if (!Array.isArray(object.sensors))
                throw TypeError(".DeviceDefinition.sensors: array expected");
            message.sensors = [];
            for (var i = 0; i < object.sensors.length; ++i) {
                if (typeof object.sensors[i] !== "object")
                    throw TypeError(".DeviceDefinition.sensors: object expected");
                message.sensors[i] = $root.SensorSchema.fromObject(object.sensors[i]);
            }
        }
        if (object.commands) {
            if (!Array.isArray(object.commands))
                throw TypeError(".DeviceDefinition.commands: array expected");
            message.commands = [];
            for (var i = 0; i < object.commands.length; ++i) {
                if (typeof object.commands[i] !== "object")
                    throw TypeError(".DeviceDefinition.commands: object expected");
                message.commands[i] = $root.CommandDefinition.fromObject(object.commands[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a DeviceDefinition message. Also converts values to other types if specified.
     * @function toObject
     * @memberof DeviceDefinition
     * @static
     * @param {DeviceDefinition} message DeviceDefinition
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    DeviceDefinition.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults) {
            object.sensors = [];
            object.commands = [];
        }
        if (options.defaults) {
            object.name = "";
            object.deviceType = "";
            object.description = "";
        }
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.deviceType != null && message.hasOwnProperty("deviceType"))
            object.deviceType = message.deviceType;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.sensors && message.sensors.length) {
            object.sensors = [];
            for (var j = 0; j < message.sensors.length; ++j)
                object.sensors[j] = $root.SensorSchema.toObject(message.sensors[j], options);
        }
        if (message.commands && message.commands.length) {
            object.commands = [];
            for (var j = 0; j < message.commands.length; ++j)
                object.commands[j] = $root.CommandDefinition.toObject(message.commands[j], options);
        }
        return object;
    };

    /**
     * Converts this DeviceDefinition to JSON.
     * @function toJSON
     * @memberof DeviceDefinition
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    DeviceDefinition.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return DeviceDefinition;
})();

$root.InitiateDeviceDiscovery = (function() {

    /**
     * Properties of an InitiateDeviceDiscovery.
     * @exports IInitiateDeviceDiscovery
     * @interface IInitiateDeviceDiscovery
     * @property {string|null} [origin] InitiateDeviceDiscovery origin
     */

    /**
     * Constructs a new InitiateDeviceDiscovery.
     * @exports InitiateDeviceDiscovery
     * @classdesc Represents an InitiateDeviceDiscovery.
     * @implements IInitiateDeviceDiscovery
     * @constructor
     * @param {IInitiateDeviceDiscovery=} [properties] Properties to set
     */
    function InitiateDeviceDiscovery(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * InitiateDeviceDiscovery origin.
     * @member {string} origin
     * @memberof InitiateDeviceDiscovery
     * @instance
     */
    InitiateDeviceDiscovery.prototype.origin = "";

    /**
     * Creates a new InitiateDeviceDiscovery instance using the specified properties.
     * @function create
     * @memberof InitiateDeviceDiscovery
     * @static
     * @param {IInitiateDeviceDiscovery=} [properties] Properties to set
     * @returns {InitiateDeviceDiscovery} InitiateDeviceDiscovery instance
     */
    InitiateDeviceDiscovery.create = function create(properties) {
        return new InitiateDeviceDiscovery(properties);
    };

    /**
     * Encodes the specified InitiateDeviceDiscovery message. Does not implicitly {@link InitiateDeviceDiscovery.verify|verify} messages.
     * @function encode
     * @memberof InitiateDeviceDiscovery
     * @static
     * @param {IInitiateDeviceDiscovery} message InitiateDeviceDiscovery message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    InitiateDeviceDiscovery.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.origin != null && message.hasOwnProperty("origin"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.origin);
        return writer;
    };

    /**
     * Encodes the specified InitiateDeviceDiscovery message, length delimited. Does not implicitly {@link InitiateDeviceDiscovery.verify|verify} messages.
     * @function encodeDelimited
     * @memberof InitiateDeviceDiscovery
     * @static
     * @param {IInitiateDeviceDiscovery} message InitiateDeviceDiscovery message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    InitiateDeviceDiscovery.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an InitiateDeviceDiscovery message from the specified reader or buffer.
     * @function decode
     * @memberof InitiateDeviceDiscovery
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {InitiateDeviceDiscovery} InitiateDeviceDiscovery
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    InitiateDeviceDiscovery.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.InitiateDeviceDiscovery();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.origin = reader.string();
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes an InitiateDeviceDiscovery message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof InitiateDeviceDiscovery
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {InitiateDeviceDiscovery} InitiateDeviceDiscovery
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    InitiateDeviceDiscovery.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an InitiateDeviceDiscovery message.
     * @function verify
     * @memberof InitiateDeviceDiscovery
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    InitiateDeviceDiscovery.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.origin != null && message.hasOwnProperty("origin"))
            if (!$util.isString(message.origin))
                return "origin: string expected";
        return null;
    };

    /**
     * Creates an InitiateDeviceDiscovery message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof InitiateDeviceDiscovery
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {InitiateDeviceDiscovery} InitiateDeviceDiscovery
     */
    InitiateDeviceDiscovery.fromObject = function fromObject(object) {
        if (object instanceof $root.InitiateDeviceDiscovery)
            return object;
        var message = new $root.InitiateDeviceDiscovery();
        if (object.origin != null)
            message.origin = String(object.origin);
        return message;
    };

    /**
     * Creates a plain object from an InitiateDeviceDiscovery message. Also converts values to other types if specified.
     * @function toObject
     * @memberof InitiateDeviceDiscovery
     * @static
     * @param {InitiateDeviceDiscovery} message InitiateDeviceDiscovery
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    InitiateDeviceDiscovery.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.origin = "";
        if (message.origin != null && message.hasOwnProperty("origin"))
            object.origin = message.origin;
        return object;
    };

    /**
     * Converts this InitiateDeviceDiscovery to JSON.
     * @function toJSON
     * @memberof InitiateDeviceDiscovery
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    InitiateDeviceDiscovery.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return InitiateDeviceDiscovery;
})();

$root.DeviceDiscoveryAnnouncement = (function() {

    /**
     * Properties of a DeviceDiscoveryAnnouncement.
     * @exports IDeviceDiscoveryAnnouncement
     * @interface IDeviceDiscoveryAnnouncement
     * @property {IDeviceDefinition|null} [device] DeviceDiscoveryAnnouncement device
     * @property {Array.<ISensorValue>|null} [sensorValues] DeviceDiscoveryAnnouncement sensorValues
     */

    /**
     * Constructs a new DeviceDiscoveryAnnouncement.
     * @exports DeviceDiscoveryAnnouncement
     * @classdesc Represents a DeviceDiscoveryAnnouncement.
     * @implements IDeviceDiscoveryAnnouncement
     * @constructor
     * @param {IDeviceDiscoveryAnnouncement=} [properties] Properties to set
     */
    function DeviceDiscoveryAnnouncement(properties) {
        this.sensorValues = [];
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * DeviceDiscoveryAnnouncement device.
     * @member {IDeviceDefinition|null|undefined} device
     * @memberof DeviceDiscoveryAnnouncement
     * @instance
     */
    DeviceDiscoveryAnnouncement.prototype.device = null;

    /**
     * DeviceDiscoveryAnnouncement sensorValues.
     * @member {Array.<ISensorValue>} sensorValues
     * @memberof DeviceDiscoveryAnnouncement
     * @instance
     */
    DeviceDiscoveryAnnouncement.prototype.sensorValues = $util.emptyArray;

    /**
     * Creates a new DeviceDiscoveryAnnouncement instance using the specified properties.
     * @function create
     * @memberof DeviceDiscoveryAnnouncement
     * @static
     * @param {IDeviceDiscoveryAnnouncement=} [properties] Properties to set
     * @returns {DeviceDiscoveryAnnouncement} DeviceDiscoveryAnnouncement instance
     */
    DeviceDiscoveryAnnouncement.create = function create(properties) {
        return new DeviceDiscoveryAnnouncement(properties);
    };

    /**
     * Encodes the specified DeviceDiscoveryAnnouncement message. Does not implicitly {@link DeviceDiscoveryAnnouncement.verify|verify} messages.
     * @function encode
     * @memberof DeviceDiscoveryAnnouncement
     * @static
     * @param {IDeviceDiscoveryAnnouncement} message DeviceDiscoveryAnnouncement message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DeviceDiscoveryAnnouncement.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.device != null && message.hasOwnProperty("device"))
            $root.DeviceDefinition.encode(message.device, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.sensorValues != null && message.sensorValues.length)
            for (var i = 0; i < message.sensorValues.length; ++i)
                $root.SensorValue.encode(message.sensorValues[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified DeviceDiscoveryAnnouncement message, length delimited. Does not implicitly {@link DeviceDiscoveryAnnouncement.verify|verify} messages.
     * @function encodeDelimited
     * @memberof DeviceDiscoveryAnnouncement
     * @static
     * @param {IDeviceDiscoveryAnnouncement} message DeviceDiscoveryAnnouncement message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DeviceDiscoveryAnnouncement.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a DeviceDiscoveryAnnouncement message from the specified reader or buffer.
     * @function decode
     * @memberof DeviceDiscoveryAnnouncement
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {DeviceDiscoveryAnnouncement} DeviceDiscoveryAnnouncement
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DeviceDiscoveryAnnouncement.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.DeviceDiscoveryAnnouncement();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1:
                message.device = $root.DeviceDefinition.decode(reader, reader.uint32());
                break;
            case 2:
                if (!(message.sensorValues && message.sensorValues.length))
                    message.sensorValues = [];
                message.sensorValues.push($root.SensorValue.decode(reader, reader.uint32()));
                break;
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a DeviceDiscoveryAnnouncement message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof DeviceDiscoveryAnnouncement
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {DeviceDiscoveryAnnouncement} DeviceDiscoveryAnnouncement
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DeviceDiscoveryAnnouncement.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a DeviceDiscoveryAnnouncement message.
     * @function verify
     * @memberof DeviceDiscoveryAnnouncement
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    DeviceDiscoveryAnnouncement.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.device != null && message.hasOwnProperty("device")) {
            var error = $root.DeviceDefinition.verify(message.device);
            if (error)
                return "device." + error;
        }
        if (message.sensorValues != null && message.hasOwnProperty("sensorValues")) {
            if (!Array.isArray(message.sensorValues))
                return "sensorValues: array expected";
            for (var i = 0; i < message.sensorValues.length; ++i) {
                var error = $root.SensorValue.verify(message.sensorValues[i]);
                if (error)
                    return "sensorValues." + error;
            }
        }
        return null;
    };

    /**
     * Creates a DeviceDiscoveryAnnouncement message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof DeviceDiscoveryAnnouncement
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {DeviceDiscoveryAnnouncement} DeviceDiscoveryAnnouncement
     */
    DeviceDiscoveryAnnouncement.fromObject = function fromObject(object) {
        if (object instanceof $root.DeviceDiscoveryAnnouncement)
            return object;
        var message = new $root.DeviceDiscoveryAnnouncement();
        if (object.device != null) {
            if (typeof object.device !== "object")
                throw TypeError(".DeviceDiscoveryAnnouncement.device: object expected");
            message.device = $root.DeviceDefinition.fromObject(object.device);
        }
        if (object.sensorValues) {
            if (!Array.isArray(object.sensorValues))
                throw TypeError(".DeviceDiscoveryAnnouncement.sensorValues: array expected");
            message.sensorValues = [];
            for (var i = 0; i < object.sensorValues.length; ++i) {
                if (typeof object.sensorValues[i] !== "object")
                    throw TypeError(".DeviceDiscoveryAnnouncement.sensorValues: object expected");
                message.sensorValues[i] = $root.SensorValue.fromObject(object.sensorValues[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a DeviceDiscoveryAnnouncement message. Also converts values to other types if specified.
     * @function toObject
     * @memberof DeviceDiscoveryAnnouncement
     * @static
     * @param {DeviceDiscoveryAnnouncement} message DeviceDiscoveryAnnouncement
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    DeviceDiscoveryAnnouncement.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.arrays || options.defaults)
            object.sensorValues = [];
        if (options.defaults)
            object.device = null;
        if (message.device != null && message.hasOwnProperty("device"))
            object.device = $root.DeviceDefinition.toObject(message.device, options);
        if (message.sensorValues && message.sensorValues.length) {
            object.sensorValues = [];
            for (var j = 0; j < message.sensorValues.length; ++j)
                object.sensorValues[j] = $root.SensorValue.toObject(message.sensorValues[j], options);
        }
        return object;
    };

    /**
     * Converts this DeviceDiscoveryAnnouncement to JSON.
     * @function toJSON
     * @memberof DeviceDiscoveryAnnouncement
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    DeviceDiscoveryAnnouncement.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    return DeviceDiscoveryAnnouncement;
})();

module.exports = $root;
