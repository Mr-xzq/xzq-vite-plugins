<script>
export default {
  setup() {
    const dom = <h2 id="contain-jsx-test1">contain-jsx-test1</h2>;
    return () => {
      return <div>{dom}</div>;
    };
  },
};
</script>
