/**
 * Memberstack Data API helpers
 * Uses Memberstack's REST API to interact with data tables
 */

const MEMBERSTACK_API_BASE = "https://api.memberstack.com/v1"

export interface DataTableRecord {
  id: string
  data: Record<string, any>
}

/**
 * Query data table records using Memberstack REST API
 */
export async function queryDataTable(
  appId: string,
  secretKey: string,
  tableName: string,
  filter?: Record<string, any>
): Promise<DataTableRecord[]> {
  // Try different API endpoint formats
  const endpoints = [
    `${MEMBERSTACK_API_BASE}/data/${appId}/tables/${tableName}/records`,
    `${MEMBERSTACK_API_BASE}/apps/${appId}/tables/${tableName}/records`,
    `https://api.memberstack.com/v1/apps/${appId}/data-tables/${tableName}/records`,
  ]
  
  for (const endpoint of endpoints) {
    try {
      const url = new URL(endpoint)
      
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          url.searchParams.append(`filter[${key}]`, String(value))
        })
      }

      console.log("Trying endpoint:", url.toString())
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/json",
          "X-Memberstack-App-Id": appId,
          "X-Memberstack-Secret-Key": secretKey,
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log("Success with endpoint:", endpoint)
        return parseResponse(result)
      } else if (response.status !== 404) {
        // If it's not 404, this endpoint format might be wrong, try next
        continue
      }
    } catch (error: any) {
      console.error(`Error with endpoint ${endpoint}:`, error.message)
      continue
    }
  }
  
  // If all endpoints failed, return empty array
  throw new Error("All API endpoints failed. Memberstack REST API may not be available for data tables.")
  
  function parseResponse(result: any): DataTableRecord[] {
    // Handle different response formats
    if (Array.isArray(result)) {
      return result.map((item: any) => ({
        id: item.id || item.node?.id,
        data: item.data || item.node?.data || item,
      }))
    }
    
    if (result.edges && Array.isArray(result.edges)) {
      return result.edges.map((edge: any) => ({
        id: edge.node?.id,
        data: edge.node?.data || {},
      }))
    }
    
    if (result.data && Array.isArray(result.data)) {
      return result.data.map((item: any) => ({
        id: item.id,
        data: item.data || item,
      }))
    }
    
    if (result.records && Array.isArray(result.records)) {
      return result.records.map((item: any) => ({
        id: item.id,
        data: item.data || item,
      }))
    }
    
    return []
  }
}

/**
 * Get a single data table record
 */
export async function getDataTableRecord(
  appId: string,
  secretKey: string,
  tableName: string,
  recordId: string
): Promise<DataTableRecord | null> {
  const response = await fetch(
    `${MEMBERSTACK_API_BASE}/data/${appId}/tables/${tableName}/records/${recordId}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    const error = await response.json().catch(() => ({ error: "Failed to get record" }))
    throw new Error(error.error || `Failed to get record: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data || result
}

/**
 * Create a data table record
 */
export async function createDataTableRecord(
  appId: string,
  secretKey: string,
  tableName: string,
  data: Record<string, any>
): Promise<DataTableRecord> {
  const response = await fetch(
    `${MEMBERSTACK_API_BASE}/data/${appId}/tables/${tableName}/records`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to create record" }))
    throw new Error(error.error || `Failed to create record: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data || result
}

/**
 * Update a data table record
 */
export async function updateDataTableRecord(
  appId: string,
  secretKey: string,
  tableName: string,
  recordId: string,
  data: Record<string, any>
): Promise<DataTableRecord> {
  const response = await fetch(
    `${MEMBERSTACK_API_BASE}/data/${appId}/tables/${tableName}/records/${recordId}`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to update record" }))
    throw new Error(error.error || `Failed to update record: ${response.statusText}`)
  }

  const result = await response.json()
  return result.data || result
}

/**
 * Delete a data table record
 */
export async function deleteDataTableRecord(
  appId: string,
  secretKey: string,
  tableName: string,
  recordId: string
): Promise<boolean> {
  const response = await fetch(
    `${MEMBERSTACK_API_BASE}/data/${appId}/tables/${tableName}/records/${recordId}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to delete record" }))
    throw new Error(error.error || `Failed to delete record: ${response.statusText}`)
  }

  return true
}

