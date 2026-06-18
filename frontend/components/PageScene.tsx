import { WorkspaceScene } from "@/components/WorkspaceScene";

/**
 * Fixed, full-viewport ambient backdrop showing the animated man + robot
 * workspace illustration behind the page content. Sits below content (-z-10)
 * and ignores pointer events. Drop it into a page once.
 */
export function PageScene() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute bottom-0 left-1/2 w-full max-w-6xl -translate-x-1/2 opacity-[0.78]">
        <WorkspaceScene />
      </div>
    </div>
  );
}
