import { Card, message, Radio, Segmented, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import DynamicForm from './components/DynamicForm';
import type { DynamicFormConfig, FormTheme } from './types';

const { Title, Paragraph } = Typography;

// ============================================================================
// Example Form Configurations
// ============================================================================

const createFormConfig = (theme: FormTheme): DynamicFormConfig => ({
  theme: {
    theme,
    size: theme === 'compact' ? 'small' : 'middle',
    showRequiredMark: true,
  },
  submitText: 'Submit Form',
  resetText: 'Clear',
  showReset: true,
  sections: [
    {
      title: 'Basic Information',
      description: 'Enter your personal details below.',
      fields: [
        {
          name: 'firstName',
          label: 'First Name',
          type: 'input',
          placeholder: 'Enter your first name',
          rules: [{ required: true, message: 'First name is required' }],
          colSpan: 12,
          tooltip: 'Your legal first name',
        },
        {
          name: 'lastName',
          label: 'Last Name',
          type: 'input',
          placeholder: 'Enter your last name',
          rules: [{ required: true, message: 'Last name is required' }],
          colSpan: 12,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'input',
          placeholder: 'Enter your email address',
          rules: [
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Please enter a valid email' },
          ],
          colSpan: 12,
        },
        {
          name: 'age',
          label: 'Age',
          type: 'number',
          placeholder: 'Enter your age',
          min: 1,
          max: 120,
          colSpan: 12,
        },
        {
          name: 'bio',
          label: 'Biography',
          type: 'textarea',
          placeholder: 'Tell us about yourself...',
          rows: 3,
          maxLength: 500,
          showCount: true,
          colSpan: 24,
        },
      ],
    },
    {
      title: 'Selections',
      description: 'Choose from the available options.',
      fields: [
        {
          name: 'country',
          label: 'Country',
          type: 'select',
          placeholder: 'Select your country',
          options: [
            { label: 'United States', value: 'us' },
            { label: 'United Kingdom', value: 'uk' },
            { label: 'Canada', value: 'ca' },
            { label: 'Australia', value: 'au' },
            { label: 'Germany', value: 'de' },
            { label: 'France', value: 'fr' },
            { label: 'Japan', value: 'jp' },
            { label: 'Vietnam', value: 'vn' },
          ],
          showSearch: true,
          allowClear: true,
          colSpan: 12,
          rules: [{ required: true, message: 'Please select a country' }],
        },
        {
          name: 'skills',
          label: 'Skills',
          type: 'select',
          placeholder: 'Select your skills',
          mode: 'multiple',
          options: [
            { label: 'JavaScript', value: 'js' },
            { label: 'TypeScript', value: 'ts' },
            { label: 'React', value: 'react' },
            { label: 'Vue', value: 'vue' },
            { label: 'Angular', value: 'angular' },
            { label: 'Node.js', value: 'node' },
            { label: 'Python', value: 'python' },
            { label: 'Go', value: 'go' },
          ],
          colSpan: 12,
        },
        {
          name: 'user',
          label: 'Assign User',
          type: 'select-infinite',
          placeholder: 'Search and select a user...',
          infiniteConfig: {
            apiUrl: '/api/users',
            method: 'POST',
            searchParam: 'search',
            pageParam: 'current',
            pageSizeParam: 'pageSize',
            pageSize: 10,
            labelField: 'name',
            valueField: 'id',
            responseDataPath: 'data',
            responseTotalPath: 'total',
          },
          colSpan: 12,
          tooltip: 'This uses infinite scroll to load users',
        },
        {
          name: 'project',
          label: 'Assign Project',
          type: 'select-infinite',
          placeholder: 'Search and select a project...',
          infiniteConfig: {
            apiUrl: '/api/projects',
            method: 'GET',
            searchParam: 'search',
            pageParam: 'current',
            pageSizeParam: 'pageSize',
            pageSize: 10,
            labelField: 'name',
            valueField: 'id',
            responseDataPath: 'data',
            responseTotalPath: 'total',
          },
          colSpan: 12,
        },
      ],
    },
    {
      title: 'Date & Time',
      fields: [
        {
          name: 'birthDate',
          label: 'Birth Date',
          type: 'date',
          placeholder: 'Select your birth date',
          format: 'YYYY-MM-DD',
          colSpan: 12,
        },
        {
          name: 'availabilityRange',
          label: 'Availability',
          type: 'dateRange',
          format: 'YYYY-MM-DD',
          colSpan: 12,
        },
      ],
    },
    {
      title: 'Preferences',
      collapsible: true,
      defaultCollapsed: false,
      fields: [
        {
          name: 'experienceLevel',
          label: 'Experience Level',
          type: 'radio',
          options: [
            { label: 'Junior', value: 'junior' },
            { label: 'Mid-Level', value: 'mid' },
            { label: 'Senior', value: 'senior' },
            { label: 'Lead', value: 'lead' },
          ],
          optionType: 'button',
          colSpan: 24,
        },
        {
          name: 'interests',
          label: 'Interests',
          type: 'checkbox',
          options: [
            { label: 'Frontend', value: 'frontend' },
            { label: 'Backend', value: 'backend' },
            { label: 'DevOps', value: 'devops' },
            { label: 'Mobile', value: 'mobile' },
            { label: 'AI/ML', value: 'ai' },
          ],
          colSpan: 24,
        },
        {
          name: 'isRemote',
          label: 'Remote Work',
          type: 'switch',
          checkedChildren: 'Yes',
          unCheckedChildren: 'No',
          colSpan: 12,
        },
        {
          name: 'newsletter',
          label: 'Subscribe to Newsletter',
          type: 'checkbox',
          colSpan: 12,
        },
      ],
    },
  ],
});

// ============================================================================
// Component
// ============================================================================

const DynamicPage: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<FormTheme>('default');
  const [activeView, setActiveView] = useState<string>('Form Preview');

  const formConfig = useMemo(
    () => createFormConfig(selectedTheme),
    [selectedTheme],
  );

  const handleSubmit = (values: Record<string, unknown>) => {
    console.log('Form values:', values);
    message.success('Form submitted successfully!');
  };

  const handleReset = () => {
    message.info('Form has been reset');
  };

  return (
    <div>
      <div className="mb-6">
        <Title level={2} className="!mb-2">
          Dynamic Form
        </Title>
        <Paragraph className="text-gray-500">
          A configurable form component that renders fields based on JSON
          configuration. Supports multiple field types including infinite scroll
          select and various themes.
        </Paragraph>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Theme:</span>
            <Radio.Group
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="default">Default</Radio.Button>
              <Radio.Button value="compact">Compact</Radio.Button>
              <Radio.Button value="card">Card</Radio.Button>
              <Radio.Button value="inline">Inline</Radio.Button>
            </Radio.Group>
          </div>
          <Segmented
            value={activeView}
            onChange={(value) => setActiveView(value as string)}
            options={['Form Preview', 'Configuration']}
          />
        </div>
      </Card>

      {activeView === 'Form Preview' ? (
        <Card>
          <DynamicForm
            config={formConfig}
            onFinish={handleSubmit}
            onReset={handleReset}
            initialValues={{
              isRemote: true,
              experienceLevel: 'mid',
            }}
          />
        </Card>
      ) : (
        <Card>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px] text-sm">
            {JSON.stringify(formConfig, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default DynamicPage;
