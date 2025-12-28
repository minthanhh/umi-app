import { Form, Select } from "antd"
import { XSelect } from "../components"
import { FetchRequest, FetchResponse } from "../types";
import { Project } from "@/pages/Home/types";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";

async function fetchProjects(request: FetchRequest): Promise<FetchResponse<Project>> {
  const { pageSize } = request;
  const params = new URLSearchParams({
    limit: String(pageSize),
  });
  const res = await fetch(`/api/v2/projects/options?${params}`);
  const data = await res.json();
  return data
}

const EMPTY_ARR = []

export const TestIds = memo(() => {
    const { data: options, isLoading } = useQuery({
      queryKey: ["projectIds"],
      queryFn: () => fetchProjects({ 
        pageSize: 100 
      }).then(res => res.data ?? EMPTY_ARR)
    })

    return (
        <Form.Item name="testIds" label="Test IDs">
            <XSelect.Dependent disabled={isLoading} loading={isLoading} name="testIds" dependsOn={"userIds"} options={options?.map(item => ({ label: item.name, value: item.id, parentValue: item.ownerId }))}>
              <Select
                mode="multiple"
                placeholder="Select tasks..."
                style={{ width: '100%' }}
              />
            </XSelect.Dependent>
        </Form.Item>
    )
})
