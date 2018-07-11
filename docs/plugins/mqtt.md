# @jsmon/plugin-mqtt

The MQTT plugin provides device manager and HTTP server communication via MQTT.

## Documentation

The following topics are used by `@jsmon/plugin-mqtt`:

 Topic                                                    | Description               
----------------------------------------------------------|---------------------------
 jsmon/discovery                                          | Initiate device discovery 
 jsmon/device/`deviceName`                                | Device announcement
 jsmon/device/`{deviceName}`/sensor/`{sensorName}`/value  | Sensor value updated

## Messages

### Device Discovery

Device discovery is used by applications to track available devices.

A device discovery request is published to `jsmon/discovery` without any content.  
Device managers (when using the `MqttDeviceManagerProxyPlugin`) will response  
to `jsmon/device/{deviceName}` using the [DeviceDiscoveryAnnouncement](../../packages/platform/protobuf/device.proto#L98)
message.

## Sensor Value updates

De `MqttDeviceManagerProxy` will publish sensor value changes on MQTT using  
`jsmon/device/{deviceName}/sensor/{sensorName}/value` as a topic.

The payload itself is encoded as [SensorValue](../../packages/platform/protobuf/device.proto#L76)
wheres the value field is JSON encoded.

## Device Methods