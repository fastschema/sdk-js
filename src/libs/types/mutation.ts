import { Content } from './content';

export type RelationContentArrayUpdate = {
  $add?: Array<{ id: number }>;
  $clear?: Array<{ id: number }>;
}

export type RelationContentArrayCreate = Array<{ id: number }>;

export type RelationContentUpdate = RelationContentArrayUpdate | RelationContentArrayCreate | Content | null;
