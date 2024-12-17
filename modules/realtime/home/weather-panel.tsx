import * as React from 'react';

interface Coordinates {
	lat: number;
	lng: number;
	location?: string;
	temperature?: {
		value: number;
		units: string;
	};
	wind_speed?: {
		value: number;
		units: string;
	};
}

interface WeatherPanelProps {
	coords: Coordinates;
	marker: Coordinates | null;
}

export function WeatherPanel({ coords, marker }: WeatherPanelProps): JSX.Element {
	return (
		<div className="content-block map">
			<div className="content-block-title">get_weather()</div>
			<div className="content-block-body">
				<p>Latitude: {coords.lat}</p>
				<p>Longitude: {coords.lng}</p>
				{marker && (
					<div>
						<p>Location: {marker.location || 'N/A'}</p>
						{marker.temperature && (
							<p>
								Temperature: {marker.temperature.value} {marker.temperature.units}
							</p>
						)}
						{marker.wind_speed && (
							<p>
								Wind Speed: {marker.wind_speed.value} {marker.wind_speed.units}
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
