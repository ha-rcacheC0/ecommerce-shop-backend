import type { FromSchema } from 'json-schema-to-ts';
import * as schemas from './schemas';

export type CheckoutInitBodyParam = FromSchema<typeof schemas.CheckoutInit.body>;
export type CheckoutInitMetadataParam = FromSchema<typeof schemas.CheckoutInit.metadata>;
export type CheckoutInitResponse200 = FromSchema<typeof schemas.CheckoutInit.response['200']>;
export type CheckoutInitResponseDefault = FromSchema<typeof schemas.CheckoutInit.response['default']>;
