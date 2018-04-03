# HomeBot

Do-It-Yourself Home Automation

> **Note:**   
> `HomeBot` is currently under active development and can in no way be considered stable. It's not even published to NPM, please stay tuned ;)  
> You can still clone the repository and try it yourself. Please follow the instructions below

`HomeBot` is a NodeJS framework (written in TypeScript) for building DIY home automation systems. It works by defining/adding `Device`s that provide the base foundation of your home automation system. Devices can have Sensors and provide Commands (Actors) to interact with whatever kind of thing you like. 

It currently features

 - Dependency Injection (based and similar on Angular)
 - A dynamic module/plugin system (runtime loading via config)
 - Basic devices for
    - MPD (Music-Play-Daemon) enabled devices
    - Amazon FireTV (Gen 3; only basic commands and ADB required)
    - DarkSkyNet (Weather information)
    - Host Information (CPU load, Mem stats, ...)
 - A set of easy to use (still basic) plugins for MQTT, HTTP and GraphQL
 - A RESTful HTTP API (using the httpserver plugin)
 - A MQTT-to-HTTP proxy with support for multiple "device hosts"
 
---

More to come

---

# License

```
Copyright 2018 Patrick Pacher <patrick.pacher@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
THE USE OR OTHER DEALINGS IN THE SOFTWARE.

```
