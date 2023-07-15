<template>
  <v-app>
    <v-progress-linear indeterminate v-if="$store.getters.loading" style="z-index:1000; position:fixed;"></v-progress-linear>
    <appnavbar/>
    <alert/>
    <erroralert/>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import appnavbar from '@/components/app-nav-bar.vue'
import alert from '@/components/alert-component.vue'
import erroralert from '@/components/error-alert.vue'
export default {
  name: 'App',
  components: {
    appnavbar,
    alert,
    erroralert
    },
  methods: {
  },
  data: () => ({
  }),
};
</script>
