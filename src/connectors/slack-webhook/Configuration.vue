<template>
  <div>
    <form-element
        type="md-input"
        name="url"
        label="Webhook URL"
        placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
        validate="required,url"
    >
    </form-element>
    <form-element
      type="md-checkbox"
      name="bigImages"
      label="Use big images"
    ></form-element>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        title: undefined,
      };
    }
  };
</script>