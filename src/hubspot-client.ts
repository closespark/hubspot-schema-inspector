import axios, { AxiosInstance } from 'axios';
import { SchemasResponse, HubSpotSchema, AssociationTypesResponse, ObjectExistsResult } from './types';

export class HubSpotClient {
  private client: AxiosInstance;
  private baseUrl = 'https://api.hubapi.com';

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('HUBSPOT_ACCESS_TOKEN is required');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if a standard object exists by probing the objects API (read-only)
   * GET /crm/v3/objects/{name}?limit=1
   * 
   * Returns:
   * - 200 OK → object exists and is usable
   * - 404 → object truly does not exist  
   * - 403 → token lacks object read scope
   */
  async objectExists(name: string): Promise<ObjectExistsResult> {
    try {
      const response = await this.client.get(`/crm/v3/objects/${name}`, {
        params: { limit: 1 },
      });
      
      if (response.status === 200) {
        return { exists: true, verifiedVia: 'objects' };
      }
      
      return { exists: false, verifiedVia: 'objects' };
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 404) {
          return { exists: false, verifiedVia: 'objects' };
        }
        if (error.response.status === 403) {
          return { 
            exists: false, 
            verifiedVia: 'objects', 
            error: 'Insufficient permissions (403)' 
          };
        }
        return { 
          exists: false, 
          verifiedVia: 'objects', 
          error: `API Error (${error.response.status})` 
        };
      }
      throw error;
    }
  }

  /**
   * Fetch all CRM schemas from HubSpot
   */
  async getSchemas(): Promise<HubSpotSchema[]> {
    try {
      const response = await this.client.get<SchemasResponse>('/crm/v3/schemas');
      return response.data.results;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `HubSpot API Error (${error.response.status}): ${
            error.response.data?.message || error.response.statusText
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Fetch a specific schema by object type
   */
  async getSchema(objectType: string): Promise<HubSpotSchema> {
    try {
      const response = await this.client.get<HubSpotSchema>(
        `/crm/v3/schemas/${objectType}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `HubSpot API Error (${error.response.status}): ${
            error.response.data?.message || error.response.statusText
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Fetch association definitions between two object types (read-only)
   * GET /crm/v4/associations/{fromObjectType}/{toObjectType}/types
   */
  async getAssociationTypes(
    fromObjectType: string,
    toObjectType: string
  ): Promise<AssociationTypesResponse> {
    try {
      const response = await this.client.get<AssociationTypesResponse>(
        `/crm/v4/associations/${fromObjectType}/${toObjectType}/types`
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `HubSpot API Error (${error.response.status}): ${
            error.response.data?.message || error.response.statusText
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Verify if an association path is valid (read-only)
   */
  async verifyAssociationPath(
    fromObjectType: string,
    toObjectType: string
  ): Promise<{
    valid: boolean;
    path: string;
    associationTypes?: AssociationTypesResponse;
    error?: string;
  }> {
    const path = `/crm/v4/associations/${fromObjectType}/${toObjectType}/types`;
    
    try {
      const associationTypes = await this.getAssociationTypes(
        fromObjectType,
        toObjectType
      );
      return {
        valid: true,
        path,
        associationTypes,
      };
    } catch (error: any) {
      return {
        valid: false,
        path,
        error: error.message,
      };
    }
  }
}
