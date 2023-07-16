<template>
  <div>
    
  </div>
</template>

<script>

export default {
  name: 'Home',
  data() {
    return {
    }
  },
  methods: {
    GetAll(){

    },
    register() {
      this.$keycloak.register();
    },
    async getData() {
      this.$store.dispatch('setMessage', "Hello from the store!" + Date.now())
    },
  },
  components: {
  },
}
</script>
