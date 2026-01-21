import { PolicyResource, typeMapping, regionMapping } from './policy-types'

const DEFAULT_BASE_ID = 'appp4QinpvtEldbq2'
const DEFAULT_TABLE_ID = 'tblQq8U7LQSQcN9YE'
const DEFAULT_VIEW_ID = 'viwzabB3G62D0L57K'

function coerceFieldToString(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (obj.url) return String(obj.url)
    if (obj.text) return String(obj.text)
    return ''
  }
  return String(value)
}

function getPolicyAreaMapping(policyAreaText: string): string | null {
  const mapping: Record<string, string> = {
    'Land Use': 'landuse',
    'Financing Projects': 'financing',
    'Rental / Tenant Protections': 'rental',
    'Cost of Building': 'cost',
    'Climate Resiliency': 'climate',
    'Homelessness Prevention': 'homelessness',
    'Homeownership': 'homeownership'
  }

  for (const [key, value] of Object.entries(mapping)) {
    if (policyAreaText.includes(key)) {
      return value
    }
  }
  return null
}

function getGradientForCategory(policyArea: string, index: number): string {
  const gradients: Record<string, string[]> = {
    'landuse': [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    ],
    'financing': [
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ],
    'rental': [
      'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)'
    ],
    'cost': [
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ],
    'climate': [
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
    ],
    'homelessness': [
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    ],
    'homeownership': [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    ]
  }
  const categoryGradients = gradients[policyArea] || gradients['landuse']
  return categoryGradients[index % categoryGradients.length]
}

function formatDate(dateStr: string): string {
  if (dateStr && dateStr.length === 4) {
    return `${dateStr}-01-01`
  }
  return dateStr || '2025-01-01'
}

interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
}

interface AirtableResponse {
  records: AirtableRecord[]
  offset?: string
}

function transformRecord(rec: AirtableRecord, index: number): PolicyResource | null {
  const f = rec.fields

  const title = coerceFieldToString(f['Resource Name']).trim()
  const org = coerceFieldToString(f['Org']).trim()
  const summary = coerceFieldToString(f['Summary']).trim()
  const abundanceNote = coerceFieldToString(f['Abundance Note']).trim()
  const orgDescriptionField = f['Org Description']
  const orgDescription =
    (typeof orgDescriptionField === 'object' && orgDescriptionField && (orgDescriptionField as Record<string, unknown>).value
      ? String((orgDescriptionField as Record<string, unknown>).value).trim()
      : coerceFieldToString(orgDescriptionField).trim())
  const description = summary || abundanceNote || orgDescription || ''
  const toolTypeRaw = coerceFieldToString(f['Tool Type']).trim()
  const policyAreaRaw = coerceFieldToString(f['Policy Area']).trim()
  const regionRaw = coerceFieldToString(f['Region']).trim()
  const url = coerceFieldToString(f['URL']).trim()
  const dateRaw = coerceFieldToString(f['Date']).trim() || '2025'
  const accessibilityScore =
    coerceFieldToString(f['Accessibility Score']).trim() ||
    coerceFieldToString(f['Accessible?']).trim()
  const abundanceAlignment =
    coerceFieldToString(f['Abundance Alignment']).trim() ||
    coerceFieldToString(f['Abundance Tag']).trim()
  const strengths =
    coerceFieldToString(f['Strengths']).trim() ||
    abundanceNote

  if (!title) {
    return null
  }

  const primaryType = toolTypeRaw.split(',')[0]?.trim() || 'article'
  const mappedType = typeMapping[primaryType] || 'article'

  const primaryRegion = regionRaw.split(',')[0]?.trim() || 'National'
  const mappedRegion = regionMapping[primaryRegion] || 'national'

  const rawAreas = policyAreaRaw
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
  const mappedPolicyAreas = rawAreas
    .map((area) => getPolicyAreaMapping(area))
    .filter((area): area is string => area !== null)
  const primaryPolicyArea = mappedPolicyAreas[0] || 'landuse'

  const tags = Array.from(new Set(rawAreas.map((a) => a.toLowerCase()))).slice(0, 5)

  const gradient = getGradientForCategory(primaryPolicyArea, index)

  return {
    id: index + 1,
    title,
    description,
    type: mappedType,
    region: mappedRegion,
    policyType: 'housing',
    policyArea: primaryPolicyArea,
    policyAreas: mappedPolicyAreas,
    date: formatDate(dateRaw),
    author: org,
    tags,
    url: url || undefined,
    accessibilityScore: accessibilityScore || undefined,
    abundanceAlignment: abundanceAlignment || undefined,
    strengths: strengths || undefined,
    image: undefined,
    gradient
  }
}

export async function fetchPolicyResources(): Promise<PolicyResource[]> {
  const apiKey = process.env.AIRTABLE_API_KEY
  if (!apiKey) {
    throw new Error('AIRTABLE_API_KEY environment variable is required')
  }

  const baseId = process.env.AIRTABLE_BASE_ID || DEFAULT_BASE_ID
  const tableId = process.env.AIRTABLE_TABLE_ID || DEFAULT_TABLE_ID
  const viewId = process.env.AIRTABLE_VIEW_ID || DEFAULT_VIEW_ID

  const urlBase = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableId)}`
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  }

  const records: AirtableRecord[] = []
  const params = new URLSearchParams()
  if (viewId) params.set('view', viewId)
  params.set('pageSize', '100')

  while (true) {
    const url = `${urlBase}?${params.toString()}`
    const res = await fetch(url, {
      headers,
      next: { revalidate: 300 }
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Airtable request failed: ${res.status} ${res.statusText}\n${text}`)
    }

    const json: AirtableResponse = await res.json()
    if (Array.isArray(json.records)) {
      records.push(...json.records)
    }

    if (json.offset) {
      params.set('offset', json.offset)
    } else {
      break
    }
  }

  const transformed: PolicyResource[] = []
  let transformIndex = 0
  for (const rec of records) {
    const resource = transformRecord(rec, transformIndex)
    if (resource) {
      resource.id = transformed.length + 1
      transformed.push(resource)
      transformIndex++
    }
  }

  return transformed
}
