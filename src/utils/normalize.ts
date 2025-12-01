import { SortOrder } from 'antd/es/table/interface';
import { first, get, isEmpty, keys } from 'lodash';

export function normalizeSort(sort?: Record<string, SortOrder>) {
  if (isEmpty(sort)) return undefined;
  const field = first(keys(sort)) as string;
  const order = get(sort, field);

  return {
    [field]: order === 'ascend' ? 'asc' : 'desc',
  };
}
