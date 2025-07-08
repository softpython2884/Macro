'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Cloud, Thermometer, Wind, Droplets } from "lucide-react";

export function WeatherWidget() {
    // In a real application, this data would come from an API call.
    const weatherData = {
        city: 'Night City',
        temperature: 24,
        condition: 'Sunny',
        feelsLike: 26,
        humidity: 45,
        windSpeed: 15,
    };

    return (
        <Card className="w-full max-w-md bg-black/20 backdrop-blur-lg border border-white/10 text-white">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-4xl">{weatherData.city}</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground">{weatherData.condition}</CardDescription>
                    </div>
                    <Sun className="h-16 w-16 text-yellow-400 drop-shadow-[0_0_10px_#facc15]" />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-8xl font-bold text-glow">
                    {weatherData.temperature}°C
                </div>
                <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Thermometer className="h-5 w-5" />
                        <span>Feels like: {weatherData.feelsLike}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5" />
                        <span>Humidity: {weatherData.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Wind className="h-5 w-5" />
                        <span>Wind: {weatherData.windSpeed} km/h</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
