import { Button, Card, Col, Collapse, Form, Row, Space } from 'antd';
import type { FormInstance } from 'antd';
import React, { useMemo } from 'react';
import type { DynamicFormConfig, FormSection, ThemeConfig } from '../types';
import DynamicFormField from './DynamicFormField';
import theme from 'antd/es/theme';

// ============================================================================
// Types
// ============================================================================

interface DynamicFormProps {
  config: DynamicFormConfig;
  form?: FormInstance;
  onFinish?: (values: Record<string, unknown>) => void;
  onReset?: () => void;
  initialValues?: Record<string, unknown>;
  loading?: boolean;
}

// ============================================================================
// Theme Utilities
// ============================================================================

const getThemeStyles = (themeConfig?: ThemeConfig) => {
  const defaultConfig: ThemeConfig = {
    theme: 'default',
    labelAlign: 'right',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
    size: 'middle',
    bordered: true,
    showRequiredMark: true,
  };

  const merged = { ...defaultConfig, ...themeConfig };

  // Adjust layout based on theme
  switch (merged.theme) {
    case 'compact':
      return {
        ...merged,
        labelCol: { span: 8 },
        wrapperCol: { span: 16 },
        size: 'small' as const,
      };
    case 'inline':
      return {
        ...merged,
        labelCol: undefined,
        wrapperCol: undefined,
        layout: 'inline' as const,
      };
    case 'card':
      return {
        ...merged,
        labelCol: { span: 24 },
        wrapperCol: { span: 24 },
        labelAlign: 'left' as const,
      };
    default:
      return merged;
  }
};

// ============================================================================
// Section Component
// ============================================================================

interface FormSectionProps {
  section: FormSection;
  themeConfig: ReturnType<typeof getThemeStyles>;
  index: number;
}

const FormSectionContent: React.FC<FormSectionProps> = ({ section, themeConfig }) => {
  const { fields } = section;

  return (
    <Row gutter={[16, 0]}>
      {fields.map((field) => {
        const colSpan = field.colSpan || 24;
        return (
          <Col key={field.name} xs={24} sm={colSpan > 12 ? 24 : 12} md={colSpan}>
            <DynamicFormField field={field} size={themeConfig.size} />
          </Col>
        );
      })}
    </Row>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  form: externalForm,
  onFinish,
  onReset,
  initialValues,
  loading = false,
}) => {
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;
  const { token } = theme.useToken();

  const { sections, theme: themeConfig, submitText = 'Submit', resetText = 'Reset', showReset = true } = config;

  const mergedTheme = useMemo(() => getThemeStyles(themeConfig), [themeConfig]);

  // Handle form submission
  const handleFinish = (values: Record<string, unknown>) => {
    onFinish?.(values);
  };

  // Handle form reset
  const handleReset = () => {
    form.resetFields();
    onReset?.();
  };

  // Render sections based on theme
  const renderSections = () => {
    // For inline theme, render all fields in a single row
    if (mergedTheme.theme === 'inline') {
      const allFields = sections.flatMap((s) => s.fields);
      return (
        <Space wrap size="middle">
          {allFields.map((field) => (
            <DynamicFormField key={field.name} field={field} size={mergedTheme.size} />
          ))}
        </Space>
      );
    }

    // For card theme, wrap each section in a Card
    if (mergedTheme.theme === 'card') {
      return sections.map((section, index) => (
        <Card
          key={index}
          title={section.title}
          size="small"
          className="mb-4"
          style={{ borderColor: token.colorBorderSecondary }}
        >
          {section.description && (
            <p className="text-gray-500 text-sm mb-4">{section.description}</p>
          )}
          <FormSectionContent section={section} themeConfig={mergedTheme} index={index} />
        </Card>
      ));
    }

    // For collapsible sections
    const collapsibleSections = sections.filter((s) => s.collapsible);
    const normalSections = sections.filter((s) => !s.collapsible);

    return (
      <>
        {normalSections.map((section, index) => (
          <div key={`normal-${index}`} className="mb-6">
            {section.title && (
              <h3 className="text-lg font-medium mb-2" style={{ color: token.colorTextHeading }}>
                {section.title}
              </h3>
            )}
            {section.description && (
              <p className="text-gray-500 text-sm mb-4">{section.description}</p>
            )}
            <FormSectionContent section={section} themeConfig={mergedTheme} index={index} />
          </div>
        ))}

        {collapsibleSections.length > 0 && (
          <Collapse
            defaultActiveKey={collapsibleSections
              .map((s, i) => (s.defaultCollapsed ? null : `collapse-${i}`))
              .filter(Boolean) as string[]}
            className="mb-6"
            items={collapsibleSections.map((section, index) => ({
              key: `collapse-${index}`,
              label: section.title || `Section ${index + 1}`,
              children: (
                <>
                  {section.description && (
                    <p className="text-gray-500 text-sm mb-4">{section.description}</p>
                  )}
                  <FormSectionContent section={section} themeConfig={mergedTheme} index={index} />
                </>
              ),
            }))}
          />
        )}
      </>
    );
  };

  // Form layout props
  const formLayoutProps = mergedTheme.theme === 'inline'
    ? { layout: 'inline' as const }
    : {
        labelCol: mergedTheme.labelCol,
        wrapperCol: mergedTheme.wrapperCol,
        labelAlign: mergedTheme.labelAlign,
      };

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      initialValues={initialValues}
      size={mergedTheme.size}
      requiredMark={mergedTheme.showRequiredMark}
      {...formLayoutProps}
    >
      {renderSections()}

      <Form.Item
        wrapperCol={
          mergedTheme.theme === 'inline'
            ? undefined
            : { offset: mergedTheme.labelCol?.span || 0, span: mergedTheme.wrapperCol?.span || 24 }
        }
      >
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {submitText}
          </Button>
          {showReset && (
            <Button onClick={handleReset} disabled={loading}>
              {resetText}
            </Button>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default DynamicForm;
