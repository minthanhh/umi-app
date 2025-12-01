import {
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  Tooltip,
} from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import React from 'react';
import type { FieldConfig } from '../types';
import InfiniteScrollSelect from './InfiniteScrollSelect';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

// ============================================================================
// Types
// ============================================================================

interface DynamicFormFieldProps {
  field: FieldConfig;
  size?: 'small' | 'middle' | 'large';
}

// ============================================================================
// Component
// ============================================================================

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({ field, size }) => {
  const { name, label, type, placeholder, disabled, hidden, rules, tooltip } = field;

  if (hidden) return null;

  // Render label with optional tooltip
  const renderLabel = () => {
    if (!tooltip) return label;
    return (
      <span>
        {label}{' '}
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined className="text-gray-400 cursor-help" />
        </Tooltip>
      </span>
    );
  };

  // Render field based on type
  const renderField = () => {
    switch (type) {
      case 'input': {
        const { maxLength, prefix, suffix } = field;
        return (
          <Input
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            prefix={prefix}
            suffix={suffix}
            size={size}
          />
        );
      }

      case 'textarea': {
        const { maxLength, rows = 4, showCount } = field;
        return (
          <TextArea
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={rows}
            showCount={showCount}
            size={size}
          />
        );
      }

      case 'number': {
        const { min, max, step, precision } = field;
        return (
          <InputNumber
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            precision={precision}
            size={size}
            style={{ width: '100%' }}
          />
        );
      }

      case 'select': {
        const { options, mode, allowClear = true, showSearch = true } = field;
        return (
          <Select
            placeholder={placeholder}
            disabled={disabled}
            options={options}
            mode={mode}
            allowClear={allowClear}
            showSearch={showSearch}
            size={size}
            filterOption={(input, option) =>
              String(option?.label || '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        );
      }

      case 'select-infinite': {
        const { infiniteConfig, mode, allowClear = true } = field;
        return (
          <InfiniteScrollSelect
            config={infiniteConfig}
            placeholder={placeholder}
            disabled={disabled}
            mode={mode}
            allowClear={allowClear}
            size={size}
          />
        );
      }

      case 'date': {
        const { format = 'YYYY-MM-DD', showTime } = field;
        return (
          <DatePicker
            placeholder={placeholder}
            disabled={disabled}
            format={format}
            showTime={showTime}
            size={size}
            style={{ width: '100%' }}
          />
        );
      }

      case 'dateRange': {
        const { format = 'YYYY-MM-DD', showTime } = field;
        return (
          <RangePicker
            disabled={disabled}
            format={format}
            showTime={showTime}
            size={size}
            style={{ width: '100%' }}
          />
        );
      }

      case 'checkbox': {
        const { options } = field;
        if (options && options.length > 0) {
          return <Checkbox.Group options={options} disabled={disabled} />;
        }
        return <Checkbox disabled={disabled}>{label}</Checkbox>;
      }

      case 'radio': {
        const { options, optionType = 'default' } = field;
        return (
          <Radio.Group disabled={disabled} optionType={optionType} size={size}>
            {options.map((opt) => (
              <Radio key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </Radio>
            ))}
          </Radio.Group>
        );
      }

      case 'switch': {
        const { checkedChildren, unCheckedChildren } = field;
        return (
          <Switch
            disabled={disabled}
            checkedChildren={checkedChildren}
            unCheckedChildren={unCheckedChildren}
            size={size === 'large' ? 'default' : 'small'}
          />
        );
      }

      default:
        return <Input placeholder={placeholder} disabled={disabled} size={size} />;
    }
  };

  // Special handling for checkbox without options (single checkbox)
  if (type === 'checkbox' && (!('options' in field) || !field.options?.length)) {
    return (
      <Form.Item name={name} valuePropName="checked" rules={rules}>
        {renderField()}
      </Form.Item>
    );
  }

  // Special handling for switch
  if (type === 'switch') {
    return (
      <Form.Item name={name} label={renderLabel()} valuePropName="checked" rules={rules}>
        {renderField()}
      </Form.Item>
    );
  }

  return (
    <Form.Item name={name} label={renderLabel()} rules={rules}>
      {renderField()}
    </Form.Item>
  );
};

export default DynamicFormField;
