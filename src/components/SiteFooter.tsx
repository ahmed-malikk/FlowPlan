/** One quiet line: where the data lives and where the code is. */
export function SiteFooter() {
  return (
    <footer className="relative px-4 py-8 text-sm text-muted-foreground print:hidden min-[521px]:px-[22px]">
      Saved in this browser only, no account needed.{" "}
      <a
        href="https://github.com/ahmed-malikk/FlowPlan"
        target="_blank"
        rel="noreferrer"
        className="rounded-sm text-amber-text underline underline-offset-4"
      >
        Source on GitHub
      </a>
    </footer>
  );
}
