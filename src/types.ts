/**
 * Type definitions for HubSpot CRM API v3 responses
 */

export interface HubSpotSchema {
  id: string;
  name: string;
  labels: {
    singular: string;
    plural: string;
  };
  requiredProperties: string[];
  searchableProperties: string[];
  primaryDisplayProperty?: string;
  secondaryDisplayProperties?: string[];
  archived: boolean;
  restorable: boolean;
  metaType: string;
  createdAt?: string;
  updatedAt?: string;
  objectTypeId?: string;
  fullyQualifiedName?: string;
  properties?: HubSpotProperty[];
  associations?: HubSpotAssociation[];
}

export interface HubSpotProperty {
  name: string;
  label: string;
  type: string;
  fieldType: string;
  description?: string;
  groupName?: string;
  options?: Array<{
    label: string;
    value: string;
    hidden: boolean;
    displayOrder: number;
  }>;
  createdUserId?: string;
  updatedUserId?: string;
  displayOrder?: number;
  calculated?: boolean;
  externalOptions?: boolean;
  hasUniqueValue?: boolean;
  hidden?: boolean;
  hubspotDefined?: boolean;
  modificationMetadata?: {
    archivable: boolean;
    readOnlyDefinition: boolean;
    readOnlyValue: boolean;
  };
}

export interface HubSpotAssociation {
  id: string;
  name: string;
  fromObjectTypeId: string;
  toObjectTypeId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SchemasResponse {
  results: HubSpotSchema[];
}

export interface AssociationDefinition {
  fromObjectType: string;
  toObjectType: string;
  associationCategory: string;
  associationTypeId: number;
  name?: string;
}

export interface AssociationTypesResponse {
  results: AssociationDefinition[];
}

export interface ObjectExistsResult {
  exists: boolean;
  verifiedVia: 'schemas' | 'objects';
  error?: string;
}
