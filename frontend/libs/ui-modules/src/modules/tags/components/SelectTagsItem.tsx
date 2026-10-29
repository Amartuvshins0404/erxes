import { ITag } from '../types/Tag';
import { TagInline } from './TagInline';

export const SelectTagsItem = ({ tag }: { tag: ITag }) => (
  <TagInline tag={tag} />
);
