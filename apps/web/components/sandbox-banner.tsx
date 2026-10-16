import { SANDBOX_NOTICE } from "@/lib/stellar/config";

export function SandboxBanner() {
  return (
    <p className="bg-pine px-4 py-2 text-center text-sm font-medium text-white" role="note">
      {SANDBOX_NOTICE}
    </p>
  );
}
