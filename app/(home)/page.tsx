import { redirect } from "next/navigation";
import { format } from "date-fns";

export default function HomePage() {
  const today = format(new Date(), "yyyy-MM-dd");
  redirect(`/journal/${today}`);
}
