import { FastSchema } from '@/libs/fs';
import { createContext, useContext } from 'react';

export interface FastSchemaContextType {
  fastschema?: FastSchema;
}

export const defaultFastSchemaState: FastSchemaContextType = {
  fastschema: undefined,
};

export const FastSchemaContext = createContext<FastSchemaContextType>(defaultFastSchemaState);

export const useFastSchema = (): FastSchema | undefined => {
  const context = useContext(FastSchemaContext);
  return context.fastschema;
}
