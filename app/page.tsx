import { fetchPolicyResources } from "@/lib/airtable"
import PolicyCMS from "@/components/PolicyCMS"

export const dynamic = 'force-dynamic'

export default async function Page() {
  const policyResources = await fetchPolicyResources()
  return <PolicyCMS policyResources={policyResources} />
}
