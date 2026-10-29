import Image from "next/image";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";

export const MobileHeader = () => {
	const { user } = useCurrentUser();
	const initials = [user.firstName, user.lastName]
		.map((part) => part.charAt(0).toUpperCase())
		.join("");

	return (
		<header className="flex items-center gap-3 px-4 pt-1 md:hidden">
			<Image
				src="/logo.png"
				alt=""
				width={36}
				height={36}
				className="size-9 rounded-[10px]"
			/>
			<div className="min-w-0 flex-1">
				<p className="text-[13px] text-muted-foreground">Regina Rowing Club</p>
				<h1 className="truncate text-[22px] font-bold tracking-tight">
					Hi, {user.nickname || user.firstName || "there"}
				</h1>
			</div>
			<Link
				href={routes.settings.account()}
				aria-label="My account"
				className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[15px] font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
			>
				{initials}
			</Link>
		</header>
	);
};
