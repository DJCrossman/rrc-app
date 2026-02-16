export const formatDuration = (durationInMs: number): string => {
	const totalSeconds = Math.floor(durationInMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const parts = [];
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

	return parts.join(" ");
};

export const formatDurationAsTime = (durationInMs: number): string => {
	const totalSeconds = Math.floor(durationInMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const formatDurationWithMillis = (durationInMs: number): string => {
	const totalSeconds = durationInMs / 1000;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const secondsFormatted = seconds.toFixed(3).padStart(6, "0");

	return `${minutes.toString().padStart(2, "0")}:${secondsFormatted}`;
};

export const formatCompactDuration = (durationInMs: number): string => {
	const totalSeconds = durationInMs / 1000;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const secondsFormatted = seconds.toFixed(1).padStart(4, "0");
	return `${minutes.toString().padStart(2, "0")}:${secondsFormatted}`;
};
