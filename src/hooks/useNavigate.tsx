import { useRouter } from "next/navigation";

export const useNavigate = (): Pick<
	ReturnType<typeof useRouter>,
	"push" | "replace"
> => {
	const router = useRouter();
	return router;
};
