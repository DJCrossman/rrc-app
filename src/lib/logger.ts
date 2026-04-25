type LogLevel = "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

export type Logger = {
	info: (message: string, fields?: LogFields) => void;
	warn: (message: string, fields?: LogFields) => void;
	error: (message: string, fields?: LogFields) => void;
};

export function createLogger(scope: string): Logger {
	return {
		info: (message, fields) => emit("info", scope, message, fields),
		warn: (message, fields) => emit("warn", scope, message, fields),
		error: (message, fields) => emit("error", scope, message, fields),
	};
}

function emit(
	level: LogLevel,
	scope: string,
	message: string,
	fields?: LogFields,
) {
	const entry = {
		level,
		scope,
		message,
		...(fields ?? {}),
	};
	const sink =
		level === "error"
			? console.error
			: level === "warn"
				? console.warn
				: console.log;
	sink(JSON.stringify(entry));
}
