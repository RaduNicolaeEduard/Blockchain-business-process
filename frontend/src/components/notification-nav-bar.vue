<template>
  <div style="padding-right: 1rem;">

    <div v-if="this.$keycloak.authenticated">
      <v-menu bottom min-width="200px" rounded offset-y>
        <template v-slot:activator="{ on }">
          <v-btn icon x-large v-on="on">
            <v-badge content="10" color="orange" overlap>
              <v-icon>mdi-bell</v-icon>
            </v-badge>
          </v-btn>
        </template>
        <v-card>
          <v-list-item-content class="justify-center">
            <div class="mx-auto text-center">
              <h3>Notifications</h3>
              <v-divider class="my-3"></v-divider>
              <!-- <v-btn depressed rounded text @click="$router.push('/userprofile')"> -->
              <v-btn depressed rounded text>
                Election That has started
              </v-btn>
              <v-divider class="my-3"></v-divider>
              <v-btn depressed rounded text>
                Election That has started
              </v-btn>
            </div>
          </v-list-item-content>
        </v-card>
      </v-menu>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    user: {
      initials: 'JD',
      fullName: 'John Doe',
      email: 'john.doe@doe.com',
    },
  }),
  methods: {
    TwoLetter() {
      let fullName = this.$keycloak.tokenParsed.name
      let initials = fullName.match(/\b\w/g) || []
      initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase()
      return initials
    },
    create_color_from_name() {
      let fullName = this.$keycloak.tokenParsed.name
      let hash = 0
      for (let i = 0; i < fullName.length; i++) {
        hash = fullName.charCodeAt(i) + ((hash << 5) - hash)
      }
      let color = '#'
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF
        color += ('00' + value.toString(16)).substr(-2)
      }
      return color
    },
    logout() {
      this.$keycloak.logout()
    },
    login() {
      this.$keycloak.login()
    },
  },
}
</script>