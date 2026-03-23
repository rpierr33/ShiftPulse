import { requireRole } from "@/lib/auth-utils";
import { getWorkerCredentials } from "@/actions/credentials";
import { TopBar } from "@/components/layout/top-bar";
import { WorkerCredentialsClient } from "./client";

export default async function WorkerCredentialsPage() {
  await requireRole("WORKER");
  const credentials = await getWorkerCredentials();

  return (
    <div>
      <TopBar title="My Credentials" subtitle="Manage your licenses and certifications" />
      <div className="p-4 lg:p-6">
        <WorkerCredentialsClient credentials={JSON.parse(JSON.stringify(credentials))} />
      </div>
    </div>
  );
}
