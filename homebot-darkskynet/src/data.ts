export interface CurrentWeather {
    time: number;
    summary: string;
    icon: string;
    nearestStormDistance: number;
    nearestStormBearing: number;
    precipIntensity: number;
    precipProbability: number;
    temperature: number;
    apparentTemperature: number;
    dewPoint: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust: number;
    windBearing: number;
    cloudCover: number;
    uvIndex: number;
    visibility: number;
    ozone: number;
};

export interface WeatherResponse {
    latitude: number;
    longitude: number;
    timezone: string;
    currently: CurrentWeather;
}