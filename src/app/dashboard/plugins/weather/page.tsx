import { WeatherWidget } from '../../../../../plugins/weather/components/WeatherWidget';

export default function WeatherPluginPage() {
  return (
    <div className="flex flex-1 items-center justify-center animate-fade-in">
      <WeatherWidget />
    </div>
  );
}
