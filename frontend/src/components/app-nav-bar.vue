<script>
import userProfileNav from './user-profile-nav.vue'
import notificatioNnav from './notification-nav-bar.vue'
export default {
  name: 'app-navbar',
  components: {
    userProfileNav,
    notificatioNnav
  },
  data: () => ({
    drawer: null,
    group: null,
  }),
  methods: {
  }
}
</script>
<template>
  <div>
    <v-app-bar app>
      <v-app-bar-nav-icon @click="drawer = true"></v-app-bar-nav-icon>
      <v-toolbar-title>SIGN</v-toolbar-title>
      <!-- Buttons for login and Logout -->
      <v-spacer></v-spacer>
      <!-- Notification Icon with number of 10 notifications-->
      <!-- Profile not set up button with red -->
      <v-chip v-if="this.$keycloak.authenticated && !this.$keycloak.tokenParsed.hasOwnProperty('awaiting_validation')"
        @click="$router.push({ name: 'profilesetup' })" class="ma-2" color="red accent-4" outlined>
        <v-icon left>
          mdi-alert-circle-outline
        </v-icon>
        Complete Profile
      </v-chip>
      <v-chip v-else-if="this.$keycloak.authenticated && this.$keycloak.tokenParsed['awaiting_validation'] == true"
        class="ma-2" color="orange accent-4" outlined>
        <v-icon left>
          mdi-sync-alert
        </v-icon>
        Awaiting validation
      </v-chip>
      <notificatioNnav />
      <userProfileNav />
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app temporary>
      <!-- Greet User -->
      <v-list-item v-if="this.$keycloak.authenticated">
        <v-list-item-content>
          <v-list-item-title>
            <h3>
              Welcome {{ this.$keycloak.tokenParsed.given_name }}
            </h3>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider v-if="this.$keycloak.authenticated"></v-divider>
      <v-list nav dense>
        <v-list-item-group v-model="group" active-class="text--accent-4">
          <v-list-item @click="$router.push({ name: 'home' })">
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$router.push({ name: 'elections' })">
            <v-list-item-icon>
              <v-icon>mdi-ballot</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Elections</v-list-item-title>
          </v-list-item>
          <v-list-item @click="$router.push({ name: 'myelections' })">
            <v-list-item-icon>
              <v-icon>mdi-ballot</v-icon>
            </v-list-item-icon>
            <v-list-item-title>My Elections</v-list-item-title>
          </v-list-item>
          <!-- <v-list-item v-if="this.$keycloak.authenticated && this.$keycloak.tokenParsed.is_staff"> -->
          <v-list-item v-if="this.$keycloak.authenticated" @click="$router.push({ name: 'admin' })">
            <v-list-item-icon>
              <v-icon>mdi-shield-crown</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Admin</v-list-item-title>
          </v-list-item>
          <v-list-item v-if="this.$keycloak.authenticated && this.$keycloak.tokenParsed.allowed_to_vote">
            <v-list-item-icon>
              <v-icon>mdi-vote</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Vote</v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>