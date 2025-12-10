/**
 * DependentSelect - Utility functions
 */

import type {
  DependentFieldConfig,
  DependentSelectValues,
  RelationshipMap,
  SelectOption,
} from './types';

/**
 * Build relationship map từ configs
 * Giúp track parent-child relationships giữa các fields
 */
export function buildRelationshipMap(
  configs: DependentFieldConfig[],
): RelationshipMap {
  const map: RelationshipMap = new Map();

  // Initialize tất cả fields
  configs.forEach((config) => {
    map.set(config.name, {
      parent: config.dependsOn || null,
      children: [],
    });
  });

  // Populate children
  configs.forEach((config) => {
    if (config.dependsOn) {
      const parentRel = map.get(config.dependsOn);
      if (parentRel) {
        parentRel.children.push(config.name);
      }
    }
  });

  return map;
}

/**
 * Lấy tất cả descendants của một field (children, grandchildren, etc.)
 */
export function getAllDescendants(
  fieldName: string,
  relationshipMap: RelationshipMap,
): string[] {
  const descendants: string[] = [];
  const queue = [fieldName];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const rel = relationshipMap.get(current);
    if (rel) {
      rel.children.forEach((child) => {
        descendants.push(child);
        queue.push(child);
      });
    }
  }

  return descendants;
}

/**
 * Default filter function - filter options dựa trên parentValue
 */
export function defaultFilterOptions(
  options: SelectOption[],
  parentValue: any,
): SelectOption[] {
  if (parentValue === undefined || parentValue === null) {
    return [];
  }

  // Nếu parent là multiple select (array)
  if (Array.isArray(parentValue)) {
    if (parentValue.length === 0) {
      return [];
    }
    return options.filter((opt) => {
      if (Array.isArray(opt.parentValue)) {
        // Option có thể thuộc nhiều parent
        return opt.parentValue.some((pv) => parentValue.includes(pv));
      }
      return parentValue.includes(opt.parentValue);
    });
  }

  // Nếu parent là single select
  return options.filter((opt) => {
    if (Array.isArray(opt.parentValue)) {
      return opt.parentValue.includes(parentValue);
    }
    return opt.parentValue === parentValue;
  });
}

/**
 * Xử lý cascade delete cho multiple select
 * Khi xoá một item ở parent, chỉ xoá các item con phụ thuộc vào item đó
 *
 * @param currentValue - Giá trị hiện tại của child field
 * @param removedParentValues - Các giá trị parent bị xoá
 * @param options - Tất cả options của child field
 * @returns Giá trị mới sau khi lọc bỏ các item phụ thuộc vào parent bị xoá
 */
export function cascadeDeleteValues(
  currentValue: any,
  removedParentValues: (string | number)[],
  options: SelectOption[],
): any {
  if (!currentValue) return currentValue;

  // Nếu là single select
  if (!Array.isArray(currentValue)) {
    const option = options.find((opt) => opt.value === currentValue);
    if (!option) return currentValue;

    // Kiểm tra xem option này có phụ thuộc vào parent bị xoá không
    if (Array.isArray(option.parentValue)) {
      const stillHasParent = option.parentValue.some(
        (pv) => !removedParentValues.includes(pv),
      );
      return stillHasParent ? currentValue : undefined;
    }
    return removedParentValues.includes(option.parentValue as any)
      ? undefined
      : currentValue;
  }

  // Nếu là multiple select
  return currentValue.filter((val: any) => {
    const option = options.find((opt) => opt.value === val);
    if (!option) return true; // Giữ lại nếu không tìm thấy option

    // Kiểm tra xem option này có phụ thuộc vào parent bị xoá không
    if (Array.isArray(option.parentValue)) {
      // Option thuộc nhiều parent - chỉ xoá nếu TẤT CẢ parent đều bị xoá
      const stillHasParent = option.parentValue.some(
        (pv) => !removedParentValues.includes(pv),
      );
      return stillHasParent;
    }

    // Option chỉ thuộc một parent
    return !removedParentValues.includes(option.parentValue as any);
  });
}

/**
 * Tính toán các parent values bị xoá
 */
export function getRemovedParentValues(
  oldValue: any,
  newValue: any,
): (string | number)[] {
  const oldArray = Array.isArray(oldValue)
    ? oldValue
    : oldValue !== undefined && oldValue !== null
      ? [oldValue]
      : [];
  const newArray = Array.isArray(newValue)
    ? newValue
    : newValue !== undefined && newValue !== null
      ? [newValue]
      : [];

  return oldArray.filter((v: any) => !newArray.includes(v));
}

/**
 * Deep clone values object
 */
export function cloneValues(
  values: DependentSelectValues,
): DependentSelectValues {
  return JSON.parse(JSON.stringify(values));
}
