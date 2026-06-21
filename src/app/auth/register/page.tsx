import { redirect } from "next/navigation";

export const metadata = {
  title: "Request Access | Karpilo LoadIQ App",
  description:
    "Public signup is not available. Karpilo LoadIQ app access is controlled.",
};

export default function RegisterPage() {
  redirect("/request-access");
}
