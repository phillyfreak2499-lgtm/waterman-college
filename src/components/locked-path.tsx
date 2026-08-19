import { Link } from "@tanstack/react-router";
import { accessLabel, type AccessRole } from "@/lib/access";
import { Button } from "@/components/ui/button";

export function LockedPath({
  role,
  title = "This path is not on your assignment.",
}: {
  role: AccessRole;
  title?: string;
}) {
  const waiting = role === "pending";
  return (
    <div className="mx-auto max-w-xl px-5 py-20 sm:px-8">
      <p className="kicker">{waiting ? "Awaiting assignment" : "Restricted"}</p>
      <span className="rule-brass mt-3" />
      <h1 className="mt-4 font-display text-4xl leading-none">
        {waiting ? "The office has not placed you yet." : title}
      </h1>
      <p className="mt-5 leading-relaxed text-muted">
        {waiting
          ? "The training office still has your request. When they approve you and assign a position, the hall will open to the courses on that path."
          : `Your role is ${accessLabel(role)}. Ask the training office if this course should be on your path.`}
      </p>
      <Button asChild className="mt-8">
        <Link to={waiting ? "/how-it-works" : "/training"}>
          {waiting ? "How it works" : "Back to your campus"}
        </Link>
      </Button>
    </div>
  );
}
