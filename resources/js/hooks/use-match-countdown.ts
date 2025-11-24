import { useEffect, useState } from "react";

interface CountdownResult {
	countdown: string;
	hasStarted: boolean;
}

export function useMatchCountdown(scheduledAt: string): CountdownResult {
	const [countdown, setCountdown] = useState<string>("");
	const [hasStarted, setHasStarted] = useState(false);

	useEffect(() => {
		const updateCountdown = () => {
			const matchTime = new Date(scheduledAt);
			const currentTime = new Date();
			const timeDiff = matchTime.getTime() - currentTime.getTime();

			if (timeDiff <= 0) {
				setHasStarted(true);
				setCountdown("");
				return;
			}

			setHasStarted(false);

			// Calculate time units
			const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
			const hours = Math.floor(
				(timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
			);
			const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

			// Format countdown string
			if (days > 0) {
				setCountdown(`${days}d ${hours}h ${minutes}m`);
			} else if (hours > 0) {
				setCountdown(`${hours}h ${minutes}m`);
			} else if (minutes > 0) {
				setCountdown(`${minutes}m ${seconds}s`);
			} else {
				setCountdown(`${seconds}s`);
			}
		};

		// Update immediately
		updateCountdown();

		// Update every second
		const interval = setInterval(updateCountdown, 1000);

		return () => clearInterval(interval);
	}, [scheduledAt]);

	return { countdown, hasStarted };
}

