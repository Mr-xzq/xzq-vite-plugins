<template>
  <div>
    <h1>hello world</h1>
    <contain-jsx-test1></contain-jsx-test1>
    <contain-jsx-test2></contain-jsx-test2>
    <not-contain-jsx-test1></not-contain-jsx-test1>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import ContainJsxTest1 from '@/containJsxVue/test1.vue';
import ContainJsxTest2 from '@/containJsxVue/test2.vue';
import NotContainJsxTest1 from '@/notContainJsxVue/test1.vue';

export default defineComponent({
  name: 'App',
  components: {
    ContainJsxTest1,
    ContainJsxTest2,
    NotContainJsxTest1,
  },
});
</script>
