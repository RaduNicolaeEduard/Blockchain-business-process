<template>
  <v-card>
    <v-tabs v-model="tab" centered icons-and-text>
      <v-tabs-slider></v-tabs-slider>

      <v-tab href="#tab-1">
        Verify Elections
        <v-icon>mdi-phone</v-icon>
      </v-tab>

      <v-tab href="#tab-2">
        Verify Voters
        <v-icon>mdi-heart</v-icon>
      </v-tab>

    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-container>
      <v-tab-item  key="1" value='tab-1'>

          <v-card flat>
            <adminvalidate />
          </v-card>
        </v-tab-item>
      </v-container>
      <v-tab-item key="2" value='tab-2'>
        <v-card flat>
        <v-container>
        <v-card-text>{{ text }}</v-card-text>
      </v-container>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-card>
</template>

<script>
import adminvalidate from '../components/admin-validate.vue'
export default {
  components: {
    adminvalidate
  },
  data() {
    return {
      tab: null,
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    }
  },
}
</script>
