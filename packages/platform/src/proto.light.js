// Common aliases
var $util = $protobuf.util;

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
 * SIUnit enum.
 * @exports SIUnit
 * @enum {string}
 * @property {number} Custom=0 Custom value
 * @property {number} Kilogram=1 Kilogram value
 * @property {number} Seconds=2 Seconds value
 * @property {number} Ampere=3 Ampere value
 * @property {number} Celcius=4 Celcius value
 * @property {number} Kelvin=5 Kelvin value
 * @property {number} Mole=6 Mole value
 * @property {number} Candela=7 Candela value
 * @property {number} Lux=8 Lux value
 * @property {number} Radiant=9 Radiant value
 * @property {number} Hertz=10 Hertz value
 * @property {number} Newton=11 Newton value
 * @property {number} Pascal=12 Pascal value
 * @property {number} Joule=13 Joule value
 * @property {number} Watt=14 Watt value
 * @property {number} Coulomb=15 Coulomb value
 * @property {number} Volt=16 Volt value
 * @property {number} Farad=17 Farad value
 * @property {number} Ohm=18 Ohm value
 * @property {number} Siemens=19 Siemens value
 * @property {number} Weber=20 Weber value
 * @property {number} Tesla=21 Tesla value
 * @property {number} Henry=22 Henry value
 * @property {number} Lumen=23 Lumen value
 * @property {number} Gray=24 Gray value
 * @property {number} Sievert=25 Sievert value
 * @property {number} Katal=26 Katal value
 * @property {number} Meter=27 Meter value
 */
$root.SIUnit = (function() {
    var valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "Custom"] = 0;
    values[valuesById[1] = "Kilogram"] = 1;
    values[valuesById[2] = "Seconds"] = 2;
    values[valuesById[3] = "Ampere"] = 3;
    values[valuesById[4] = "Celcius"] = 4;
    values[valuesById[5] = "Kelvin"] = 5;
    values[valuesById[6] = "Mole"] = 6;
    values[valuesById[7] = "Candela"] = 7;
    values[valuesById[8] = "Lux"] = 8;
    values[valuesById[9] = "Radiant"] = 9;
    values[valuesById[10] = "Hertz"] = 10;
    values[valuesById[11] = "Newton"] = 11;
    values[valuesById[12] = "Pascal"] = 12;
    values[valuesById[13] = "Joule"] = 13;
    values[valuesById[14] = "Watt"] = 14;
    values[valuesById[15] = "Coulomb"] = 15;
    values[valuesById[16] = "Volt"] = 16;
    values[valuesById[17] = "Farad"] = 17;
    values[valuesById[18] = "Ohm"] = 18;
    values[valuesById[19] = "Siemens"] = 19;
    values[valuesById[20] = "Weber"] = 20;
    values[valuesById[21] = "Tesla"] = 21;
    values[valuesById[22] = "Henry"] = 22;
    values[valuesById[23] = "Lumen"] = 23;
    values[valuesById[24] = "Gray"] = 24;
    values[valuesById[25] = "Sievert"] = 25;
    values[valuesById[26] = "Katal"] = 26;
    values[valuesById[27] = "Meter"] = 27;
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
     * @property {SIUnit|null} [unit] SensorSchema unit
     * @property {string|null} [customUnit] SensorSchema customUnit
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
     * SensorSchema unit.
     * @member {SIUnit} unit
     * @memberof SensorSchema
     * @instance
     */
    SensorSchema.prototype.unit = 0;

    /**
     * SensorSchema customUnit.
     * @member {string} customUnit
     * @memberof SensorSchema
     * @instance
     */
    SensorSchema.prototype.customUnit = "";

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
        switch (object.unit) {
        case "Custom":
        case 0:
            message.unit = 0;
            break;
        case "Kilogram":
        case 1:
            message.unit = 1;
            break;
        case "Seconds":
        case 2:
            message.unit = 2;
            break;
        case "Ampere":
        case 3:
            message.unit = 3;
            break;
        case "Celcius":
        case 4:
            message.unit = 4;
            break;
        case "Kelvin":
        case 5:
            message.unit = 5;
            break;
        case "Mole":
        case 6:
            message.unit = 6;
            break;
        case "Candela":
        case 7:
            message.unit = 7;
            break;
        case "Lux":
        case 8:
            message.unit = 8;
            break;
        case "Radiant":
        case 9:
            message.unit = 9;
            break;
        case "Hertz":
        case 10:
            message.unit = 10;
            break;
        case "Newton":
        case 11:
            message.unit = 11;
            break;
        case "Pascal":
        case 12:
            message.unit = 12;
            break;
        case "Joule":
        case 13:
            message.unit = 13;
            break;
        case "Watt":
        case 14:
            message.unit = 14;
            break;
        case "Coulomb":
        case 15:
            message.unit = 15;
            break;
        case "Volt":
        case 16:
            message.unit = 16;
            break;
        case "Farad":
        case 17:
            message.unit = 17;
            break;
        case "Ohm":
        case 18:
            message.unit = 18;
            break;
        case "Siemens":
        case 19:
            message.unit = 19;
            break;
        case "Weber":
        case 20:
            message.unit = 20;
            break;
        case "Tesla":
        case 21:
            message.unit = 21;
            break;
        case "Henry":
        case 22:
            message.unit = 22;
            break;
        case "Lumen":
        case 23:
            message.unit = 23;
            break;
        case "Gray":
        case 24:
            message.unit = 24;
            break;
        case "Sievert":
        case 25:
            message.unit = 25;
            break;
        case "Katal":
        case 26:
            message.unit = 26;
            break;
        case "Meter":
        case 27:
            message.unit = 27;
            break;
        }
        if (object.customUnit != null)
            message.customUnit = String(object.customUnit);
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
            object.unit = options.enums === String ? "Custom" : 0;
            object.customUnit = "";
        }
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.description != null && message.hasOwnProperty("description"))
            object.description = message.description;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = options.enums === String ? $root.ParameterType[message.type] : message.type;
        if (message.unit != null && message.hasOwnProperty("unit"))
            object.unit = options.enums === String ? $root.SIUnit[message.unit] : message.unit;
        if (message.customUnit != null && message.hasOwnProperty("customUnit"))
            object.customUnit = message.customUnit;
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