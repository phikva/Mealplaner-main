import { Suspense } from "react";
import { AuthCallbackClient } from "./auth-callback-client";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center text-sm text-muted-foreground">
          <p>Logger inn…</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
