# README

`@umijs/max` 模板项目，更多功能参考 [Umi Max 简介](https://umijs.org/docs/max/introduce)





Provider(initialValues, configs, adapter) -> Init store

const { onSyncStore } = useDependentField({ name: "abc" })

onChange -> setFieldsValue (antd) -> onSyncStore(value) - BG { name: abc, value } -> push event 

all depends on fields sub -> trigger adapter.setFieldsValue