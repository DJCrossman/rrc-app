import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getUserById } from "@/app/api/v1/users/actions";
import { generateQueryKey } from "@/lib/keygen";
import type { User, UserRole } from "@/schemas";

const requestUser = async (id: number) => {
	"use server";
	return getUserById(id);
};

export const useAuth = ({
	id,
	initialData,
}: {
	id: number;
	initialData: User;
}) => {
	const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

	const { status, data, error, isFetching } = useQuery({
		queryKey: generateQueryKey({ type: "user", id }),
		queryFn: async () => requestUser(id),
		initialData,
	});

	useEffect(() => {
		if (data) {
			setCurrentRole(data.roles[0] ?? null);
		}
	}, [data]);

	const switchRole = (role: UserRole) => {
		setCurrentRole(role);
	};

	return {
		status,
		data,
		error,
		isFetching,
		currentRole,
		switchRole,
	};
};
