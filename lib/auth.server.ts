import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.options";

export const getSessionServer = () => getServerSession(authOptions);
