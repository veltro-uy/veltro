import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
	name: string;
	avatarUrl?: string;
	className?: string;
	size?: "sm" | "md" | "lg";
}

const sizeClasses = {
	sm: "h-8 w-8 text-xs",
	md: "h-10 w-10 text-sm",
	lg: "h-12 w-12 text-base",
};

export function UserAvatar({
	name,
	avatarUrl,
	className,
	size = "md",
}: UserAvatarProps) {
	const getInitials = (userName: string) => {
		if (!userName || userName.trim().length === 0) {
			return '??';
		}
		const words = userName.trim().split(/\s+/);
		if (words.length >= 2) {
			// Take first letter of first name and first letter of last name
			return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
		}
		// If only one word, take first two letters
		return userName.slice(0, 2).toUpperCase();
	};

	return (
		<Avatar className={cn(sizeClasses[size], className)}>
			{avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
			<AvatarFallback className="bg-muted font-semibold text-foreground">
				{getInitials(name)}
			</AvatarFallback>
		</Avatar>
	);
}
