import { Form, Select } from "antd"
import { SelectProvider } from "../context"
import { SelectDependent } from "../SelectDependent/SelectDependent";

export const AntdDemo = () => {
    const [form] = Form.useForm();
    return (
        <SelectProvider adapter={{}} initialValues={{}} config={{}}>
            <Form form={form}>
                <Form.Item name="userIds" label="User IDs">
                    <SelectDependent dependsOn={[]}>
                        <Select />
                    </SelectDependent>
                </Form.Item>
                <Form.Item name="projectIds" label="Project IDs">
                    <SelectDependent options={[]} dependsOn={["userIds"]} fieldName="projectIds">
                        <Select
                            allowClear
                            showSearch
                        />
                    </SelectDependent>
                </Form.Item>
            </Form>
        </SelectProvider>
    )
}